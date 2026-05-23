'use server'

import { createClient } from '@/utils/supabase/server'

/* ========================================================================== */
/* #region PROCESS AUTENTIKASI (LOGIN & LOGOUT) */
/* ========================================================================== */

/**
 * Mengandalkan kredensial email dan password untuk masuk ke dalam sistem.
 * Melakukan verifikasi data pada Supabase Auth sekaligus mencocokkan hak akses (role) pengguna.
 * * @param formData - Objek data form bawaan dari elemen HTML Form.
 * @returns Objek status sukses beserta string hak akses (role) atau pesan kesalahan (error).
 */
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validasi awal memastikan field input tidak kosong
  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi' }
  }

  try {
    const supabase = await createClient()
    
    // 1. Melakukan proses autentikasi via Supabase Auth Service
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // 2. Mengambil data hak akses (role) dari tabel 'profiles' berdasarkan ID pengguna yang berhasil login
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

/**
 * Menghapus sesi aktif pengguna (token/cookie) di sisi server Supabase Auth.
 * * @returns Objek status operasi berupa nilai boolean sukses atau pesan kesalahan.
 */
export async function logoutAction() {
  try {
    const supabase = await createClient()
    
    // Memutus hubungan sesi enkripsi token pada server
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/* ========================================================================== */
/* #region MANAJEMEN DATA PROFIL & AVATAR */
/* ========================================================================== */

/**
 * Mengambil data entitas profil dari pengguna yang sedang aktif dan terverifikasi di dalam sesi browser.
 * Diperbarui untuk melakukan relational JOIN guna memuat informasi detail wilayah dari tabel 'branches'.
 * * @returns Objek status sukses beserta record profil lengkap (nama, role, NIK, URL avatar, dan data objek cabang).
 */
export async function getCurrentProfile() {
  try {
    const supabase = await createClient()

    // 1. Memeriksa validitas sesi token JWT dari pengguna saat ini
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized: Pengguna tidak terautentikasi')
    }

    // 2. Query ke tabel database menggunakan teknik INNER/LEFT JOIN untuk memuat data master wilayah cabang
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

/**
 * Mengunggah file gambar ke dalam Supabase Storage Bucket, menghasilkan URL publik,
 * kemudian memperbarui referensi string URL foto profil pada tabel database pengguna.
 * * @param formData - Objek form yang membawa berkas (file) gambar avatar.
 * @returns Objek status sukses beserta URL publik gambar yang baru diunggah.
 */
export async function updateAvatarAction(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // 1. Memastikan pengguna memiliki sesi aktif sebelum diizinkan mengunggah file
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // 2. Validasi keberadaan file gambar di dalam struktur FormData
    const file = formData.get('avatar') as File
    if (!file) throw new Error('File gambar tidak ditemukan')

    // 3. Membuat nama file unik (menggabungkan ID pengguna dan timestamp) guna menghindari duplikasi
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `profile-pictures/${fileName}`

    // 4. Konversi struktur file mentah menjadi ArrayBuffer/Buffer agar aman ditransmisikan lewat Next.js Server Action
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 5. Eksekusi pengunggahan objek biner file ke dalam storage bucket bernama 'avatars'
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true // Melakukan overwrite jika terdapat jalur file yang sama persis
      })

    if (uploadError) throw uploadError

    // 6. Resolusi alamat berkas untuk mendapatkan tautan URL Publik (Public URL)
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // 7. Sinkronisasi data alamat URL publik baru ke dalam kolom 'avatar_url' pada tabel 'profiles'
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

/**
 * Memperbarui data teks nama lengkap pengguna secara mandiri langsung dari halaman pengaturan profil.
 * * @param fullName - String nama baru yang diinput oleh pengguna.
 * @returns Objek status sukses atau pesan kesalahan dari server database.
 */
export async function updateProfileNameAction(fullName: string) {
  // Validasi untuk memastikan nilai string input tidak kosong atau hanya berisi spasi kosong (whitespace)
  if (!fullName || fullName.trim() === '') {
    return { success: false, error: 'Nama lengkap tidak boleh kosong!' }
  }

  try {
    const supabase = await createClient()

    // 1. Memvalidasi token sesi pengguna aktif
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Sesi user tidak ditemukan atau kedaluwarsa.')

    // 2. Menjalankan operasi UPDATE pada kolom 'full_name' berdasarkan klausa ID pengguna
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