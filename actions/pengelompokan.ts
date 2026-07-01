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

  // SAW fields (only populated/relevant for selesai / Kelompok 4)
  saw?: SAWInfo;

  // Smart Filter fields
  is_smart_recommended?: boolean;
  recommendation_reason?: string;

  // Checklist Status for Accordion dropdown
  checklistStatus?: Array<{ nama_dokumen: string; is_uploaded: boolean; file_url?: string; is_negotiable: boolean }>;
}

export interface PengelompokanResult {
  antreanAktif: UlokGroupItem[]; // Status: 'In Review' (Semua)
  patutDilihat: UlokGroupItem[]; // Status: 'In Review' DAN lolos kriteria Smart Filter
  perluRevisi: UlokGroupItem[];  // Status: 'Revisi'
  selesai: UlokGroupItem[];      // Status: 'Approved' atau 'Rejected'
}

import { getEffectiveChecklistId, getChecklistMasterIds, calculateProgress } from '@/utils/progress'

export async function updateUlokProgressAndTimestamp(ulokId: string) {
  try {
    const supabase = await createClient()

    // Fetch submission and documents
    const { data: rawSubmission, error: subError } = await supabase
      .from('ulok_submissions')
      .select(`
        *,
        ulok_pemilik(*),
        ulok_sertifikat(*),
        ulok_legal(*),
        ulok_jaminan(*),
        documents (*)
      `)
      .eq('id', ulokId)
      .single()

    if (subError || !rawSubmission) {
      console.error("Error fetching submission for progress check:", subError)
      return
    }

    const { numerator, denominator, persentase } = calculateProgress(rawSubmission, rawSubmission.documents || [])

    const isCompleted = denominator > 0 && numerator === denominator
    const currentCompletedAt = rawSubmission.documents_completed_at

    if (isCompleted && !currentCompletedAt) {
      await supabase
        .from('ulok_submissions')
        .update({ documents_completed_at: new Date().toISOString() })
        .eq('id', ulokId)
    } else if (!isCompleted && currentCompletedAt) {
      await supabase
        .from('ulok_submissions')
        .update({ documents_completed_at: null })
        .eq('id', ulokId)
    }
  } catch (err) {
    console.error("Gagal update progres/timestamp berkas:", err)
  }
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

    // Fetch all checklist master records to do the LEFT JOIN in JS
    const { data: checklistMaster, error: checklistError } = await supabase
      .from('checklist_master')
      .select('*')

    if (checklistError) throw checklistError

    const submissions = rawSubmissions || []

    const antreanAktif: UlokGroupItem[] = []
    const patutDilihat: UlokGroupItem[] = []
    const perluRevisi: UlokGroupItem[] = []
    const selesai: UlokGroupItem[] = []

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

      // Get checklist status list for accordion dropdown using LEFT JOIN logic
      const filteredChecklist = (checklistMaster || [])
        .filter((cm) => cm.jenis_badan_hukum === rawItem.jenis_badan_hukum && checklistMasterIds.includes(cm.id))
        .sort((a, b) => a.id - b.id)

      const checklistStatus = filteredChecklist.map((cm) => {
        const doc = docs.find((d: any) => {
          if (d.checklist_id === cm.id) return true
          const effectiveId = getEffectiveChecklistId(d, flattenedSubmission.jenis_badan_hukum)
          return effectiveId === cm.id
        })
        return {
          nama_dokumen: cm.nama_dokumen,
          is_uploaded: !!(doc && doc.file_url),
          file_url: doc?.file_url || undefined,
          is_negotiable: !!cm.is_negotiable
        }
      })

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
        checklistStatus,
      }

      // Check groupings
      if (item.status === 'Approved' || item.status === 'Rejected') {
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
        selesai.push(item)
      } else if (item.status === 'Revisi') {
        perluRevisi.push(item)
      } else if (item.status === 'In Review') {
        antreanAktif.push(item)

        // Check Smart Filter (patutDilihat)
        // Kriteria:
        // * Progress dokumen (persentase) >= 50%
        // * Harga sewa (harga_sewa) <= 350,000,000 IDR
        // * Sudah mengunggah dokumen alas hak utama (cek sertifikat_tanah atau ajb_girik)
        const hasAlasHak = docs.some((doc: DocumentInfo) => doc.document_type === 'sertifikat_tanah' || doc.document_type === 'ajb_girik')
        const isRentLimitOk = item.harga_sewa !== null && item.harga_sewa !== undefined && item.harga_sewa <= 350000000

        if (persentase >= 50 && isRentLimitOk && hasAlasHak) {
          item.is_smart_recommended = true
          item.recommendation_reason = "Alas hak aman & harga sewa ramah anggaran"
          patutDilihat.push(item)
        }
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

    // Sort patutDilihat by percentage desc, then by rental price asc
    patutDilihat.sort((a, b) => {
      if (b.persentase !== a.persentase) {
        return b.persentase - a.persentase
      }
      const priceA = a.harga_sewa ?? Infinity
      const priceB = b.harga_sewa ?? Infinity
      return priceA - priceB
    })

    // Sort other groups by last updated
    const sortedAntreanAktif = sortByLastUpdated(antreanAktif)
    const sortedPerluRevisi = sortByLastUpdated(perluRevisi)
    const sortedSelesai = sortByLastUpdated(selesai)

    return {
      success: true,
      data: {
        antreanAktif: sortedAntreanAktif,
        patutDilihat,
        perluRevisi: sortedPerluRevisi,
        selesai: sortedSelesai
      }
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Gagal mengelompokkan data usulan lokasi'
    }
  }
}
