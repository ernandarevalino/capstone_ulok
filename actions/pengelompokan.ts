'use server'

import { createClient } from '@/utils/supabase/server'
import { calculateULOKSAW } from '@/actions/saw'

// === TYPES & INTERFACES ===
export interface BranchInfo {
  nama_cabang: string;
}

export interface ProfileInfo {
  full_name: string;
  branches: BranchInfo | null;
}

export interface DocumentInfo {
  id: string;
  ulok_id: string;
  document_type: string | null;
  checklist_id: number | null;
  file_url: string | null;
  uploaded_at: string | null;
  uploaded_by: string | null;
  is_verified: boolean | null;
}

export interface SAWInfo {
  c1_score: number | null;
  c2_score: number | null;
  c3_score: number | null;
  final_score: number | null;
  saw_analysis_notes: string | null;
}

export interface UlokGroupItem {
  id: string;
  admin_id: string;
  nama_lokasi: string;
  jenis_badan_hukum: string;
  nama_pemegang_hak: string;
  status: string;
  created_at: string;
  updated_at: string;
  first_in_review_at: string | null;
  approved_at: string | null;
  harga_sewa: number | null;
  
  // Relations/Flattened
  profiles: ProfileInfo | null;
  documents: DocumentInfo[];
  
  // Progress/Calculated fields
  persentase: number; // progress percentage (uploaded matching docs / required docs * 100)
  denominator: number; // total required docs count
  numerator: number; // uploaded unique matching docs count
  
  // SAW fields (only populated/relevant for Kelompok 4)
  saw?: SAWInfo;
}

export interface PengelompokanResult {
  kelompok1: UlokGroupItem[]; // Baru masuk / persentase sangat rendah (< 20% atau dokumen <= 1)
  kelompok2: UlokGroupItem[]; // Antrean Aktif (sedang proses upload / in review, >= 20% & < 100%)
  kelompok3: UlokGroupItem[]; // Perbaikan / Revisi (status === 'Revisi')
  kelompok4: UlokGroupItem[]; // Approved atau 100%
}

// === HELPERS MATCHING SAW.TS ===

function getEffectiveChecklistId(doc: any, currentJbh: string): number | null {
  if (doc.checklist_id !== null && doc.checklist_id !== undefined) {
    return doc.checklist_id
  }
  
  const type = doc.document_type
  if (!type) return null

  if (currentJbh === 'PT') {
    const ptMap: Record<string, number> = {
      'ektp_mewakili': 1,
      'akta_pendirian': 2,
      'akta_penyesuaian': 3,
      'anggaran_dasar': 4,
      'akta_direksi_komisaris': 5,
      'nib_oss': 6,
      'npwp_badan': 7,
      'sppkp': 8,
      'surat_pernyataan_nonpkp': 8,
      'ektp_direksi': 9,
      'akta_kuasa': 10,
      'rups_persetujuan': 11,
      'sertifikat_tanah': 12,
      'ajb_girik': 13,
      'sppt_pbb': 14,
      'imb_pbg': 15,
      'slf': 16,
    }
    return ptMap[type] || null
  }

  if (currentJbh === 'Yayasan') {
    const yayasanMap: Record<string, number> = {
      'ektp_mewakili': 17,
      'akta_pendirian': 18,
      'anggaran_dasar': 19,
      'akta_pengurus': 20,
      'nib_oss': 21,
      'npwp_badan': 22,
      'sppkp': 23,
      'surat_pernyataan_nonpkp': 23,
      'ektp_direksi': 24,
      'akta_kuasa': 25,
      'sertifikat_tanah': 26,
      'ajb_girik': 27,
      'sppt_pbb': 28,
      'imb_pbg': 29,
      'slf': 30,
    }
    return yayasanMap[type] || null
  }

  if (currentJbh === 'Koperasi') {
    const koperasiMap: Record<string, number> = {
      'ektp_mewakili': 31,
      'akta_pendirian': 32,
      'anggaran_dasar': 33,
      'akta_pengurus': 34,
      'nib_oss': 35,
      'npwp_badan': 36,
      'sppkp': 37,
      'surat_pernyataan_nonpkp': 37,
      'ektp_direksi': 38,
      'akta_kuasa': 39,
      'sertifikat_tanah': 40,
      'ajb_girik': 41,
      'sppt_pbb': 42,
      'imb_pbg': 43,
      'slf': 44,
    }
    return koperasiMap[type] || null
  }

  if (['Perorangan', 'Kuasa', 'Waris', 'Hibah'].includes(currentJbh)) {
    const peroranganMap: Record<string, number> = {
      'ktp_pemilik': 45,
      'ektp': 45,
      'kitas_kitap': 46,
      'npwp': 47,
      'pkp_sppkp': 48,
      'non_pkp': 48,
      'kartu_keluarga': 49,
      'buku_nikah': 50,
      'persetujuan_pasangan': 51,
      'dokumen_ganti_nama': 52,
      'akta_cerai': 53,
      'sertifikat_tanah': 54,
      'ajb_girik': 55,
      'sppt_pbb': 56,
      'imb_pbg': 57,
      'slf': 58,
      'akta_kuasa': 59,
      'ktp_kuasa': 60,
      'akta_waris': 61,
      'surat_kematian': 62,
      'ktp_ahli_waris': 63,
      'kk_ahli_waris': 64,
      'akta_hibah': 65,
    }
    return peroranganMap[type] || null
  }

  return null
}

