'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/actions/superadmin'
import { calculateULOKSAW } from '@/actions/saw'
import { updateUlokProgressAndTimestamp } from './pengelompokan'
import { calculateProgress } from '@/utils/progress'

export async function getAssessorSubmissions() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data: rawData, error } = await supabase
      .from('ulok_submissions')
      .select(`
        *,
        profiles:admin_id (
          full_name,
          branches:branch_id (
            nama_cabang
          )
        ),
        ulok_pemilik(*),
        ulok_sertifikat(*),
        ulok_legal(*),
        ulok_jaminan(*),
        documents (*),
        metode_saw(*)
      `)
      .not('status', 'eq', 'Draft')
      .order('created_at', { ascending: false })

    if (error) throw error

    const data = (rawData || []).map((item: any) => {
      const sortedDocs = (item.documents || []).sort((a: any, b: any) => {
        if (a.is_latest !== b.is_latest) return a.is_latest ? -1 : 1
        return (b.version || 1) - (a.version || 1) || new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      })
      const { numerator, denominator, persentase } = calculateProgress(item, sortedDocs)
      return {
        ...item,
        ...item.metode_saw,
        documents: sortedDocs,
        numerator,
        denominator,
        persentase
      }
    })

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

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

    const updatePayload: any = { status: newStatus }
    if (newStatus === 'Approved') {
      updatePayload.approved_at = new Date().toISOString()
    }

    if (['Approved', 'Revisi', 'Rejected'].includes(newStatus)) {
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

      // Trigger status change email notification to Admin Cabang asynchronously
      if (['Approved', 'Revisi'].includes(newStatus)) {
        try {
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('nik, full_name, branch_id')
            .eq('id', ulok.admin_id)
            .single()

          if (adminProfile && adminProfile.branch_id) {
            const proposalBranchId = adminProfile.branch_id

            // Query all active users where role = 'admin_cabang' AND branch_id = proposalBranchId
            const { data: branchAdmins } = await supabase
              .from('profiles')
              .select('nik, full_name')
              .eq('role', 'admin_cabang')
              .eq('branch_id', proposalBranchId)

            if (branchAdmins && branchAdmins.length > 0) {
              let reviewNotes = ''
              
              try {
                const { data: lastComment } = await supabase
                  .from('comments')
                  .select('message')
                  .eq('ulok_id', id)
                  .order('created_at', { ascending: false })
                  .limit(1)

                if (lastComment && lastComment.length > 0) {
                  reviewNotes = lastComment[0].message
                }
              } catch (commentErr) {
                console.error('Gagal mengambil catatan review:', commentErr)
              }

              let namaCabang = 'Cabang'
              let jenisBadanHukum = '-'
              try {
                const { data: branchDetails } = await supabase
                  .from('ulok_submissions')
                  .select(`
                    jenis_badan_hukum,
                    profiles:admin_id (
                      branches:branch_id (
                        nama_cabang
                      )
                    )
                  `)
                  .eq('id', id)
                  .single()

                if (branchDetails) {
                  jenisBadanHukum = branchDetails.jenis_badan_hukum || '-'
                  namaCabang = (branchDetails.profiles as any)?.branches?.nama_cabang || 'Cabang'
                }
              } catch (detailsErr) {
                console.error('Gagal mengambil detil cabang untuk email:', detailsErr)
              }

              const reviewTimestamp = new Date().toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                dateStyle: 'medium',
                timeStyle: 'short',
              })

              const { sendStatusChangeNotificationToAdmin } = await import('@/utils/email')

              for (const admin of branchAdmins) {
                if (admin.nik) {
                  const recipientEmail = `${admin.nik}@mu.co.id`
                  sendStatusChangeNotificationToAdmin({
                    namaLokasi: ulok.nama_lokasi,
                    namaCabang,
                    jenisBadanHukum,
                    status: newStatus,
                    reviewTimestamp,
                    reviewNotes,
                    recipientEmail
                  }).catch(emailErr => {
                    console.error(`Gagal mengirim email status perubahan ke ${recipientEmail}:`, emailErr)
                  })
                }
              }
            }
          }
        } catch (emailTriggerErr) {
          console.error('Gagal memicu alur pengiriman email status:', emailTriggerErr)
        }
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

export async function getAssessorHistoriSubmissions() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data: rawData, error } = await supabase
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
        ),
        metode_saw(*)
      `)
      .not('status', 'eq', 'Draft')
      .order('created_at', { ascending: false })

    if (error) throw error

    const data = (rawData || []).map((item: any) => ({
      ...item,
      ...item.metode_saw
    }))

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

    if (data && data.ulok_id) {
      await updateUlokProgressAndTimestamp(data.ulok_id)
      await calculateULOKSAW(data.ulok_id)
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getNotificationsAction(userId: string | null = null) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at, category, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function updateLastReviewedTimestamp(ulokId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Gagal memuat profil pengguna')
    }

    if (profile.role !== 'assessor') {
      return { success: false, error: 'Unauthorized: Hanya assessor yang dapat memperbarui timestamp' }
    }

    const { error: updateError } = await supabase
      .from('ulok_submissions')
      .update({ last_reviewed_at: new Date().toISOString() })
      .eq('id', ulokId)

    if (updateError) throw updateError

    revalidatePath('/admin/assessor/penilaian')
    revalidatePath('/admin/assessor/penilaian/ulok-badanhukum')
    revalidatePath('/admin/assessor/penilaian/ulok-perorangan')
    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/form/perorangan')
    revalidatePath('/admin/cabang/usulan-lokasi/form/badanhukum')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function transitionDraftToInReview(id: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data: ulok, error: fetchError } = await supabase
      .from('ulok_submissions')
      .select('status, first_in_review_at')
      .eq('id', id)
      .single()

    if (fetchError || !ulok) throw new Error('Usulan lokasi tidak ditemukan')

    if (ulok.status === 'Draft') {
      const now = new Date().toISOString()
      const updatePayload: any = {
        status: 'In Review',
        last_reviewed_at: now,
        updated_at: now
      }
      if (!ulok.first_in_review_at) {
        updatePayload.first_in_review_at = now
      }

      const { error: updateError } = await supabase
        .from('ulok_submissions')
        .update(updatePayload)
        .eq('id', id)

      if (updateError) throw updateError

      await calculateULOKSAW(id)

    revalidatePath('/admin/assessor/pengelompokan')
    revalidatePath('/admin/assessor/penilaian')
  }

  return { success: true }
} catch (error: any) {
  return { success: false, error: error.message }
}
}

export async function recordAssessorReviewActivity(ulokId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { error: updateError } = await supabase
      .from('ulok_submissions')
      .update({
        updated_by: user.id,
        last_reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ulokId)

    if (updateError) throw updateError

    revalidatePath('/admin/assessor/pengelompokan')
    revalidatePath('/admin/assessor/penilaian')
    revalidatePath('/admin/assessor/penilaian/ulok-badanhukum')
    revalidatePath('/admin/assessor/penilaian/ulok-perorangan')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
