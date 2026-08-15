'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { updateUlokProgressAndTimestamp } from './pengelompokan'

export interface TrashItem {
  id: string
  type: 'ulok' | 'document'
  name: string
  parentName: string
  parentId?: string
  deletedAt: string
  deletedBy: string
  fileUrl: string | null
}

// Helper to decode Storage path from publicUrl
function getStoragePathFromUrl(url: string, bucketName: string = 'dokumen-ulok'): string | null {
  try {
    const parts = url.split(`/public/${bucketName}/`)
    if (parts.length > 1) {
      return decodeURIComponent(parts[1])
    }
  } catch (e) {
    console.error('Error parsing storage path:', e)
  }
  return null
}

export async function getTrashItems(branchId: number) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Get sibling profiles (all admins in the branch)
    const { data: siblingProfiles, error: siblingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('branch_id', branchId)

    if (siblingError) throw siblingError
    const branchAdminIds = (siblingProfiles || []).map((p: any) => p.id)

    if (branchAdminIds.length === 0) {
      return { success: true, data: [] }
    }

    // 1. Fetch soft-deleted ULOK submissions (Level 1: purged_by_cabang_at IS NULL)
    const { data: rawUloks, error: ulokError } = await supabase
      .from('ulok_submissions')
      .select(`
        id,
        nama_lokasi,
        deleted_at,
        deleted_by,
        deleted_by_profile:profiles!ulok_submissions_deleted_by_fkey(full_name)
      `)
      .in('admin_id', branchAdminIds)
      .not('deleted_at', 'is', null)
      .is('purged_by_cabang_at', null)

    if (ulokError) throw ulokError

    // 2. Fetch soft-deleted documents (Level 1: purged_by_cabang_at IS NULL)
    const { data: rawDocs, error: docError } = await supabase
      .from('documents')
      .select(`
        id,
        ulok_id,
        file_url,
        document_type,
        deleted_at,
        deleted_by,
        deleted_by_profile:profiles!documents_deleted_by_fkey(full_name),
        ulok_submissions!inner(nama_lokasi, admin_id),
        checklist_master(nama_dokumen)
      `)
      .in('ulok_submissions.admin_id', branchAdminIds)
      .not('deleted_at', 'is', null)
      .is('purged_by_cabang_at', null)

    if (docError) throw docError

    // Transform and combine both sources into unified structure
    const ulokItems: TrashItem[] = (rawUloks || []).map((item: any) => ({
      id: item.id,
      type: 'ulok',
      name: item.nama_lokasi || 'Tidak Diketahui',
      parentName: '-',
      deletedAt: item.deleted_at,
      deletedBy: item.deleted_by_profile?.full_name || 'Sistem / Tidak Diketahui',
      fileUrl: null
    }))

    const docItems: TrashItem[] = (rawDocs || []).map((item: any) => {
      const docName = (item.checklist_master as any)?.nama_dokumen || item.document_type || 'Dokumen'
      return {
        id: item.id,
        type: 'document',
        name: docName,
        parentName: (item.ulok_submissions as any)?.nama_lokasi || 'Tidak Diketahui',
        parentId: item.ulok_id,
        deletedAt: item.deleted_at,
        deletedBy: item.deleted_by_profile?.full_name || 'Sistem / Tidak Diketahui',
        fileUrl: item.file_url
      }
    })

    const combined = [...ulokItems, ...docItems].sort(
      (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    )

    return { success: true, data: combined }
  } catch (error: any) {
    console.error('getTrashItems error:', error)
    return { success: false, error: error.message }
  }
}

export async function softDeleteUlok(ulokId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const now = new Date().toISOString()

    const { error: ulokError } = await supabase
      .from('ulok_submissions')
      .update({
        deleted_at: now,
        deleted_by: user.id
      })
      .eq('id', ulokId)

    if (ulokError) throw ulokError

    // CASCADE soft-delete to active child documents
    await supabase
      .from('documents')
      .update({
        deleted_at: now,
        deleted_by: user.id
      })
      .eq('ulok_id', ulokId)
      .is('deleted_at', null)

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('softDeleteUlok error:', error)
    return { success: false, error: error.message }
  }
}