function getChecklistMasterIds(submission: any, documents: any[]): number[] {
  let checklistMasterIds: number[] = []
  const jbh = submission.jenis_badan_hukum

  if (jbh === 'PT' || jbh === 'Yayasan' || jbh === 'Koperasi') {
    const isDikuasakan = !!submission.is_dikuasakan || (documents ? documents.some(doc => doc.document_type === 'akta_kuasa') : false)
    
    if (jbh === 'PT') {
      checklistMasterIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15]
      
      if (isDikuasakan) {
        checklistMasterIds.push(10)
      }
      
      if (documents && documents.some(doc => doc.checklist_id === 11 || doc.document_type === 'rups_persetujuan')) {
        checklistMasterIds.push(11)
      }
      
      const hasSertifikat = documents && documents.some(doc => doc.checklist_id === 12 || doc.document_type === 'sertifikat_tanah')
      const hasAjb = documents && documents.some(doc => doc.checklist_id === 13 || doc.document_type === 'ajb_girik')
      if (hasSertifikat) {
        checklistMasterIds.push(12)
      } else if (hasAjb) {
        checklistMasterIds.push(13)
      } else {
        checklistMasterIds.push(12)
      }
      
      if (documents && documents.some(doc => doc.checklist_id === 16 || doc.document_type === 'slf')) {
        checklistMasterIds.push(16)
      }
    } else if (jbh === 'Yayasan') {
      checklistMasterIds = [17, 18, 19, 20, 21, 22, 23, 24, 28, 29]
      
      if (isDikuasakan) {
        checklistMasterIds.push(25)
      }
      
      const hasSertifikat = documents && documents.some(doc => doc.checklist_id === 26 || doc.document_type === 'sertifikat_tanah')
      const hasAjb = documents && documents.some(doc => doc.checklist_id === 27 || doc.document_type === 'ajb_girik')
      if (hasSertifikat) {
        checklistMasterIds.push(26)
      } else if (hasAjb) {
        checklistMasterIds.push(27)
      } else {
        checklistMasterIds.push(26)
      }
      
      if (documents && documents.some(doc => doc.checklist_id === 30 || doc.document_type === 'slf')) {
        checklistMasterIds.push(30)
      }
    } else if (jbh === 'Koperasi') {
      checklistMasterIds = [31, 32, 33, 34, 35, 36, 37, 38, 42, 43]
      
      if (isDikuasakan) {
        checklistMasterIds.push(39)
      }
      
      const hasSertifikat = documents && documents.some(doc => doc.checklist_id === 40 || doc.document_type === 'sertifikat_tanah')
      const hasAjb = documents && documents.some(doc => doc.checklist_id === 41 || doc.document_type === 'ajb_girik')
      if (hasSertifikat) {
        checklistMasterIds.push(40)
      } else if (hasAjb) {
        checklistMasterIds.push(41)
      } else {
        checklistMasterIds.push(40)
      }
      
      if (documents && documents.some(doc => doc.checklist_id === 44 || doc.document_type === 'slf')) {
        checklistMasterIds.push(44)
      }
    }
  } else if (['Perorangan', 'Kuasa', 'Waris', 'Hibah'].includes(jbh)) {
    checklistMasterIds = [47, 48, 49, 56, 57]
    
    const hasKitasDoc = documents && documents.some(doc => doc.document_type === 'kitas_kitap' || doc.checklist_id === 46)
    const isWNA = !!submission.nama_kitas || hasKitasDoc || submission.jenis_identitas === 'KITAS' || submission.jenis_identitas === 'KITAP' || submission.jenis_identitas === 'WNA'
    if (isWNA) {
      checklistMasterIds.push(46)
    } else {
      checklistMasterIds.push(45)
    }
    
    const hasBukuNikah = !!submission.no_buku_nikah || (documents && documents.some(doc => doc.document_type === 'buku_nikah' || doc.checklist_id === 50))
    const hasCerai = documents && documents.some(doc => doc.document_type === 'akta_cerai' || doc.checklist_id === 53)
    if (hasBukuNikah) {
      checklistMasterIds.push(50, 51)
    } else if (hasCerai) {
      checklistMasterIds.push(53)
    }
    
    if (submission.nama_sebelum_ganti || submission.nama_sesudah_ganti) {
      checklistMasterIds.push(52)
    }
    
    if (jbh === 'Kuasa') {
      checklistMasterIds.push(59, 60)
    } else if (jbh === 'Waris') {
      checklistMasterIds.push(61, 62, 63, 64)
      checklistMasterIds = checklistMasterIds.filter(id => id !== 45)
    } else if (jbh === 'Hibah') {
      checklistMasterIds.push(65)
    }
    
    const hasSertifikatPerorangan = documents && documents.some(doc => doc.checklist_id === 54 || doc.document_type === 'sertifikat_tanah')
    const hasAjbPerorangan = documents && documents.some(doc => doc.checklist_id === 55 || doc.document_type === 'ajb_girik')
    if (hasSertifikatPerorangan) {
      checklistMasterIds.push(54)
    } else if (hasAjbPerorangan) {
      checklistMasterIds.push(55)
    } else {
      checklistMasterIds.push(54)
    }
    
    if (documents && documents.some(doc => doc.checklist_id === 58 || doc.document_type === 'slf')) {
      checklistMasterIds.push(58)
    }
  }

  return checklistMasterIds
}

