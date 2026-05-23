'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface GetUsersParams {
  role: 'admin_cabang' | 'assessor'
  search?: string
  page?: number
  limit?: number
  branchFilter?: string
}

/* ========================================================================= */
/* #region 1. READ USERS BY ROLE */
/* ========================================================================= */
export async function getUsersByRoleAction({ role, search = '', page = 1, limit = 7, branchFilter = '' }: GetUsersParams) {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        nik,
        role,
        created_at,
        avatar_url,
        branch_id,
        branches (
          id,
          nama_cabang,
          kabupaten_kota,
          provinsi
        )
      `, { count: 'exact' })
      .eq('role', role)

    if (branchFilter) {
      query = query.eq('branch_id', parseInt(branchFilter))
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,nik.ilike.%${search}%`)
    }

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

export async function getAllBranchesAction() {
  try {
    const { data, error } = await supabaseAdmin
      .from('branches')
      .select('id, nama_cabang, kabupaten_kota, provinsi')
      .order('id', { ascending: true })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

/* ========================================================================= */
/* #region 2. DASHBOARD STATISTIK */
/* ========================================================================= */
export async function getDashboardStatsAction() {
  try {
    const { count: totalCabang, error: err1 } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin_cabang')

    const { count: totalAssessor, error: err2 } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'assessor')

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
/* #region 3. CREATE USER (OTOMATIS CONVERT NIK JADI EMAIL LOGIN) */
/* ========================================================================= */
interface CreateUserParams {
  password: string
  fullName: string
  nik: string
  role: 'admin_cabang' | 'assessor'
  branchId?: number | null
}

export async function createUserAction({ password, fullName, nik, role, branchId }: CreateUserParams) {
  try {
    const cleanNik = nik.trim();
    
    // 1. Validasi Awal: Cek apakah NIK sudah dipakai di tabel profiles
    const { data: existingNik } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('nik', cleanNik)
      .maybeSingle();

    if (existingNik) {
      return { success: false, error: `NIK ${cleanNik} sudah terdaftar di sistem!` };
    }

    // 2. Auto-generate email login resmi perusahaan berbasis NIK
    const generatedEmail = `${cleanNik}@alfamidi.com`;

    // 3. Daftarkan ke Supabase Auth Service
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: generatedEmail,
      password: password,
      email_confirm: true
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("Gagal membuat kredensial auth user baru.")

    // 4. Masukkan data ke tabel profiles publik
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          full_name: fullName.trim(),
          nik: cleanNik,
          role: role,
          branch_id: branchId || null
        }
      ])

    if (profileError) {
      // Rollback Auth jika input ke profile gagal
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/* ========================================================================= */
/* #region 4. UPDATE USER DATA (SINKRONISASI UPDATE NIK KE EMAIL AUTH) */
/* ========================================================================= */
interface UpdateUserParams {
  id: string
  fullName: string
  nik: string
  deleteAvatar: boolean
  branchId?: number | null
}

export async function updateUserAction({ id, fullName, nik, deleteAvatar, branchId }: UpdateUserParams) {
  try {
    const cleanNik = nik.trim();

    // 1. Ambil data profil lama di database
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, nik, branch_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) throw new Error("Data pengguna tidak ditemukan.")

    // 2. Validasi Duplikasi NIK jika NIK diganti
    if (cleanNik !== existingUser.nik) {
      const { data: duplicateNik } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('nik', cleanNik)
        .neq('id', id) // Kecualikan user diri sendiri
        .maybeSingle();

      if (duplicateNik) {
        return { success: false, error: `Gagal ubah data! NIK ${cleanNik} sudah digunakan oleh karyawan lain.` };
      }
    }

    // 3. Jika NIK berubah, perbarui EMAIL UTAMA di Supabase Auth Core Service secara paksa
    if (cleanNik !== existingUser.nik) {
      const newGeneratedEmail = `${cleanNik}@alfamidi.com`;
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        email: newGeneratedEmail
      });

      if (authUpdateError) {
        throw new Error(`Gagal menyelaraskan email login baru: ${authUpdateError.message}`);
      }
    }

    // 4. Siapkan payload update untuk tabel profiles publik
    const updatePayload: any = {}

    if (fullName.trim() !== existingUser.full_name) {
      updatePayload.full_name = fullName.trim()
    }
    if (cleanNik !== existingUser.nik) {
      updatePayload.nik = cleanNik
    }
    if (deleteAvatar) {
      updatePayload.avatar_url = null
    }
    if (branchId !== existingUser.branch_id) {
      updatePayload.branch_id = branchId || null
    }

    // Jika tidak ada perubahan data fisik, hentikan eksekusi
    if (Object.keys(updatePayload).length === 0) {
      return { success: true }
    }

    // 5. Jalankan update di tabel profiles publik
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
/* #region 5. DELETE USER TOTAL */
/* ========================================================================= */
export async function deleteUserAction(id: string) {
  try {
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileErr) throw profileErr

    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (authErr) throw authErr

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}