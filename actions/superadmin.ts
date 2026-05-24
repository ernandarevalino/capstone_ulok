'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi Supabase Client dengan Service Role Key untuk bypass RLS (Row Level Security)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Interface untuk parameter pencarian user
interface GetUsersParams {
  role: 'admin_cabang' | 'assessor'
  search?: string
  page?: number
  limit?: number
  branchFilter?: string
}

/* ========================================================================= */
/* #region 1. FITUR MANAJEMEN NOTIFIKASI SISTERM */
/* ========================================================================= */

/**
 * Ubah dari async function biasa menjadi export async function
 * agar bisa di-import oleh file action lain (seperti action berkas/ulok)
 */
export async function createNotification(title: string, message: string) {
  try {
    await supabaseAdmin.from('notifications').insert([{ title, message }]);
  } catch (err) {
    console.error("Gagal mencatat log notifikasi ke database:", err);
  }
}

/**
 * Mengambil daftar seluruh notifikasi terbaru (Maksimal 100 baris dikontrol oleh DB Trigger)
 */
export async function getNotificationsAction() {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, title, message, is_read, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Menghapus satu record data notifikasi berdasarkan ID spesifik
 */
export async function deleteNotificationAction(id: number) {
  try {
    const { error } = await supabaseAdmin.from('notifications').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Mengubah status semua notifikasi yang belum dibaca menjadi sudah dibaca
 */
export async function markAllNotificationsAsReadAction() {
  try {
    const { error } = await supabaseAdmin.from('notifications').update({ is_read: true }).eq('is_read', false);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/* ========================================================================= */
/* #region 2. READ USERS BY ROLE (WITH FILTER & PAGINATION) */
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
/* #region 3. DASHBOARD STATISTIK */
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
/* #region 4. CREATE USER (AUTO CONVERT NIK TO EMAIL LOGIN) */
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
    
    const { data: existingNik } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('nik', cleanNik)
      .maybeSingle();

    if (existingNik) {
      return { success: false, error: `NIK ${cleanNik} sudah terdaftar di sistem!` };
    }

    const generatedEmail = `${cleanNik}@alfamidi.com`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: generatedEmail,
      password: password,
      email_confirm: true
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("Gagal membuat kredensial auth user baru.")

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
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    // Pemicu otomatis log notifikasi ke sistem pusat superadmin
    const roleLabel = role === 'admin_cabang' ? 'Admin Cabang' : 'Assessor';
    await createNotification(
      'Pengguna Baru Terdaftar',
      `Berhasil menambahkan ${roleLabel} baru atas nama ${fullName.trim()} (NIK: ${cleanNik}).`
    );

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/* ========================================================================= */
/* #region 5. UPDATE USER DATA (WITH AUTO NOTIFICATION TRIGGER) */
/* ========================================================================= */

interface UpdateUserParams {
  id: string
  fullName: string
  nik: string
  deleteAvatar: boolean
  branchId?: number | null
  password?: string // ✏️ Tambahkan opsional password di interface
}

export async function updateUserAction({ id, fullName, nik, deleteAvatar, branchId, password }: UpdateUserParams) {
  try {
    const cleanNik = nik.trim();

    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, nik, role, branch_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) throw new Error("Data pengguna tidak ditemukan.")

    if (cleanNik !== existingUser.nik) {
      const { data: duplicateNik } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('nik', cleanNik)
        .neq('id', id)
        .maybeSingle();

      if (duplicateNik) {
        return { success: false, error: `Gagal ubah data! NIK ${cleanNik} sudah digunakan oleh karyawan lain.` };
      }
    }

    // 🔥 PROSES UPDATE KREDENSIAL AUTH (EMAIL & PASSWORD) SECARA EFISIEN
    const authUpdatePayload: any = {}
    
    if (cleanNik !== existingUser.nik) {
      authUpdatePayload.email = `${cleanNik}@alfamidi.com`
    }
    if (password && password.trim() !== '') {
      authUpdatePayload.password = password.trim()
    }

    if (Object.keys(authUpdatePayload).length > 0) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdatePayload);
      if (authUpdateError) {
        throw new Error(`Gagal menyelaraskan kredensial login baru: ${authUpdateError.message}`);
      }
    }

    // PROSES UPDATE DATA PROFIL DATABASE
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

    // Jika tidak ada perubahan di profil database & auth, langsung return sukses
    if (Object.keys(updatePayload).length === 0 && !authUpdatePayload.password) {
      return { success: true }
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', id)

      if (error) throw error
    }

    // Pemicu otomatis log notifikasi perubahan data profil ke sistem
    const roleLabel = existingUser.role === 'admin_cabang' ? 'Admin Cabang' : 'Assessor';
    
    // Sesuaikan pesan notifikasi jika ada pergantian password
    const passwordMsg = password && password.trim() !== '' ? ' dan kata sandi' : '';
    await createNotification(
      'Pembaruan Data Pengguna',
      `Profil${passwordMsg} ${roleLabel} dengan NIK ${existingUser.nik} telah berhasil diperbarui.`
    );

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/* ========================================================================= */
/* #region 6. DELETE USER TOTAL (WITH AUTO NOTIFICATION TRIGGER) */
/* ========================================================================= */

export async function deleteUserAction(id: string) {
  try {
    // Ambil info user sebelum entitas dihapus demi kebutuhan rekaman pesan notifikasi
    const { data: userTarget } = await supabaseAdmin
      .from('profiles')
      .select('full_name, nik, role')
      .eq('id', id)
      .single();

    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileErr) throw profileErr

    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (authErr) throw authErr

    // Pemicu otomatis log notifikasi penghapusan akun ke sistem pusat superadmin
    if (userTarget) {
      const roleLabel = userTarget.role === 'admin_cabang' ? 'Admin Cabang' : 'Assessor';
      await createNotification(
        'Penghapusan Akun Pengguna',
        `Akun ${roleLabel} bernama ${userTarget.full_name} (NIK: ${userTarget.nik}) telah dihapus permanen.`
      );
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}