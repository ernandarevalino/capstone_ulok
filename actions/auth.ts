'use server'

import { createClient } from '@/utils/supabase/server'

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
    
    return { success: true, role: profile.role }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: LOGOUT ===
export async function logoutAction() {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
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