export async function softDeleteDocument(documentId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Fetch doc info before trashing
    const { data: docData } = await supabase
      .from('documents')
      .select('ulok_id, checklist_id, document_type, is_latest')
      .eq('id', documentId)
      .single()

    const { error } = await supabase
      .from('documents')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', documentId)

    if (error) throw error

    if (docData) {
      const { ulok_id, checklist_id, document_type, is_latest } = docData
      
      // If deleted file was the latest, promote the previous highest active version
      if (is_latest && document_type !== 'dokumen_tambahan') {
        const query = supabase
          .from('documents')
          .select('id')
          .eq('ulok_id', ulok_id)
          .is('deleted_at', null)
        
        if (checklist_id !== null && checklist_id !== undefined) {
          query.eq('checklist_id', checklist_id)
        } else {
          query.eq('document_type', document_type)
        }

        const { data: prevDocs } = await query
          .order('version', { ascending: false })
          .limit(1)

        if (prevDocs && prevDocs.length > 0) {
          await supabase
            .from('documents')
            .update({ is_latest: true })
            .eq('id', prevDocs[0].id)
        }
      }

      if (ulok_id) {
        await updateUlokProgressAndTimestamp(ulok_id)
      }
    }

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    revalidatePath('/admin/cabang/usulan-lokasi/form/perorangan/section1')
    revalidatePath('/admin/cabang/usulan-lokasi/form/perorangan/section2')
    revalidatePath('/admin/cabang/usulan-lokasi/form/badanhukum/section1')
    revalidatePath('/admin/cabang/usulan-lokasi/form/badanhukum/section2')
    return { success: true }
  } catch (error: any) {
    console.error('softDeleteDocument error:', error)
    return { success: false, error: error.message }
  }
}

export async function restoreUlok(ulokId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Fetch current deleted_at of the ULOK
    const { data: ulok, error: fetchError } = await supabase
      .from('ulok_submissions')
      .select('deleted_at')
      .eq('id', ulokId)
      .single()

    if (fetchError) throw fetchError

    const { error: ulokError } = await supabase
      .from('ulok_submissions')
      .update({
        deleted_at: null,
        deleted_by: null
      })
      .eq('id', ulokId)

    if (ulokError) throw ulokError

    if (ulok?.deleted_at) {
      // Restore child documents that were soft-deleted at the exact same timestamp
      await supabase
        .from('documents')
        .update({
          deleted_at: null,
          deleted_by: null
        })
        .eq('ulok_id', ulokId)
        .eq('deleted_at', ulok.deleted_at)
    }

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('restoreUlok error:', error)
    return { success: false, error: error.message }
  }
}

export async function restoreDocument(documentId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data: docData } = await supabase
      .from('documents')
      .select('ulok_id, checklist_id, document_type')
      .eq('id', documentId)
      .single()

    const { error } = await supabase
      .from('documents')
      .update({
        deleted_at: null,
        deleted_by: null
      })
      .eq('id', documentId)

    if (error) throw error

    if (docData) {
      const { ulok_id, checklist_id, document_type } = docData
      
      // Update is_latest status: the highest version among active documents of this type should be latest
      if (document_type !== 'dokumen_tambahan') {
        const query = supabase
          .from('documents')
          .select('id, version')
          .eq('ulok_id', ulok_id)
          .is('deleted_at', null)
        
        if (checklist_id !== null && checklist_id !== undefined) {
          query.eq('checklist_id', checklist_id)
        } else {
          query.eq('document_type', document_type)
        }

        const { data: activeDocs } = await query.order('version', { ascending: false })
        if (activeDocs && activeDocs.length > 0) {
          const highestId = activeDocs[0].id
          const otherIds = activeDocs.slice(1).map(d => d.id)

          await supabase.from('documents').update({ is_latest: true }).eq('id', highestId)
          if (otherIds.length > 0) {
            await supabase.from('documents').update({ is_latest: false }).in('id', otherIds)
          }
        }
      }

      if (ulok_id) {
        await updateUlokProgressAndTimestamp(ulok_id)
      }
    }

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('restoreDocument error:', error)
    return { success: false, error: error.message }
  }
}

