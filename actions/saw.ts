'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server Action untuk menghitung skor SPK SAW (Simple Additive Weighting)
 * berdasarkan kriteria C1 (Kelengkapan Dokumen), C2 (Durasi Mobilisasi), dan C3 (Harga Sewa).
 * Dan menyimpan hasilnya kembali ke database.
 * 
 * @param ulokId - ID dari usulan lokasi yang akan dihitung
 */
export async function calculateULOKSAW(ulokId: string) {
  try {
    const supabase = await createClient()

    // 1. Validasi Sesi Pengguna
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized: Silakan login kembali')
    }

    // 2. Ambil data submission
    const { data: submission, error: subError } = await supabase
      .from('ulok_submissions')
      .select('*')
      .eq('id', ulokId)
      .single()

    if (subError || !submission) {
      throw new Error('Gagal mengambil data usulan lokasi: ' + (subError?.message || 'Data tidak ditemukan'))
    }

    // 3. Ambil seluruh dokumen terkait
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('ulok_id', ulokId)

    if (docError) {
      throw new Error('Gagal mengambil dokumen pendukung: ' + docError.message)
    }

    // --- KRITERIA C1: Kelengkapan Dokumen ---
    const numerator = documents ? documents.filter(doc => doc.is_verified === true).length : 0
    
    // Hitung denominator dinamis
    let denominator = submission.jenis_badan_hukum === 'Perorangan' ? 9 : 12

    if (submission.nama_sebelum_ganti || submission.nama_sesudah_ganti) {
      denominator += 1
    }
    if (submission.no_surat_kematian) {
      denominator += 4
    }
    if (submission.jaminan_bank_nama) {
      denominator += 1
    }
    if (submission.jenis_alas_hak === 'AJB' || submission.jenis_alas_hak === 'Girik') {
      denominator += 5
    }
    if (submission.tanggal_proses_sertifikat) {
      denominator += 4
    }

    const pct = denominator > 0 ? (numerator / denominator) * 100 : 0
    let c1_score = 1
    if (pct === 100) {
      c1_score = 5
    } else if (pct >= 80) {
      c1_score = 4
    } else if (pct >= 60) {
      c1_score = 3
    } else if (pct >= 30) {
      c1_score = 2
    } else {
      c1_score = 1
    }

    // --- KRITERIA C2: Kecepatan Dokumen Wajib ---
    let c2_score = 1
    let isC2Penalized = false
    let deltaDays = 0

    // Query ke tabel documents yang melakukan JOIN ke checklist_master
    const { data: mandatoryDocs, error: mandatoryError } = await supabase
      .from('documents')
      .select('id, is_verified, updated_at, checklist_master!inner(is_negotiable)')
      .eq('ulok_id', ulokId)
      .eq('checklist_master.is_negotiable', false)

    if (mandatoryError) {
      throw new Error('Gagal mengambil dokumen wajib: ' + mandatoryError.message)
    }

    const totalMandatory = mandatoryDocs ? mandatoryDocs.length : 0
    const verifiedMandatory = mandatoryDocs ? mandatoryDocs.filter(d => d.is_verified === true).length : 0

    const isMandatoryComplete = totalMandatory > 0 && verifiedMandatory === totalMandatory

    if (!isMandatoryComplete) {
      c2_score = 1
      isC2Penalized = true
    } else {
      // Hitung durasi hari (updated_at berkas terakhir - created_at usulan) ke skor 1-5
      let lastUpdatedAt = submission.created_at
      if (mandatoryDocs && mandatoryDocs.length > 0) {
        const dates = mandatoryDocs
          .map(d => d.updated_at ? new Date(d.updated_at).getTime() : 0)
          .filter(t => t > 0)
        if (dates.length > 0) {
          lastUpdatedAt = new Date(Math.max(...dates)).toISOString()
        }
      }

      const start = new Date(submission.created_at)
      const end = new Date(lastUpdatedAt)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      deltaDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (deltaDays <= 3) {
        c2_score = 5
      } else if (deltaDays >= 4 && deltaDays <= 7) {
        c2_score = 4
      } else if (deltaDays >= 8 && deltaDays <= 10) {
        c2_score = 3
      } else if (deltaDays >= 11 && deltaDays <= 14) {
        c2_score = 2
      } else {
        c2_score = 1
      }
    }

    // --- KRITERIA C3: Harga Sewa ---
    const harga = submission.harga_sewa
    let c3_score = 1
    let isC3Penalized = false

    if (harga === null || harga === undefined || harga === 0) {
      c3_score = 1
      isC3Penalized = true
    } else if (harga <= 50000000) {
      c3_score = 5
    } else if (harga > 50000000 && harga <= 80000000) {
      c3_score = 4
    } else if (harga > 80000000 && harga <= 110000000) {
      c3_score = 3
    } else if (harga > 110000000 && harga <= 150000000) {
      c3_score = 2
    } else {
      c3_score = 1
    }

    // --- PERHITUNGAN SPK SAW ---
    const R_c1 = c1_score / 5
    const R_c2 = c2_score / 5
    const R_c3 = c3_score / 5

    // Bobot kriteria W = [0.40, 0.25, 0.35]
    const final_score = (0.40 * R_c1) + (0.25 * R_c2) + (0.35 * R_c3)

    // --- GENERATE ANALISIS OTOMATIS (saw_analysis_notes) ---
    let saw_analysis_notes = ''
    if (isC2Penalized || isC3Penalized) {
      saw_analysis_notes = '⚠️ Data Belum Siap. Pastikan semua dokumen wajib telah terverifikasi dan harga sewa telah di-input.'
    } else if (submission.status === 'Draft') {
      saw_analysis_notes = '⚠️ Berkas belum diajukan oleh Cabang.'
    } else if (final_score >= 0.75) {
      const maxScore = Math.max(c1_score, c2_score, c3_score)
      if (c1_score === maxScore) {
        saw_analysis_notes = '🔥 **Rekomendasi Utama!** Nilai kelayakan tinggi didominasi oleh aspek legalitas hukum yang 100% aman dan bersih. Lokasi ini sangat minim risiko sengketa di masa depan.'
      } else if (c2_score === maxScore) {
        saw_analysis_notes = '🔥 **Sangat Layak Eksekusi!** Lokasi ini unggul karena kerja sama yang sangat responsif dari pemilik lahan dan tim cabang, membuat proses mobilisasi berkas selesai dalam waktu singkat.'
      } else {
        saw_analysis_notes = '🔥 **Peluang Investasi Tinggi!** Keunggulan utama lokasi ini ada pada efisiensi biaya. Harga sewa ruko ini berada jauh di bawah rata-rata pasar, menjamin Payback Period yang jauh lebih cepat.'
      }
    } else {
      const minScore = Math.min(c1_score, c2_score, c3_score)
      if (c1_score === minScore) {
        saw_analysis_notes = '⚠️ **Penundaan Direkomendasikan.** Skor akhir anjlok akibat banyaknya dokumen wajib yang belum diverifikasi/tidak lengkap. Segera instruksikan cabang untuk melengkapi berkas.'
      } else if (c2_score === minScore) {
        saw_analysis_notes = '⚠️ **Evaluasi Operasional.** Proses birokrasi pengumpulan berkas dari pemilik lahan sangat lambat. Risiko momentum grand opening terlewat oleh kompetitor.'
      } else {
        saw_analysis_notes = '⚠️ **Risiko Finansial Tinggi!** Harga sewa properti ini tergolong sangat mahal. Beban operasional (OPEX) tahunan berisiko membengkak dan menekan margin keuntungan gerai.'
      }
    }

    // --- UPDATE DATABASE ---
    const { error: updateError } = await supabase
      .from('ulok_submissions')
      .update({
        c1_score,
        c2_score,
        c3_score,
        final_score,
        saw_analysis_notes
      })
      .eq('id', ulokId)

    if (updateError) {
      throw new Error('Gagal memperbarui nilai analisis SAW di database: ' + updateError.message)
    }

    // Revalidasi jalur agar data langsung terupdate di UI
    revalidatePath('/admin/assessor/penilaian')
    revalidatePath(`/admin/assessor/penilaian/ulok-perorangan`)
    revalidatePath(`/admin/assessor/penilaian/ulok-badanhukum`)

    return {
      success: true,
      data: {
        c1_score,
        c2_score,
        c3_score,
        final_score,
        saw_analysis_notes
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Server Action untuk mengambil leaderboard SAW (seluruh usulan lokasi)
 * diurutkan berdasarkan final_score secara descending.
 */
export async function getSAWLeaderboard() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized: Silakan login kembali')
    }

    const { data, error } = await supabase
      .from('ulok_submissions')
      .select(`
        *,
        profiles:admin_id (
          id,
          full_name,
          branch_id,
          branches:branch_id (
            id,
            nama_cabang
          )
        )
      `)
      .order('final_score', { ascending: false })

    if (error) {
      throw new Error('Gagal mengambil leaderboard: ' + error.message)
    }

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Server Action untuk mengambil branch_id dari user yang sedang login saat ini.
 */
export async function getCurrentUserBranchId() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('branch_id')
      .eq('id', user.id)
      .single()

    return profile?.branch_id || null
  } catch {
    return null
  }
}
