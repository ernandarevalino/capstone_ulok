'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

// ====== HELPER: INIDIALISASI DINAMIS ======
// Fungsi ini menjamin variabel .env dibaca saat runtime (saat tombol diklik), 
// bukan saat file pertama kali di-load oleh Next.js.
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || serviceKey.trim() === '') {
    throw new Error("Kritikal: SUPABASE_SERVICE_ROLE_KEY kosong atau tidak terbaca oleh Server!");
  }

  return createClient(url!, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

interface GetUsersParams {
  role: 'admin_cabang' | 'assessor'
  search?: string
  page?: number
  limit?: number
  branchFilter?: string
}

// === ACTIONS: BUAT NOTIFIKASI SISTEM ===
export async function createNotification(
  title: string,
  message: string,
  userId: string | null = null,
  category: string = 'system'
) {
  try {
    const supabase = await createServerClient();
    if (userId) {
      const { error } = await supabase
        .from('notifications')
        .insert([{ title, message, user_id: userId, category }]);
      if (error) throw error;
    } else {
      const { data: superAdmins, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'super_admin');
      if (error) throw error;

      if (superAdmins && superAdmins.length > 0) {
        const inserts = superAdmins.map(admin => ({
          title,
          message,
          user_id: admin.id,
          category
        }));
        const { error: insertErr } = await supabase.from('notifications').insert(inserts);
        if (insertErr) throw insertErr;
      }
    }
  } catch (err) {
    console.error("Gagal mencatat log notifikasi ke database:", err);
  }
}

// === ACTIONS: AMBIL NOTIFIKASI ===
export async function getNotificationsAction(userId: string | null = null) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at, category, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

// === ACTIONS: HAPUS NOTIFIKASI ===
export async function deleteNotificationAction(id: number) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// === ACTIONS: TANDAI SEMUA NOTIFIKASI SEBAGAI DIBACA ===
export async function markAllNotificationsAsReadAction(userId: string | null = null) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// === ACTIONS: AMBIL USERS BERDASARKAN ROLE ===
export async function getUsersByRoleAction({ role, search = '', page = 1, limit = 7, branchFilter = '' }: GetUsersParams) {
  try {
    const supabaseAdmin = getSupabaseAdmin(); // Panggilan Dinamis
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

// === ACTIONS: AMBIL SEMUA CABANG ===
export async function getAllBranchesAction() {
  try {
    const supabaseAdmin = getSupabaseAdmin(); // Panggilan Dinamis
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

// === ACTIONS: AMBIL STATISTIK DASHBOARD ===
export async function getDashboardStatsAction() {
  try {
    const supabaseAdmin = getSupabaseAdmin(); // Panggilan Dinamis
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

interface CreateUserParams {
  password: string
  fullName: string
  nik: string
  role: 'admin_cabang' | 'assessor'
  branchId?: number | null
}

// === ACTIONS: TAMBAH USER BARU ===
export async function createUserAction({ password, fullName, nik, role, branchId }: CreateUserParams) {
  try {
    const supabaseAdmin = getSupabaseAdmin(); // Panggilan Dinamis
    const cleanNik = nik.trim();
    const { data: existingNik, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('nik', cleanNik)
      .maybeSingle();
    if (checkError) throw checkError;

    if (existingNik) {
      return { success: false, error: `NIK ${cleanNik} sudah terdaftar di sistem!` };
    }

    const generatedEmail = `${cleanNik}@alfamidi.com`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: generatedEmail,
      password: password,
      email_confirm: true
    })

    if (authError) {
      throw new Error(`Gagal membuat user auth: ${authError.message}`);
    }
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
      const { error: deleteAuthErr } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      if (deleteAuthErr) {
        console.error("Gagal melakukan rollback auth user:", deleteAuthErr.message);
      }
      throw profileError
    }

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

interface UpdateUserParams {
  id: string
  fullName: string
  nik: string
  deleteAvatar: boolean
  branchId?: number | null
  password?: string
}

// === ACTIONS: UPDATE USER DATA ===
export async function updateUserAction({ id, fullName, nik, deleteAvatar, branchId, password }: UpdateUserParams) {
  try {
    const supabaseAdmin = getSupabaseAdmin(); // Panggilan Dinamis
    const cleanNik = nik.trim();
    const supabase = await createServerClient();

    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('full_name, nik, role, branch_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) throw new Error("Data pengguna tidak ditemukan.")

    if (cleanNik !== existingUser.nik) {
      const { data: duplicateNik } = await supabase
        .from('profiles')
        .select('id')
        .eq('nik', cleanNik)
        .neq('id', id)
        .maybeSingle();
      if (duplicateNik) {
        return { success: false, error: `Gagal ubah data! NIK ${cleanNik} sudah digunakan oleh karyawan lain.` };
      }
    }

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

    if (Object.keys(updatePayload).length === 0 && !authUpdatePayload.password) {
      return { success: true }
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', id)

      if (error) throw error
    }

    const roleLabel = existingUser.role === 'admin_cabang' ? 'Admin Cabang' : 'Assessor';
    const passwordMsg = password && password.trim() !== '' ? ' dan kata sandi' : '';
    await createNotification(
      'Pembaruan Data Pengguna',
      `Profil${passwordMsg} ${roleLabel} dengan NIK ${existingUser.nik} telah berhasil diperbarui.`
    );
    await createNotification(
      'Akun Diperbarui Super Admin',
      'Data profil atau kredensial akun Anda telah disesuaikan oleh Super Admin.',
      id,
      'profile'
    );
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: HAPUS USER ===
export async function deleteUserAction(id: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin(); // Panggilan Dinamis
    const { data: userTarget, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, nik, role')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileErr) throw profileErr

    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (authErr) {
      throw new Error(`Gagal menghapus user auth: ${authErr.message}`);
    }

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