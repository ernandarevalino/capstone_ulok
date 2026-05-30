'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/actions/superadmin'
import { calculateULOKSAW } from '@/actions/saw'

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

/**
 * Memperbarui status usulan lokasi (ULOK) berdasarkan ID.
 * Pilihan status sesuai ENUM: 'In Review', 'Revision', 'Approved', 'Rejected'.
 */
export async function updateUlokStatus(id: string, newStatus: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data: ulok } = await supabase
      .from('ulok_submissions')
      .select('admin_id, nama_lokasi, first_in_review_at, created_at')
      .eq('id', id)
      .single()

    // Siapkan payload update dinamis
    const updatePayload: any = { status: newStatus }
    if (newStatus === 'Approved') {
      updatePayload.approved_at = new Date().toISOString()
    }

    if (['Approved', 'Revision', 'Rejected'].includes(newStatus)) {
      if (ulok && !ulok.first_in_review_at) {
        updatePayload.first_in_review_at = ulok.created_at || new Date().toISOString()
      }
    } else if (newStatus === 'In Review') {
      if (ulok && !ulok.first_in_review_at) {
        updatePayload.first_in_review_at = new Date().toISOString()
      }
    }

    const { error } = await supabase
      .from('ulok_submissions')
      .update(updatePayload)
      .eq('id', id)

    if (error) throw error

    // Pemicu otomatis kalkulasi skor SAW setelah status berhasil diperbarui
    await calculateULOKSAW(id)

    if (ulok) {
      try {
        await createNotification(
          'Status Usulan Diperbarui',
          `Status usulan lokasi "${ulok.nama_lokasi}" Anda telah diperbarui menjadi "${newStatus}".`,
          ulok.admin_id,
          'submission'
        )
      } catch (notifErr) {
        console.error("Gagal memicu notifikasi update status:", notifErr)
      }
    }

    revalidatePath('/admin/assessor/penilaian')
    revalidatePath('/admin/assessor/penilaian/ulok-badanhukum')
    revalidatePath('/admin/assessor/penilaian/ulok-proses')
    revalidatePath('/admin/assessor/penilaian/ulok-perorangan')
    revalidatePath('/admin/assessor/histori')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Mengambil list data dari public.ulok_submissions yang PERNAH diberi komentar/catatan revisi oleh Assessor terkait.
 */
export async function getAssessorHistoriSubmissions() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data, error } = await supabase
      .from('ulok_submissions')
      .select(`
        *,
        profiles:admin_id (
          full_name,
          branches:branch_id (
            nama_cabang
          )
        ),
        comments (
          *,
          profiles:user_id (
            full_name,
            role
          )
        )
      `)
      .not('status', 'eq', 'Draft')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Filter data di mana Assessor ini (user.id) pernah memberikan komentar
    const filteredData = data?.filter((submission: any) => {
      const assessorHasCommented = (submission.comments || []).some(
        (comment: any) => comment.user_id === user.id
      )
      return assessorHasCommented
    }) || []

    return { success: true, data: filteredData }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Melakukan toggle nilai is_verified di tabel public.documents berdasarkan ID dokumen.
 */
export async function toggleDocumentVerification(documentId: string, currentStatus: boolean) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data, error } = await supabase
      .from('documents')
      .update({ is_verified: !currentStatus })
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error

    // Pemicu otomatis kalkulasi ulang skor SAW real-time agar dashboard sinkron
    if (data && data.ulok_id) {
      await calculateULOKSAW(data.ulok_id)
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
