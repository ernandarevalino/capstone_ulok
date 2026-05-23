'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Inisialisasi Supabase Admin Client menggunakan Service Role Key.
 * Penggunaan Service Role Key sangat krusial pada modul Super Admin agar sistem dapat 
 * melakukan pengelolaan akun pengguna lain (seperti pendaftaran, pembaruan data, dan penghapusan) 
 * via bypass mekanisme Row Level Security (RLS) tanpa mengganggu atau mengeluarkan sesi login Super Admin yang sedang aktif.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface GetUsersParams {
  role: 'admin_cabang' | 'assessor'
  search?: string
  page?: number
  limit?: number
}

/* ========================================================================= */
/* #region 1. READ USERS BY ROLE (PAGINATION & SEARCH FILTER) */
/* ========================================================================= */

/**
 * Mengambil daftar data pengguna dari tabel 'profiles' berdasarkan hak akses (role) tertentu.
 * Mendukung fitur pencarian data secara realtime serta pembatasan baris data (pagination).
 * * @param params - Objek konfigurasi parameter filter (role, keyword search, page, limit).
 * @returns Objek response status operasi beserta array data profil dan metadata kalkulasi halaman.
 */
export async function getUsersByRoleAction({ role, search = '', page = 1, limit = 15 }: GetUsersParams) {
  try {
    // Melakukan kalkulasi offset baris database berdasarkan halaman aktif
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Membangun query dasar dengan instruksi penghitungan jumlah total data secara eksak
    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' }) 
      .eq('role', role)

    // Penerapan klausa penyaringan apabila pengguna memasukkan kata kunci pencarian (Case Insensitive)
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,nik.ilike.%${search}%`)
    }

    // Eksekusi query dengan pengurutan berdasarkan rekaman data terbaru
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      success: true,
      data: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (error: any) {
    return { success: false, error: error.message, data: [], totalCount: 0, totalPages: 0 }
  }
}

/* ========================================================================= */
/* #region 2. DASHBOARD STATISTIK GLOBAL */
/* ========================================================================= */

/**
 * Mengambil akumulasi kuantitas data master dari keseluruhan tabel sistem.
 * Digunakan untuk menyajikan visualisasi ringkasan statistik pada halaman dashboard utama Super Admin.
 * * @returns Objek berisi total kuantitas masing-masing entitas data.
 */
export async function getDashboardStatsAction() {
  try {
    // 1. Mengambil total kuantitas data pengguna dengan hak akses Admin Cabang
    const { count: totalCabang, error: err1 } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin_cabang')

    // 2. Mengambil total kuantitas data pengguna dengan hak akses Assessor
    const { count: totalAssessor, error: err2 } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'assessor')

    // 3. Mengambil total berkas pendaftaran usulan lokasi (ULOK) yang tersimpan di dalam sistem
    const { count: totalUlok, error: err3 } = await supabaseAdmin
      .from('ulok_submissions')
      .select('*', { count: 'exact', head: true })

    if (err1 || err2 || err3) throw new Error("Gagal mengambil data statistik dashboard")

    return {
      success: true,
      stats: {
        adminCabang: totalCabang || 0,
        assessor: totalAssessor || 0,
        totalUlok: totalUlok || 0,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message, stats: { adminCabang: 0, assessor: 0, totalUlok: 0 } }
  }
}

/* ========================================================================= */
/* #region 3. CREATE USER (REGISTRASI AKUN LOGIN & PROFIL BARU) */
/* ========================================================================= */
interface CreateUserParams {
  email: string
  password: string
  fullName: string
  nik: string
  role: 'admin_cabang' | 'assessor'
}

/**
 * Mendaftarkan akun login baru ke dalam auth server sistem, sekaligus menginisialisasi 
 * baris profile barunya ke dalam skema tabel publik.
 * * @param params - Objek payload berisikan kredensial login dan identitas karyawan.
 * @returns Objek status sukses atau kegagalan transaksi data.
 */
export async function createUserAction({ email, password, fullName, nik, role }: CreateUserParams) {
  try {
    // A. Menyimpan kredensial ke dalam layanan Supabase Auth dengan status konfirmasi email otomatis (Direct Aktivasi)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

  if (authError) throw authError
  if (!authData.user) throw new Error("Gagal membuat kredensial auth user baru.")

    // B. Menyisipkan relasi data informasi profil fisik ke dalam tabel 'profiles' publik memakai UUID dari Auth Service
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          full_name: fullName,
          nik: nik,
          role: role
        }
      ])

    if (profileError) {
      // Mekanisme Rollback: Menghapus kembali akun pada Auth Service jika proses penulisan profil publik gagal,
      // demi mencegah terjadinya inkonsistensi data (data sampah) pada storage database.
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/* ========================================================================= */
/* #region 4. UPDATE USER DATA & RESET AVATAR (OPTIMALISASI CEK INTEGRITAS) */
/* ========================================================================= */
interface UpdateUserParams {
  id: string
  fullName: string
  nik: string
  deleteAvatar: boolean
}

/**
 * Memperbarui data parsial pengguna. Fungsi ini dilengkapi validasi komparasi data lama
 * guna menghindari terjadinya error redundansi data atau pemicuan query kosong ke database.
 * * @param params - Objek data pembaruan identitas beserta status pengaturan ulang foto profil.
 * @returns Objek konfirmasi penyelesaian pembaruan data.
 */
export async function updateUserAction({ id, fullName, nik, deleteAvatar }: UpdateUserParams) {
  try {
    // 1. Memuat salinan rekaman data pengguna yang ada saat ini dari database
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, nik')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) throw new Error("Data pengguna tidak ditemukan.")

    // 2. Inisialisasi wadah objek payload dinamis
    const updatePayload: any = {}

    // 3. Verifikasi pembaruan field nama lengkap
    if (fullName.trim() !== existingUser.full_name) {
      updatePayload.full_name = fullName.trim()
    }

    // 4. Verifikasi pembaruan field Nomor Induk Karyawan (NIK)
    if (nik.trim() !== existingUser.nik) {
      updatePayload.nik = nik.trim()
    }

    // 5. Pemeriksaan instruksi penghapusan berkas foto profil (reset ke default avatar)
    if (deleteAvatar) {
      updatePayload.avatar_url = null
    }

    // 6. Optimasi Query: Jika tidak ada perubahan data terdeteksi, operasi database dihentikan dan mengembalikan status sukses
    if (Object.keys(updatePayload).length === 0) {
      return { success: true }
    }

    // 7. Melakukan eksekusi pembaruan data secara selektif (hanya memproses kolom yang berubah)
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/* ========================================================================= */
/* #region 5. DELETE USER TOTAL (MANUAL CASCADE REMOVAL) */
/* ========================================================================= */

/**
 * Menghapus entitas data pengguna secara permanen dari sistem (mencakup data profil publik dan akun login).
 * * @param id - String UUID dari pengguna yang akan dihapus.
 * @returns Objek konfirmasi status penyelesaian penghapusan akun.
 */
export async function deleteUserAction(id: string) {
  try {
    // A. Menjalankan penghapusan data relasi pada tabel 'profiles' terlebih dahulu untuk menghindari benturan konstrain integritas database
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileErr) throw profileErr

    // B. Menghapus data akun autentikasi utama pada core server Auth Supabase setelah tabel profile bersih
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (authErr) throw authErr

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}