// === MAIN ACTION ===

export async function getPengelompokanData() {
  try {
    const supabase = await createClient()

    // Auth verification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Query non-draft submissions
    const { data: rawSubmissions, error: queryError } = await supabase
      .from('ulok_submissions')
      .select(`
        *,
        profiles:admin_id (
          full_name,
          branches:branch_id (
            nama_cabang
          )
        ),
        documents (*),
        ulok_pemilik(*),
        ulok_sertifikat(*),
        ulok_legal(*),
        ulok_jaminan(*),
        metode_saw(*)
      `)
      .not('status', 'eq', 'Draft')

    if (queryError) throw queryError

    const submissions = rawSubmissions || []

    const kelompok1: UlokGroupItem[] = []
    const kelompok2: UlokGroupItem[] = []
    const kelompok3: UlokGroupItem[] = []
    const kelompok4: UlokGroupItem[] = []

    for (const rawItem of submissions) {
      // Flatten relations like in saw.ts to access pemilik/legal properties
      const flattenedSubmission = {
        ...rawItem,
        ...(rawItem as any).ulok_pemilik,
        ...(rawItem as any).ulok_sertifikat,
        ...(rawItem as any).ulok_legal,
        ...(rawItem as any).ulok_jaminan,
        ...(rawItem as any).metode_saw
      }

      const docs = rawItem.documents || []

      // Calculate checklistMasterIds (denominator)
      const checklistMasterIds = getChecklistMasterIds(flattenedSubmission, docs)
      const denominator = checklistMasterIds.length

      // Count unique uploaded files that match required checklistMasterIds
      const uniqueUploadedIds = new Set<number>()
      for (const doc of docs) {
        const effectiveId = getEffectiveChecklistId(doc, flattenedSubmission.jenis_badan_hukum)
        if (effectiveId !== null && checklistMasterIds.includes(effectiveId)) {
          uniqueUploadedIds.add(effectiveId)
        }
      }

      const numerator = uniqueUploadedIds.size
      const persentase = denominator > 0 ? parseFloat(((numerator / denominator) * 100).toFixed(2)) : 0

      // Form item payload matching UlokGroupItem interface
      const item: UlokGroupItem = {
        id: rawItem.id,
        admin_id: rawItem.admin_id,
        nama_lokasi: rawItem.nama_lokasi,
        jenis_badan_hukum: rawItem.jenis_badan_hukum,
        nama_pemegang_hak: rawItem.nama_pemegang_hak,
        status: rawItem.status,
        created_at: rawItem.created_at,
        updated_at: rawItem.updated_at,
        first_in_review_at: rawItem.first_in_review_at,
        approved_at: rawItem.approved_at,
        harga_sewa: rawItem.harga_sewa,
        profiles: rawItem.profiles,
        documents: docs,
        persentase,
        denominator,
        numerator,
      }

      // Check groupings
      if (item.status === 'Revisi') {
        // Kelompok 3: Status Revisi / Perbaikan
        kelompok3.push(item)
      } else if (item.status === 'Approved' || item.status === 'Rejected' || persentase >= 100) {
        // Kelompok 4: Status Approved/Rejected atau Dokumen 100%
        // Call calculateULOKSAW to ensure fresh SAW score calculations
        try {
          const sawRes = await calculateULOKSAW(item.id)
          if (sawRes.success && sawRes.data) {
            item.saw = {
              c1_score: sawRes.data.c1_score,
              c2_score: sawRes.data.c2_score,
              c3_score: sawRes.data.c3_score,
              final_score: sawRes.data.final_score,
              saw_analysis_notes: sawRes.data.saw_analysis_notes
            }
          } else if (rawItem.metode_saw) {
            item.saw = {
              c1_score: rawItem.metode_saw.c1_score,
              c2_score: rawItem.metode_saw.c2_score,
              c3_score: rawItem.metode_saw.c3_score,
              final_score: rawItem.metode_saw.final_score,
              saw_analysis_notes: rawItem.metode_saw.saw_analysis_notes
            }
          }
        } catch (sawErr) {
          console.error(`Gagal menghitung skor SAW untuk ID ${item.id}:`, sawErr)
          if (rawItem.metode_saw) {
            item.saw = {
              c1_score: rawItem.metode_saw.c1_score,
              c2_score: rawItem.metode_saw.c2_score,
              c3_score: rawItem.metode_saw.c3_score,
              final_score: rawItem.metode_saw.final_score,
              saw_analysis_notes: rawItem.metode_saw.saw_analysis_notes
            }
          }
        }
        kelompok4.push(item)
      } else if (docs.length <= 1 || persentase < 20) {
        // Kelompok 1: Dokumen baru 1 buah atau persentase sangat rendah (< 20%)
        kelompok1.push(item)
      } else {
        // Kelompok 2 (Antrean Aktif): Sedang proses upload/in-review, persentase dinamis berjalan
        kelompok2.push(item)
      }
    }

    // Helper sorting function by Last Updated (updated_at desc, fallback created_at desc)
    const sortByLastUpdated = (list: UlokGroupItem[]) => {
      return list.sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at).getTime()
        const timeB = new Date(b.updated_at || b.created_at).getTime()
        return timeB - timeA
      })
    }

    // Sort Kelompok 2 by percentage desc, then by last updated
    kelompok2.sort((a, b) => {
      if (b.persentase !== a.persentase) {
        return b.persentase - a.persentase
      }
      const timeA = new Date(a.updated_at || a.created_at).getTime()
      const timeB = new Date(b.updated_at || b.created_at).getTime()
      return timeB - timeA
    })

    // Sort other groups
    const sortedKelompok1 = sortByLastUpdated(kelompok1)
    const sortedKelompok3 = sortByLastUpdated(kelompok3)
    const sortedKelompok4 = sortByLastUpdated(kelompok4)

    return {
      success: true,
      data: {
        kelompok1: sortedKelompok1,
        kelompok2,
        kelompok3: sortedKelompok3,
        kelompok4: sortedKelompok4
      }
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Gagal mengelompokkan data usulan lokasi'
    }
  }
}
