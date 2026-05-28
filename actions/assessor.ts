'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Mengambil seluruh daftar usulan lokasi (ULOK) untuk kebutuhan Tim Assessor.
 * Mengabaikan status 'Draft' karena status tersebut hanya hak akses milik Admin Cabang.
 */
export async function getAssessorSubmissions() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // UBAH .select('*') MENJADI QUERY RELASI BERTINGKAT INI:
    const { data, error } = await supabase
      .from('ulok_submissions')
      .select(`
        *,
        profiles:admin_id (
          full_name,
          branches:branch_id (
            nama_cabang
          )
        )
      `)
      .not('status', 'eq', 'Draft')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}