export async function permanentDeleteDocument(documentId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Fetch document details to extract file_url
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', documentId)
      .single()

    if (fetchError) throw fetchError

    if (doc?.file_url) {
      const storagePath = getStoragePathFromUrl(doc.file_url)
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('dokumen-ulok')
          .remove([storagePath])
        if (storageError) {
          console.warn('Physical file deletion error or file not found:', storageError)
        }
      }
    }

    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) throw deleteError

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('permanentDeleteDocument error:', error)
    return { success: false, error: error.message }
  }
}

export async function permanentDeleteUlok(ulokId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Fetch ALL documents belonging to ulok_id (active and soft-deleted)
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('file_url')
      .eq('ulok_id', ulokId)

    if (docsError) throw docsError

    // Extract storage paths and delete physical files
    if (docs && docs.length > 0) {
      const storagePaths = docs
        .map((d: any) => getStoragePathFromUrl(d.file_url))
        .filter((p): p is string => p !== null)

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('dokumen-ulok')
          .remove(storagePaths)
        if (storageError) {
          console.warn('Storage files deletion failed or partially succeeded:', storageError)
        }
      }
    }

    // Explicitly delete child rows to prevent FK violation errors before deleting the submission
    await supabase.from('documents').delete().eq('ulok_id', ulokId)
    await supabase.from('comments').delete().eq('ulok_id', ulokId)
    await supabase.from('ulok_pemilik').delete().eq('ulok_id', ulokId)
    await supabase.from('ulok_sertifikat').delete().eq('ulok_id', ulokId)
    await supabase.from('ulok_legal').delete().eq('ulok_id', ulokId)
    await supabase.from('ulok_jaminan').delete().eq('ulok_id', ulokId)
    await supabase.from('metode_saw').delete().eq('ulok_id', ulokId)

    const { error: deleteError } = await supabase
      .from('ulok_submissions')
      .delete()
      .eq('id', ulokId)

    if (deleteError) throw deleteError

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('permanentDeleteUlok error:', error)
    return { success: false, error: error.message }
  }
}

export async function bulkRestoreItems(items: { id: string; type: 'ulok' | 'document' }[]) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const ulokIds = items.filter((item) => item.type === 'ulok').map((item) => item.id)
    const docIds = items.filter((item) => item.type === 'document').map((item) => item.id)

    if (ulokIds.length > 0) {
      for (const ulokId of ulokIds) {
        const res = await restoreUlok(ulokId)
        if (!res.success) throw new Error(res.error)
      }
    }

    if (docIds.length > 0) {
      for (const docId of docIds) {
        const res = await restoreDocument(docId)
        if (!res.success) throw new Error(res.error)
      }
    }

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('bulkRestoreItems error:', error)
    return { success: false, error: error.message }
  }
}

export async function bulkPermanentDeleteItems(items: { id: string; type: 'ulok' | 'document' }[]) {
  try {
    // Run permanent delete for each item sequentially
    for (const item of items) {
      if (item.type === 'ulok') {
        const res = await permanentDeleteUlok(item.id)
        if (!res.success) throw new Error(res.error)
      } else if (item.type === 'document') {
        const res = await permanentDeleteDocument(item.id)
        if (!res.success) throw new Error(res.error)
      }
    }

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('bulkPermanentDeleteItems error:', error)
    return { success: false, error: error.message }
  }
}

