'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server Action untuk menghitung skor SPK SAW (Simple Additive Weighting)
 * berdasarkan kriteria C1 (Kelengkapan Dokumen), C2 (Durasi Mobilisasi), dan C3 (Harga Sewa).
 * Dan menyimpan hasilnya kembali ke database.
 * * @param ulokId - ID dari usulan lokasi yang akan dihitung
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

    // --- KRITERIA C1: Kelengkapan Dokumen Berdasarkan Checklist Assessor ---
    let checklistMasterIds: number[] = []
    const jbh = submission.jenis_badan_hukum

    if (jbh === 'PT' || jbh === 'Yayasan' || jbh === 'Koperasi') {
      // 1. JALUR BADAN HUKUM (PT, Yayasan, Koperasi)
      const isDikuasakan = !!submission.is_dikuasakan || (documents ? documents.some(doc => doc.document_type === 'akta_kuasa') : false)
      
      if (jbh === 'PT') {
        // PT Pokok: ID 1-9, ID 14, 15
        checklistMasterIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15]
        
        // Cek kondisi Kuasa: ID 10
        if (isDikuasakan) {
          checklistMasterIds.push(10)
        }
        
        // Cek kondisi RUPS: ID 11
        if (documents && documents.some(doc => doc.checklist_id === 11 || doc.document_type === 'rups_persetujuan')) {
          checklistMasterIds.push(11)
        }
        
        // Aturan Substitusi Lahan: Sertifikat (ID 12) vs AJB (ID 13)
        const hasSertifikat = documents && documents.some(doc => doc.checklist_id === 12 || doc.document_type === 'sertifikat_tanah')
        const hasAjb = documents && documents.some(doc => doc.checklist_id === 13 || doc.document_type === 'ajb_girik')
        if (hasSertifikat) {
          checklistMasterIds.push(12)
        } else if (hasAjb) {
          checklistMasterIds.push(13)
        } else {
          checklistMasterIds.push(12) // default jika kosong dua-duanya
        }
        
        // Cek kondisi SLF: ID 16
        if (documents && documents.some(doc => doc.checklist_id === 16 || doc.document_type === 'slf')) {
          checklistMasterIds.push(16)
        }
      } else if (jbh === 'Yayasan') {
        // Yayasan Pokok: ID 17-24, ID 28, 29
        checklistMasterIds = [17, 18, 19, 20, 21, 22, 23, 24, 28, 29]
        
        // Cek kondisi Kuasa: ID 25
        if (isDikuasakan) {
          checklistMasterIds.push(25)
        }
        
        // Aturan Substitusi Lahan: Sertifikat (ID 26) vs AJB (ID 27)
        const hasSertifikat = documents && documents.some(doc => doc.checklist_id === 26 || doc.document_type === 'sertifikat_tanah')
        const hasAjb = documents && documents.some(doc => doc.checklist_id === 27 || doc.document_type === 'ajb_girik')
        if (hasSertifikat) {
          checklistMasterIds.push(26)
        } else if (hasAjb) {
          checklistMasterIds.push(27)
        } else {
          checklistMasterIds.push(26) // default jika kosong dua-duanya
        }
        
        // Cek kondisi SLF: ID 30
        if (documents && documents.some(doc => doc.checklist_id === 30 || doc.document_type === 'slf')) {
          checklistMasterIds.push(30)
        }
      } else if (jbh === 'Koperasi') {
        // Koperasi Pokok: ID 31-38, ID 42, 43
        checklistMasterIds = [31, 32, 33, 34, 35, 36, 37, 38, 42, 43]
        
        // Cek kondisi Kuasa: ID 39
        if (isDikuasakan) {
          checklistMasterIds.push(39)
        }
        
        // Aturan Substitusi Lahan: Sertifikat (ID 40) vs AJB (ID 41)
        const hasSertifikat = documents && documents.some(doc => doc.checklist_id === 40 || doc.document_type === 'sertifikat_tanah')
        const hasAjb = documents && documents.some(doc => doc.checklist_id === 41 || doc.document_type === 'ajb_girik')
        if (hasSertifikat) {
          checklistMasterIds.push(40)
        } else if (hasAjb) {
          checklistMasterIds.push(41)
        } else {
          checklistMasterIds.push(40) // default jika kosong dua-duanya
        }
        
        // Cek kondisi SLF: ID 44
        if (documents && documents.some(doc => doc.checklist_id === 44 || doc.document_type === 'slf')) {
          checklistMasterIds.push(44)
        }
      }
    } else if (['Perorangan', 'Kuasa', 'Waris', 'Hibah'].includes(jbh)) {
      // 2. JALUR ORANG PERORANGAN (Dinamis Kasus)
      // Masukkan 5 Berkas Pokok yang selalu wajib: ID 47, 48, 49, 56, dan 57
      checklistMasterIds = [47, 48, 49, 56, 57]
      
      // Kasus Kewarganegaraan: KITAS/KITAP atau WNA (ID 46) vs WNI biasa (ID 45)
      const hasKitasDoc = documents && documents.some(doc => doc.document_type === 'kitas_kitap' || doc.checklist_id === 46)
      const isWNA = !!submission.nama_kitas || hasKitasDoc || submission.jenis_identitas === 'KITAS' || submission.jenis_identitas === 'KITAP' || submission.jenis_identitas === 'WNA'
      if (isWNA) {
        checklistMasterIds.push(46)
      } else {
        checklistMasterIds.push(45)
      }
      
      // Kasus Status Pernikahan: Menikah (ID 50, 51) vs Cerai (ID 53) vs Lajang
      const hasBukuNikah = !!submission.no_buku_nikah || (documents && documents.some(doc => doc.document_type === 'buku_nikah' || doc.checklist_id === 50))
      const hasCerai = documents && documents.some(doc => doc.document_type === 'akta_cerai' || doc.checklist_id === 53)
      if (hasBukuNikah) {
        checklistMasterIds.push(50, 51)
      } else if (hasCerai) {
        checklistMasterIds.push(53)
      }
      
      // Kasus Perubahan Nama: ID 52 jika nama_sebelum_ganti atau nama_sesudah_ganti tidak kosong
      if (submission.nama_sebelum_ganti || submission.nama_sesudah_ganti) {
        checklistMasterIds.push(52)
      }
      
      // Kasus Perolehan Lahan Khusus: Kuasa (ID 59, 60) vs Waris (ID 61, 62, 63, 64) vs Hibah (ID 65)
      if (jbh === 'Kuasa') {
        checklistMasterIds.push(59, 60)
      } else if (jbh === 'Waris') {
        checklistMasterIds.push(61, 62, 63, 64)
        // Keluarkan E-KTP Pemilik Utama (ID 45) dari pembagi wajib
        checklistMasterIds = checklistMasterIds.filter(id => id !== 45)
      } else if (jbh === 'Hibah') {
        checklistMasterIds.push(65)
      }
      
      // Aturan Substitusi Lahan Perorangan: Sertifikat (ID 54) vs AJB (ID 55)
      const hasSertifikatPerorangan = documents && documents.some(doc => doc.checklist_id === 54 || doc.document_type === 'sertifikat_tanah')
      const hasAjbPerorangan = documents && documents.some(doc => doc.checklist_id === 55 || doc.document_type === 'ajb_girik')
      if (hasSertifikatPerorangan) {
        checklistMasterIds.push(54)
      } else if (hasAjbPerorangan) {
        checklistMasterIds.push(55)
      } else {
        checklistMasterIds.push(54) // default jika kosong dua-duanya
      }
      
      // Cek kondisi SLF Perorangan: ID 58
      if (documents && documents.some(doc => doc.checklist_id === 58 || doc.document_type === 'slf')) {
        checklistMasterIds.push(58)
      }
    }

    // Denominator = Jumlah dokumen master wajib
    const denominator = checklistMasterIds.length

    // Helper function to translate document_type to effectiveId
    const getEffectiveChecklistId = (doc: any, currentJbh: string): number | null => {
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

    // Numerator = Berkas Lolos Verifikasi Assessor
    const numerator = documents
      ? documents.filter((doc) => {
          if (doc.is_verified !== true) return false
          const effectiveId = getEffectiveChecklistId(doc, jbh)
          return effectiveId !== null && checklistMasterIds.includes(effectiveId)
        }).length
      : 0

    // Hitung persentase kelengkapan
    const pct = denominator > 0 ? (numerator / denominator) * 100 : 0

    // Konversi persentase ke c1_score (skala 1-5)
    let c1_score = 1
    if (numerator === 0 || pct === 0) {
      c1_score = 1
    } else if (pct >= 80 && pct <= 100) {
      c1_score = 5
    } else if (pct >= 60 && pct < 80) {
      c1_score = 4
    } else if (pct >= 40 && pct < 60) {
      c1_score = 3
    } else if (pct >= 20 && pct < 40) {
      c1_score = 2
    } else {
      c1_score = 1
    }

    // --- KRITERIA C2: Durasi Review Legal Berdasarkan Perubahan Status ---
    let c2_score = 1
    let durasi = 0

    // PERBAIKAN: Perhitungan durasi C2 SEKARANG HANYA dikunci & dihitung jika status beneran 'Approved'
    if (submission.status === 'Approved') {
      if (submission.first_in_review_at && submission.approved_at) {
        const tanggalAkhir = new Date(submission.approved_at)
        const diffTime = tanggalAkhir.getTime() - new Date(submission.first_in_review_at).getTime()
        let calculatedDurasi = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        if (calculatedDurasi < 1) {
          calculatedDurasi = 1
        }
        durasi = calculatedDurasi
      } else {
        c2_score = 1
        durasi = 0
      }
    } else {
      // Jika statusnya 'In Review', 'Revision', 'Rejected', atau 'Draft'
      // Nilai otomatis balik ke default (1) / reset karena perhitungan belum selesai atau diulang
      c2_score = 1
      durasi = 0
    }

    // Penentuan bobot nilai C2 berdasarkan durasi (Hanya berlaku jika status Approved)
    if (durasi > 0 && submission.status === 'Approved') {
      if (durasi < 5) {
        c2_score = 5
      } else if (durasi >= 5 && durasi <= 12) {
        c2_score = 4
      } else if (durasi > 12 && durasi <= 20) {
        c2_score = 3
      } else if (durasi > 20 && durasi <= 30) {
        c2_score = 2
      } else {
        c2_score = 1
      }
    } else {
      c2_score = 1
    }

    // --- KRITERIA C3: Harga Sewa Total per 5 Tahun ---
    const harga = submission.harga_sewa
    let c3_score = 1

    if (harga === null || harga === undefined || harga === 0) {
      c3_score = 1
    } else {
      const totalSewa5Tahun = harga
      if (totalSewa5Tahun < 250000000) {
        c3_score = 5
      } else if (totalSewa5Tahun >= 250000000 && totalSewa5Tahun <= 350000000) {
        c3_score = 4
      } else if (totalSewa5Tahun > 350000000 && totalSewa5Tahun <= 450000000) {
        c3_score = 3
      } else if (totalSewa5Tahun > 450000000 && totalSewa5Tahun <= 550000000) {
        c3_score = 2
      } else {
        c3_score = 1
      }
    }

    // --- PERHITUNGAN SPK SAW ---
    // Normalisasi matriks R
    const R_c1 = c1_score / 5
    const R_c2 = c2_score / 5
    const R_c3 = c3_score / 5

    // Bobot kriteria: C1=45%, C2=35%, C3=20%
    const final_score = (0.45 * R_c1) + (0.35 * R_c2) + (0.20 * R_c3)

    // --- GENERATE ANALISIS OTOMATIS (saw_analysis_notes) ---
    let base_notes = ''
    if (submission.status === 'Draft') {
      base_notes = '⚠️ Berkas belum diajukan oleh Cabang.'
    } else if (submission.status === 'In Review') {
      base_notes = '⏳ **Menunggu Review.** Skor saat ini belum dapat ditentukan karena proses review legal belum dimulai oleh Assessor.'
    } else if (final_score >= 0.75) {
      const maxScore = Math.max(c1_score, c2_score, c3_score)
      if (c1_score === maxScore) {
        base_notes = '🔥 **Rekomendasi Utama!** Nilai kelayakan tinggi didominasi oleh aspek kelengkapan dokumen berdasarkan checklist assessor yang aman dan bersih. Lokasi ini sangat minim risiko hukum di masa depan.'
      } else if (c2_score === maxScore) {
        base_notes = '🔥 **Sangat Layak Eksekusi!** Lokasi ini unggul karena durasi review legal yang sangat cepat dan efisien, menunjukkan kesiapan proses administrasi yang optimal.'
      } else {
        base_notes = '🔥 **Peluang Investasi Tinggi!** Keunggulan utama lokasi ini ada pada efisiensi biaya. Total biaya sewa masa 5 tahun berada jauh di bawah rata-rata pasar, menjamin Payback Period yang lebih cepat.'
      }
    } else {
      const minScore = Math.min(c1_score, c2_score, c3_score)
      if (c1_score === minScore) {
        base_notes = '⚠️ **Penundaan Direkomendasikan.** Skor akhir rendah akibat kelengkapan dokumen wajib berdasarkan verifikasi checklist assessor masih minim. Segera lengkapi berkas.'
      } else if (c2_score === minScore) {
        base_notes = '⚠️ **Evaluasi Operasional.** Durasi review legal yang lambat menunjukkan hambatan administrasi. Risiko momentum pembukaan gerai terlewat.'
      } else {
        base_notes = '⚠️ **Risiko Finansial Tinggi!** Total biaya sewa masa 5 tahun tergolong sangat mahal. Beban pengeluaran finansial berisiko menekan profitabilitas gerai.'
      }
    }

    let saw_analysis_notes = base_notes

    // Cek apakah ada salah satu kriteria yang mendapat nilai default minimum (skor 1) karena belum lengkap
    const isC1Default = (numerator === 0 || pct === 0)
    const isC2Default = !submission.first_in_review_at
    const isC3Default = (harga === null || harga === undefined || harga === 0)

    if (isC1Default || isC2Default || isC3Default) {
      saw_analysis_notes += '\n\n*Catatan: Skor saat ini masih bersifat sementara (berjalan) karena pengisian data finansial atau review dokumen belum sepenuhnya rampung.*'
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
    revalidatePath('/admin/assessor/penilaian/ulok-perorangan/[id]', 'page')
    revalidatePath('/admin/assessor/penilaian/ulok-badanhukum/[id]', 'page')
    revalidatePath(`/admin/assessor/penilaian/ulok-perorangan/detail-penilaian/section1`)
    revalidatePath(`/admin/assessor/penilaian/ulok-perorangan/detail-penilaian/section2`)
    revalidatePath(`/admin/assessor/penilaian/ulok-badanhukum/detail-penilaian/section1`)
    revalidatePath(`/admin/assessor/penilaian/ulok-badanhukum/detail-penilaian/section2`)

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

    // Ambil semua ID dari ulok_submissions untuk menghitung ulang skor secara real-time
    const { data: allSubmissions, error: allSubError } = await supabase
      .from('ulok_submissions')
      .select('id')

    if (allSubError) {
      throw new Error('Gagal mengambil daftar usulan lokasi: ' + allSubError.message)
    }

    if (allSubmissions && allSubmissions.length > 0) {
      for (const sub of allSubmissions) {
        await calculateULOKSAW(sub.id)
      }
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