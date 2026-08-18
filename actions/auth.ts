'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendResetPasswordEmail } from '@/utils/email'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// === ACTIONS: LOGIN ===
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi' }
  }

  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (profileError) throw new Error(`Gagal memuat profil pengguna: ${profileError.message}`)
    
    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === 'production'

    let defaultPath = '/admin/cabang'
    if (profile.role === 'super_admin') {
      defaultPath = '/admin/super-admin'
    } else if (profile.role === 'assessor') {
      defaultPath = '/admin/assessor'
    } else if (profile.role === 'admin_cabang') {
      defaultPath = '/admin/cabang'
    }

    cookieStore.set('last_activity_at', Date.now().toString(), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
    })

    cookieStore.set('last_visited_path', defaultPath, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
    })

    return { success: true, role: profile.role }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: LOGOUT ===
export async function logoutAction() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('[logoutAction] Error during signOut:', error)
  }

  try {
    const cookieStore = await cookies()
    cookieStore.delete('last_activity_at')
    cookieStore.delete('last_visited_path')
  } catch (error) {
    console.error('[logoutAction] Error deleting cookies:', error)
  }

  redirect('/login')
}

// === ACTIONS: AMBIL PROFIL AKTIF ===
export async function getCurrentProfile() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized: Pengguna tidak terautentikasi')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        role, 
        nik, 
        avatar_url,
        branch_id,
        branches (
          id,
          nama_cabang,
          kabupaten_kota,
          provinsi
        )
      `)
      .eq('id', user.id)
      .single()

    if (profileError) throw new Error(`Gagal memuat profil: ${profileError.message}`)

    return { success: true, profile }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: UPDATE AVATAR ===
export async function updateAvatarAction(formData: FormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const file = formData.get('avatar') as File
    if (!file) throw new Error('File gambar tidak ditemukan')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `profile-pictures/${fileName}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) throw updateError

    return { success: true, avatarUrl: publicUrl }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: UPDATE NAMA PROFIL ===
export async function updateProfileNameAction(fullName: string) {
  if (!fullName || fullName.trim() === '') {
    return { success: false, error: 'Nama lengkap tidak boleh kosong!' }
  }

  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Sesi user tidak ditemukan atau kedaluwarsa.')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id)

    if (updateError) throw updateError

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: REQUEST PASSWORD RESET ===
export async function requestPasswordResetAction(email: string) {
  if (!email || email.trim() === '') {
    return { success: false, error: 'Email wajib diisi.' }
  }

  try {
    const supabase = await createClient()

    // 1. Check if email exists in profiles table using RPC get_profile_by_email
    const { data: profileList, error: rpcError } = await supabase.rpc('get_profile_by_email', {
      email_to_check: email.trim(),
    })

    if (rpcError) {
      console.error('[Reset Password] RPC Error:', rpcError)
      throw new Error(`Gagal memverifikasi email: ${rpcError.message}`)
    }

    if (!profileList || profileList.length === 0) {
      return { success: false, error: 'Email tidak terdaftar dalam sistem PRISMA!' }
    }

    const profile = profileList[0]

    // 2. Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceKey || serviceKey.trim() === '') {
      throw new Error('Kritikal: SUPABASE_SERVICE_ROLE_KEY tidak tersedia di Server!')
    }

    const supabaseAdmin = createAdminClient(supabaseUrl!, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 3. Construct dynamic origin
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";

    // Automatically uses Vercel URL, NEXT_PUBLIC_APP_URL, or current host header
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    // 4. Generate recovery link using admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim(),
      options: {
        redirectTo: `${origin}/login/lupasandi/reset`,
      },
    })

    if (linkError) {
      console.error('[Reset Password] Link Generation Error:', linkError)
      throw new Error(`Gagal membuat tautan pemulihan: ${linkError.message}`)
    }

    if (!linkData || !linkData.properties || !linkData.properties.action_link) {
      throw new Error('Gagal menghasilkan tautan pemulihan dari auth provider.')
    }

    const resetLink = linkData.properties.action_link

    // 5. Send Email via Gmail SMTP Nodemailer
    const emailRes = await sendResetPasswordEmail({
      to: email.trim(),
      resetLink,
      userName: profile.full_name,
    })

    if (!emailRes.success) {
      throw new Error(emailRes.error || 'Gagal mengirimkan email pemulihan.')
    }

    return {
      success: true,
      message: 'Pemulihan kata sandi sukses dikirim ke email Anda.',
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: UPDATE PASSWORD ===
export async function updatePasswordAction(newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Kata sandi baru minimal harus 6 karakter.' }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