export async function emptyTrash(branchId: number) {
  try {
    const trashRes = await getTrashItems(branchId)
    if (!trashRes.success || !trashRes.data) {
      throw new Error(trashRes.error || 'Gagal memuat item sampah')
    }

    const itemsToDelete = trashRes.data.map((item) => ({ id: item.id, type: item.type }))
    const res = await bulkPurgeFromCabangRecycleBin(itemsToDelete)
    if (!res.success) throw new Error(res.error)

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('emptyTrash error:', error)
    return { success: false, error: error.message }
  }
}

// ====== LEVEL 2: RECYCLE BIN & BACKUP RECOVERY ACTIONS ======

export interface BackupItem {
  id: string
  type: 'ulok' | 'document'
  name: string
  parentName: string
  branchId: number
  branchName: string
  deletedAt: string
  deletedBy: string
  purgedByCabangAt: string
  remainingDays: number
  fileUrl: string | null
}

async function checkSuperAdmin(supabase: any, userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profileError || !profile || profile.role !== 'super_admin') {
    throw new Error('Access denied: Hanya Super Admin yang diizinkan melakukan tindakan ini')
  }
}

export async function purgeFromCabangRecycleBin(id: string, type: 'ulok' | 'document') {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const now = new Date().toISOString()

    if (type === 'ulok') {
      // Escalate ULOK submission to Level 2
      const { error: ulokError } = await supabase
        .from('ulok_submissions')
        .update({ purged_by_cabang_at: now })
        .eq('id', id)

      if (ulokError) throw ulokError

      // Escalate all soft-deleted child documents to Level 2
      const { error: docError } = await supabase
        .from('documents')
        .update({ purged_by_cabang_at: now })
        .eq('ulok_id', id)
        .not('deleted_at', 'is', null)

      if (docError) throw docError
    } else {
      // Escalate specific document to Level 2
      const { error: docError } = await supabase
        .from('documents')
        .update({ purged_by_cabang_at: now })
        .eq('id', id)

      if (docError) throw docError
    }

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    revalidatePath('/admin/super-admin/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('purgeFromCabangRecycleBin error:', error)
    return { success: false, error: error.message }
  }
}

