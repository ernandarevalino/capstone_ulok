'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi Supabase Admin Client menggunakan Service Role Key bray!
// Ini wajib supaya Super Admin bisa daftarin & hapus auth user lain tanpa bikin sesi dirinya sendiri logout.
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

// =========================================================================
// 1. READ USERS BY ROLE (Diperbarui menggunakan supabaseAdmin biar makin ngebut)
// =========================================================================
export async function getUsersByRoleAction({ role, search = '', page = 1, limit = 15 }: GetUsersParams) {
  try {
    // Hitung titik awal (from) dan akhir (to) untuk limit baris
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Query dasar filter berdasarkan role menggunakan admin client
    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' }) // count exact untuk tahu total data asli di DB
      .eq('role', role)

    // Jika ada keyword search, filter nama atau NIK (Case Insensitive)
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,nik.ilike.%${search}%`)
    }

    // Urutkan dari yang terbaru dibuat dan ambil range barisnya
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

// =========================================================================
// 2. DASHBOARD STATS (Fungsi asli lu tetap dipertahankan aman bray!)
// =========================================================================
export async function getDashboardStatsAction() {
  try {
    // 1. Hitung total Admin Cabang
    const { count: totalCabang, error: err1 } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin_cabang')

    // 2. Hitung total Assessor
    const { count: totalAssessor, error: err2 } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'assessor')

    // 3. Hitung total Usulan Lokasi (ULOK) masuk
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

// =========================================================================
// 3. CREATE USER BARU (Fungsi penambahan baru untuk Pop-up Add)
// =========================================================================
interface CreateUserParams {
  email: string
  password: string
  fullName: string
  nik: string
  role: 'admin_cabang' | 'assessor'
}

export async function createUserAction({ email, password, fullName, nik, role }: CreateUserParams) {
  try {
    // A. Daftarkan akun ke Supabase Auth Server secara direct (Auto Confirm Email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("Gagal membuat kredensial auth user baru.")

    // B. Masukkan data detail profile-nya ke tabel profiles public schema lu bray
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
      // Jika penulisan tabel profile gagal, rollback hapus user auth biar tidak jadi data sampah bray
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =========================================================================
// 4. UPDATE USER DATA & RESET AVATAR (VERSI FIX ANTI-DUPLICATE NIK 🚀)
// =========================================================================
interface UpdateUserParams {
  id: string
  fullName: string
  nik: string
  deleteAvatar: boolean
}

export async function updateUserAction({ id, fullName, nik, deleteAvatar }: UpdateUserParams) {
  try {
    // 1. Ambil data lama user dari database terlebih dahulu bray
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, nik')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) throw new Error("Data pengguna tidak ditemukan.")

    // 2. Siapkan payload update kosong
    const updatePayload: any = {}

    // 3. Hanya masukkan full_name jika ada perubahan dari data lama
    if (fullName.trim() !== existingUser.full_name) {
      updatePayload.full_name = fullName.trim()
    }

    // 4. Hanya masukkan nik jika benar-benar diubah oleh Super Admin
    if (nik.trim() !== existingUser.nik) {
      updatePayload.nik = nik.trim()
    }

    // 5. Jika Super Admin mencentang kotak hapus foto, masukkan ke payload
    if (deleteAvatar) {
      updatePayload.avatar_url = null
    }

    // 6. Jika tidak ada perubahan sama sekali, langsung return sukses tanpa buang-buang query bray
    if (Object.keys(updatePayload).length === 0) {
      return { success: true }
    }

    // 7. Eksekusi update hanya untuk data yang berubah saja!
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

// =========================================================================
// 5. DELETE USER TOTAL (Fungsi penambahan baru untuk Pop-up Hapus)
// =========================================================================
export async function deleteUserAction(id: string) {
  try {
    // A. Karena ada Foreign Key Cascade / Manual Constraint, hapus dulu data baris di tabel profiles
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileErr) throw profileErr

    // B. Setelah datanya bersih, baru hapus data akun login user tersebut di server auth utama
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (authErr) throw authErr

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}