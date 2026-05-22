'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/* ========================================================================== */
/* #region LOGIN PAGE Controller */
/* ========================================================================== */
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

/* ========================================================================== */
/* #region PROFILE & AVATAR Controller */
/* ========================================================================== */

// 1. Ambil Data Profil Aktif (Termasuk Avatar)
export async function getCurrentProfile() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized: Pengguna tidak terautentikasi')
    }

    // Ambil field avatar_url juga bray
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, nik, avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError) throw new Error(`Gagal memuat profil: ${profileError.message}`)

    return { success: true, profile }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 2. Upload & Update Foto Profil ke Supabase Storage
export async function updateAvatarAction(formData: FormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const file = formData.get('avatar') as File
    if (!file) throw new Error('File gambar tidak ditemukan')

    // Generate nama file unik menggunakan ID user agar tidak menumpuk
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `profile-pictures/${fileName}`

    // Ubah file menjadi buffer agar bisa diupload via Server Action
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload ke bucket bernama 'avatars'
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) throw uploadError

    // Ambil Public URL dari file yang diupload
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update kolom avatar_url di tabel profiles
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

export async function logoutAction() {
  try {
    const supabase = await createClient()
    
    // Proses sign out sesi di sisi server Supabase Auth
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Tambahkan fungsi ini di bagian paling bawah file actions/auth.ts bray!

export async function updateProfileNameAction(fullName: string) {
  if (!fullName || fullName.trim() === '') {
    return { success: false, error: 'Nama lengkap tidak boleh kosong bray!' }
  }

  try {
    const supabase = await createClient()

    // 1. Ambil session user yang sedang aktif
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Sesi user tidak ditemukan atau kedaluwarsa.')

    // 2. Update kolom full_name di tabel profiles berdasarkan id user
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