export async function bulkPurgeFromCabangRecycleBin(items: { id: string; type: 'ulok' | 'document' }[]) {
  try {
    for (const item of items) {
      const res = await purgeFromCabangRecycleBin(item.id, item.type)
      if (!res.success) throw new Error(res.error)
    }

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    revalidatePath('/admin/super-admin/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('bulkPurgeFromCabangRecycleBin error:', error)
    return { success: false, error: error.message }
  }
}

export async function getSuperAdminBackupItems(filters: { branchId?: string, type?: 'all' | 'ulok' | 'document', search?: string }) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Validate Super Admin role
    await checkSuperAdmin(supabase, user.id)

    // Auto-clean expired items first
    await autoCleanExpiredBackupItems()

    let branchAdminIds: string[] = []
    if (filters.branchId && filters.branchId !== 'all') {
      const { data: profilesInBranch, error: pError } = await supabase
        .from('profiles')
        .select('id')
        .eq('branch_id', parseInt(filters.branchId))

      if (pError) throw pError
      branchAdminIds = (profilesInBranch || []).map((p: any) => p.id)

      if (branchAdminIds.length === 0) {
        return { success: true, data: [] }
      }
    }

    const backupItems: BackupItem[] = []

    // 1. Fetch ULOK submissions in Level 2
    if (!filters.type || filters.type === 'all' || filters.type === 'ulok') {
      let ulokQuery = supabase
        .from('ulok_submissions')
        .select(`
          id,
          nama_lokasi,
          deleted_at,
          deleted_by,
          purged_by_cabang_at,
          deleted_by_profile:profiles!ulok_submissions_deleted_by_fkey(full_name),
          creator_profile:profiles!ulok_submissions_admin_id_fkey(
            branch_id,
            branches(id, nama_cabang)
          )
        `)
        .not('deleted_at', 'is', null)
        .not('purged_by_cabang_at', 'is', null)

      if (branchAdminIds.length > 0) {
        ulokQuery = ulokQuery.in('admin_id', branchAdminIds)
      }

      const { data: rawUloks, error: ulokError } = await ulokQuery
      if (ulokError) throw ulokError

      if (rawUloks) {
        for (const item of rawUloks) {
          const purgedAt = item.purged_by_cabang_at
          const purgeDate = new Date(purgedAt)
          const now = new Date()
          const diffTime = now.getTime() - purgeDate.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          const remainingDays = Math.max(0, 30 - diffDays)

          const branchInfo = (item.creator_profile as any)?.branches
          
          backupItems.push({
            id: item.id,
            type: 'ulok',
            name: item.nama_lokasi || 'Tidak Diketahui',
            parentName: '-',
            branchId: (item.creator_profile as any)?.branch_id || 0,
            branchName: branchInfo?.nama_cabang || 'Pusat / Tidak Diketahui',
            deletedAt: item.deleted_at,
            deletedBy: (item.deleted_by_profile as any)?.full_name || 'Sistem / Tidak Diketahui',
            purgedByCabangAt: item.purged_by_cabang_at,
            remainingDays,
            fileUrl: null
          })
        }
      }
    }

    // 2. Fetch documents in Level 2
    if (!filters.type || filters.type === 'all' || filters.type === 'document') {
      let docQuery = supabase
        .from('documents')
        .select(`
          id,
          file_url,
          document_type,
          deleted_at,
          deleted_by,
          purged_by_cabang_at,
          deleted_by_profile:profiles!documents_deleted_by_fkey(full_name),
          ulok_submissions!inner(
            id,
            nama_lokasi,
            admin_id,
            creator_profile:profiles!ulok_submissions_admin_id_fkey(
              branch_id,
              branches(id, nama_cabang)
            )
          ),
          checklist_master(nama_dokumen)
        `)
        .not('deleted_at', 'is', null)
        .not('purged_by_cabang_at', 'is', null)

      if (branchAdminIds.length > 0) {
        docQuery = docQuery.in('ulok_submissions.admin_id', branchAdminIds)
      }

      const { data: rawDocs, error: docError } = await docQuery
      if (docError) throw docError

      if (rawDocs) {
        for (const item of rawDocs) {
          const docName = (item.checklist_master as any)?.nama_dokumen || item.document_type || 'Dokumen'
          const parentUlok = item.ulok_submissions as any
          const branchInfo = parentUlok?.creator_profile?.branches

          const purgedAt = item.purged_by_cabang_at
          const purgeDate = new Date(purgedAt)
          const now = new Date()
          const diffTime = now.getTime() - purgeDate.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          const remainingDays = Math.max(0, 30 - diffDays)

          backupItems.push({
            id: item.id,
            type: 'document',
            name: docName,
            parentName: parentUlok?.nama_lokasi || 'Tidak Diketahui',
            branchId: parentUlok?.creator_profile?.branch_id || 0,
            branchName: branchInfo?.nama_cabang || 'Pusat / Tidak Diketahui',
            deletedAt: item.deleted_at,
            deletedBy: (item.deleted_by_profile as any)?.full_name || 'Sistem / Tidak Diketahui',
            purgedByCabangAt: item.purged_by_cabang_at,
            remainingDays,
            fileUrl: item.file_url
          })
        }
      }
    }

    // Sort by latest purged_by_cabang_at date
    let combined = backupItems.sort(
      (a, b) => new Date(b.purgedByCabangAt).getTime() - new Date(a.purgedByCabangAt).getTime()
    )

    // Memory filter for Search query
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      combined = combined.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.parentName.toLowerCase().includes(searchLower) ||
        item.branchName.toLowerCase().includes(searchLower) ||
        item.deletedBy.toLowerCase().includes(searchLower)
      )
    }

    return { success: true, data: combined }
  } catch (error: any) {
    console.error('getSuperAdminBackupItems error:', error)
    return { success: false, error: error.message }
  }
}

