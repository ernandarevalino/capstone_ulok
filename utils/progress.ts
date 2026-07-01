export function getEffectiveChecklistId(doc: any, currentJbh: string): number | null {
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

export function getChecklistMasterIds(submission: any, documents: any[]): number[] {
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

export function calculateProgress(submission: any, documents: any[]) {
  const flattened = {
    ...submission,
    ...(submission.ulok_pemilik || {}),
    ...(submission.ulok_sertifikat || {}),
    ...(submission.ulok_legal || {}),
    ...(submission.ulok_jaminan || {}),
  }

  const checklistMasterIds = getChecklistMasterIds(flattened, documents)
  const denominator = checklistMasterIds.length

  const uniqueUploadedIds = new Set<number>()
  for (const doc of documents || []) {
    const effectiveId = getEffectiveChecklistId(doc, flattened.jenis_badan_hukum)
    if (effectiveId !== null && checklistMasterIds.includes(effectiveId)) {
      uniqueUploadedIds.add(effectiveId)
    }
  }

  const numerator = uniqueUploadedIds.size
  const persentase = denominator > 0 ? parseFloat(((numerator / denominator) * 100).toFixed(2)) : 0

  return { numerator, denominator, persentase }
}