export async function restoreToCabangRecycleBin(id: string, type: 'ulok' | 'document') {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Validate Super Admin role
    await checkSuperAdmin(supabase, user.id)

    if (type === 'ulok') {
      // Restore ULOK submission back to Level 1
      const { error: ulokError } = await supabase
        .from('ulok_submissions')
        .update({ purged_by_cabang_at: null })
        .eq('id', id)

      if (ulokError) throw ulokError

      // Restore all child documents back to Level 1
      const { error: docError } = await supabase
        .from('documents')
        .update({ purged_by_cabang_at: null })
        .eq('ulok_id', id)
        .not('deleted_at', 'is', null)

      if (docError) throw docError
    } else {
      // Restore document back to Level 1
      const { error: docError } = await supabase
        .from('documents')
        .update({ purged_by_cabang_at: null })
        .eq('id', id)

      if (docError) throw docError
    }

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    revalidatePath('/admin/super-admin/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('restoreToCabangRecycleBin error:', error)
    return { success: false, error: error.message }
  }
}

export async function hardDeleteSuperAdminItem(id: string, type: 'ulok' | 'document') {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Validate Super Admin role
    await checkSuperAdmin(supabase, user.id)

    if (type === 'ulok') {
      const res = await permanentDeleteUlok(id)
      if (!res.success) throw new Error(res.error)
    } else if (type === 'document') {
      const res = await permanentDeleteDocument(id)
      if (!res.success) throw new Error(res.error)
    }

    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath('/admin/cabang/usulan-lokasi/recyclebin')
    revalidatePath('/admin/super-admin/recyclebin')
    return { success: true }
  } catch (error: any) {
    console.error('hardDeleteSuperAdminItem error:', error)
    return { success: false, error: error.message }
  }
}

export async function autoCleanExpiredBackupItems() {
  try {
    const supabase = await createClient()
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

    // Find expired ULOKs in Level 2
    const { data: expiredUloks } = await supabase
      .from('ulok_submissions')
      .select('id')
      .not('purged_by_cabang_at', 'is', null)
      .lt('purged_by_cabang_at', thirtyDaysAgoISO)

    // Find expired documents in Level 2
    const { data: expiredDocs } = await supabase
      .from('documents')
      .select('id')
      .not('purged_by_cabang_at', 'is', null)
      .lt('purged_by_cabang_at', thirtyDaysAgoISO)

    if (expiredUloks && expiredUloks.length > 0) {
      for (const ulok of expiredUloks) {
        await permanentDeleteUlok(ulok.id)
      }
    }

    if (expiredDocs && expiredDocs.length > 0) {
      for (const doc of expiredDocs) {
        await permanentDeleteDocument(doc.id)
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('autoCleanExpiredBackupItems error:', error)
    return { success: false, error: error.message }
  }
}

export async function getDeletedUlokCount() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('branch_id')
      .eq('id', user.id)
      .single()

    if (profileError || !currentProfile || !currentProfile.branch_id) {
      return { success: true, count: 0 }
    }

    const { data: siblingProfiles, error: siblingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('branch_id', currentProfile.branch_id)

    if (siblingError) throw siblingError
    const branchAdminIds = (siblingProfiles || []).map((p: any) => p.id)

    if (branchAdminIds.length === 0) {
      return { success: true, count: 0 }
    }

    const { count, error: ulokError } = await supabase
      .from('ulok_submissions')
      .select('*', { count: 'exact', head: true })
      .in('admin_id', branchAdminIds)
      .not('deleted_at', 'is', null)
      .is('purged_by_cabang_at', null)

    if (ulokError) throw ulokError

    return { success: true, count: count || 0 }
  } catch (error: any) {
    console.error('getDeletedUlokCount error:', error)
    return { success: false, error: error.message }
  }
}
