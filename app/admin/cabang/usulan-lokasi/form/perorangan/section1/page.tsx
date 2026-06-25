'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getUploadedDocuments, uploadUlokFile, deleteUlokFile } from '@/actions/cabang'

export default function Section1PeroranganPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id') || ''
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  const [statusKepemilikan, setStatusKepemilikan] = useState('Perorangan')
  const [namaPemegang, setNamaPemegang] = useState('')
  const [nik, setNik] = useState('')
  const [namaKitas, setNamaKitas] = useState('')
  const [noKK, setNoKK] = useState('')
  const [noBukuNikah, setNoBukuNikah] = useState('')
  const [namaSebelumGanti, setNamaSebelumGanti] = useState('')
  const [namaSesudahGanti, setNamaSesudahGanti] = useState('')
  const [noSuratKematian, setNoSuratKematian] = useState('')

  const [hasEktp, setHasEktp] = useState(false)
  const [hasKitas, setHasKitas] = useState(false)

  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalText, setSuccessModalText] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; url: string } | null>(null)

  const loadDataDanDokumen = async () => {
    if (!ulokId) return
    setIsLoading(true)
    
    const resDetail = await getUlokDetail(ulokId)
    if (resDetail.success && resDetail.data) {
      const d = resDetail.data
      setStatusKepemilikan(d.jenis_badan_hukum || 'Perorangan')
      setNamaPemegang(d.nama_pemegang_hak || '')
      setNik(d.nik_pemilik || '')
      setNamaKitas(d.nama_kitas || '')
      setNoKK(d.no_kk || '')
      setNoBukuNikah(d.no_buku_nikah || '')
      setNamaSebelumGanti(d.nama_sebelum_ganti || '')
      setNamaSesudahGanti(d.nama_sesudah_ganti || '')
      setNoSuratKematian(d.no_surat_kematian || '')

      if (d.nik_pemilik || d.nama_pemegang_hak) setHasEktp(true)
      if (d.nama_kitas) setHasKitas(true)
    }

    const resDocs = await getUploadedDocuments(ulokId)
    if (resDocs.success && resDocs.data) {
      setUploadedDocs(resDocs.data)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    if (!ulokId) {
      router.push('/admin/cabang/usulan-lokasi')
      return
    }
    loadDataDanDokumen()
  }, [ulokId])

  const handleFileUpload = async (docType: string, file: File) => {
    if (!file || !ulokId) return
    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const res = await uploadUlokFile(ulokId, docType, formData)
      if (res.success) {
        setSuccessModalText('Berkas berhasil diperbarui!')
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 1500)

        const resDocs = await getUploadedDocuments(ulokId)
        if (resDocs.success && resDocs.data) setUploadedDocs(resDocs.data)
      } else {
        alert(`Gagal mengunggah: ` + res.error)
      }
    })
  }

  const executeDelete = async () => {
    if (!deleteTarget) return

    startTransition(async () => {
      const res = await deleteUlokFile(deleteTarget.id, deleteTarget.url)
      if (res.success) {
        setDeleteTarget(null)
        
        setSuccessModalText('Berkas berhasil dihapus!')
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 1500)

        const resDocs = await getUploadedDocuments(ulokId)
        if (resDocs.success && resDocs.data) setUploadedDocs(resDocs.data)
      } else {
        alert("Gagal menghapus berkas: " + res.error)
        setDeleteTarget(null)
      }
    })
  }

  const renderUploadSlot = (docType: string, label: string, subLabel: string) => {
    const existingFile = uploadedDocs.find(doc => doc.document_type === docType)
    return (
      <div className="bg-gray-50 dark:bg-gray-800/25 p-3 rounded-2xl flex flex-col justify-between gap-2 transition hover:bg-gray-100 dark:hover:bg-gray-800/40">
        <div>
          <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] block">{label}</span>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{subLabel}</p>
        </div>
        {existingFile ? (
          <div className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/20 p-1.5 rounded border border-emerald-200 dark:border-emerald-900/40">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-30">📄 Tersimpan</span>
            <div className="flex gap-1.5 items-center">
              <a 
                href={existingFile.file_url} 
                target="_blank" 
                rel="noreferrer" 
                className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all"
                title="View File"
              >
                <img src="/icons/icon-view.svg" alt="View" className="w-3.5 h-3.5 object-contain dark:invert" />
              </a>
              <button 
                type="button" 
                onClick={() => setDeleteTarget({ id: existingFile.id, url: existingFile.file_url })} 
                className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 transition-all"
                title="Delete File"
              >
                <img src="/icons/icon-remove.svg" alt="Delete" className="w-3.5 h-3.5 object-contain" />
              </button>
            </div>
          </div>
        ) : (
          <input 
            type="file" 
            accept=".pdf, .jpg, .jpeg, .png"
            disabled={isPending}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) handleFileUpload(docType, e.target.files[0])
            }}
            className="text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-gray-200 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-300 dark:hover:file:bg-gray-600 file:cursor-pointer w-full text-gray-400 dark:text-gray-500 animate-fadeIn" 
          />
        )}
      </div>
    )
  }

  const handleNavigation = async (targetPath: string) => {
    if (!ulokId) return
    startTransition(async () => {
      const payload = {
        jenis_badan_hukum: statusKepemilikan,
        nama_pemegang_hak: namaPemegang,
        nik_pemilik: nik,
        nama_kitas: namaKitas,
        no_kk: noKK,
        no_buku_nikah: noBukuNikah,
        nama_sebelum_ganti: namaSebelumGanti,
        nama_sesudah_ganti: namaSesudahGanti,
        no_surat_kematian: noSuratKematian,
      }

      const res = await updateUlokSubmission(ulokId, payload)
      if (res.success) {
        router.push(targetPath)
      } else {
        alert("Gagal melakukan penyimpanan data: " + res.error)
      }
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-400 dark:text-gray-500 italic text-sm font-medium transition-colors duration-300">
        <div className="w-6 h-6 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        Memuat Form Section 1...
      </div>
    )
  }
  return (
    <div>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* === BREADCRUMB === */}
        <nav className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 select-none mb-10 mt-8 uppercase tracking-wider">
          <span 
            onClick={() => router.push('/admin/cabang/usulan-lokasi')} 
            className="cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition"
          >
            Usulan Lokasi
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span 
            onClick={() => router.push(`/admin/cabang/usulan-lokasi/form/perorangan?id=${ulokId}`)} 
            className="cursor-pointer hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Form Perorangan
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-800 dark:text-gray-100 font-bold">Section 1: Identitas</span>
        </nav>

        {/* === HEADER === */}
        <div className="bg-blue-950 dark:bg-[#1E293B] text-white p-6 rounded-xl flex justify-between items-center shadow-sm border border-transparent dark:border-gray-800">
          <div>
            <h1 className="text-lg font-bold">Section 1: Identitas Pemilik & Status Kepemilikan</h1>
            <p className="text-xs text-blue-200/80 dark:text-gray-400 mt-0.5">Seluruh inputan teks akan disimpan otomatis saat Anda klik tombol 'Next'.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20 dark:border-gray-700">1 / 2</span>
        </div>

        {/* === FORM: IDENTITAS & PAJAK === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-perorangan.svg" alt="Perorangan" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Dokumen Identitas & Pajak Dasar
          </h3>
            
            <div className="rounded-3xl p-4 bg-gray-50/35 dark:bg-gray-800/15 space-y-3">
              <label className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 cursor-pointer text-xs">
                <input type="checkbox" checked={hasEktp} onChange={(e) => setHasEktp(e.target.checked)} className="rounded accent-blue-950 dark:accent-blue-500 w-4 h-4" />
                Dokumen E-KTP Pemilik
              </label>
              {hasEktp && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 pl-6 border-l-2 border-blue-950/30 dark:border-gray-700">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Nama Lengkap Sesuai KTP</label>
                    <input type="text" value={namaPemegang} onChange={(e) => setNamaPemegang(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nama Lengkap" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">NIK Pemilik (16 Digit)</label>
                    <input type="text" maxLength={16} value={nik} onChange={(e) => setNik(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Masukkan NIK" />
                  </div>
                  {renderUploadSlot("ktp_pemilik", "File Scan E-KTP", "Format PDF/JPG, Maksimal 2MB")}
                </div>
              )}
            </div>

            <div className="rounded-3xl p-4 bg-gray-50/35 dark:bg-gray-800/15 space-y-3">
              <label className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 cursor-pointer text-xs">
                <input type="checkbox" checked={hasKitas} onChange={(e) => setHasKitas(e.target.checked)} className="rounded accent-blue-950 dark:accent-blue-500 w-4 h-4" />
                KITAS / KITAP (Khusus WNA)
              </label>
              {hasKitas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 pl-6 border-l-2 border-blue-950/30 dark:border-gray-700">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Nama Sesuai Paspor / KITAS</label>
                    <input type="text" value={namaKitas} onChange={(e) => setNamaKitas(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nama Sesuai Paspor" />
                  </div>
                  {renderUploadSlot("kitas_kitap", "File Scan KITAS / KITAP", "Format PDF, Maksimal 2MB")}
                </div>
              )}
            </div>

            {/* === FORM: DOKUMEN PAJAK === */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {renderUploadSlot("npwp", "Scan NPWP Asli", "Format PDF/PNG")}
              {renderUploadSlot("pkp_sppkp", "Scan PKP / SPPKP", "Format PDF")}
              {renderUploadSlot("non_pkp", "Scan Non PKP / Surat Pernyataan", "Format PDF")}
            </div>
          </div>

        {/* === FORM: KK & PERNIKAHAN === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-family.svg" alt="Family" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Kartu Keluarga & Status Pernikahan
          </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">No. Kartu Keluarga (KK)</label>
                <input type="text" value={noKK} onChange={(e) => setNoKK(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nomor KK 16 Digit" />
              </div>
              {renderUploadSlot("kartu_keluarga", "File Scan Kartu Keluarga", "Format PDF")}
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">No. Buku Nikah / Akta Perkawinan</label>
                <input type="text" value={noBukuNikah} onChange={(e) => setNoBukuNikah(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nomor Buku Nikah" />
              </div>
              {renderUploadSlot("buku_nikah", "File Scan Buku Nikah", "Format PDF")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {renderUploadSlot("persetujuan_pasangan", "Surat Persetujuan Suami / Istri", "Wajib di-ttd pasangan")}
              {renderUploadSlot("akta_cerai", "Akta Cerai (Apabila Cerai)", "Format PDF resmi")}
            </div>
          </div>

        {/* === FORM: GANTI NAMA === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-nama.svg" alt="Ganti Nama" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Surat Penetapan Ganti Nama (Jika Ada)
          </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Nama Sebelum Ganti</label>
                <input type="text" value={namaSebelumGanti} onChange={(e) => setNamaSebelumGanti(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nama Lama" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Nama Sesudah Ganti</label>
                <input type="text" value={namaSesudahGanti} onChange={(e) => setNamaSesudahGanti(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nama Baru" />
              </div>
              {renderUploadSlot("dokumen_ganti_nama", "Dokumen Penetapan Resmi", "Format PDF")}
            </div>
          </div>

        {/* === FORM: STATUS KEPEMILIKAN === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-file.svg" alt="Status Khusus" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Status Khusus Kepemilikan Lahan
          </h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Pilihan Hubungan Status Kepemilikan:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Perorangan', 'Kuasa', 'Waris', 'Hibah'].map((item) => (
                  <label key={item} className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition font-bold text-xs ${statusKepemilikan === item ? 'border-blue-950 bg-blue-50/50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                    <input type="radio" name="statusKepemilikan" checked={statusKepemilikan === item} onChange={() => setStatusKepemilikan(item)} className="accent-blue-950 dark:accent-blue-500 w-4 h-4" />
                    {item === 'Perorangan' ? 'Pemilik Langsung' : item}
                  </label>
                ))}
              </div>
            </div>

            {statusKepemilikan === 'Kuasa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/40 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 animate-fadeIn">
                {renderUploadSlot("akta_kuasa", "Akta Kuasa Notariil / Legalisasi", "Scan dokumen kuasa resmi")}
                {renderUploadSlot("ktp_kuasa", "KTP Penerima Kuasa", "Scan identitas penerima kuasa")}
              </div>
            )}

            {statusKepemilikan === 'Waris' && (
              <div className="bg-red-50/30 dark:bg-red-950/10 p-4 rounded-xl border border-red-100 dark:border-red-900/40 space-y-4 animate-fadeIn">
                <p className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">⚠️ Berkas Tambahan Khusus Ahli Waris:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderUploadSlot("akta_waris", "Akta Waris / SK Waris Resmi", "Scan seluruh lembar ket. waris")}
                  {renderUploadSlot("ktp_ahli_waris", "KTP Ahli Waris", "Format PDF/JPG")}
                  {renderUploadSlot("kk_ahli_waris", "KK Ahli Waris", "Format PDF")}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">No. Surat Keterangan Kematian</label>
                    <input type="text" value={noSuratKematian} onChange={(e) => setNoSuratKematian(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nomor Surat Kematian" />
                  </div>
                  {renderUploadSlot("surat_kematian", "Scan Berkas Surat Kematian Asli", "Format PDF")}
                </div>
              </div>
            )}

            {statusKepemilikan === 'Hibah' && (
              <div className="bg-emerald-50/30 dark:bg-emerald-950/10 p-4 rounded-3xl animate-fadeIn">
                {renderUploadSlot("akta_hibah", "Akta Hibah Resmi", "Scan berkas akta hibah notariil/PPAT")}
              </div>
            )}
          </div>

        {/* === NAVIGASI === */}
        <div className="flex justify-between items-center bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-300 dark:border-gray-800 shadow-sm">
          <button 
            type="button" 
            disabled={isPending}
            onClick={() => handleNavigation('/admin/cabang/usulan-lokasi/form/perorangan?id=' + ulokId)} 
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Back
          </button>
          <button 
            type="button" 
            disabled={isPending}
            onClick={() => handleNavigation(`/admin/cabang/usulan-lokasi/form/perorangan/section2?id=${ulokId}`)} 
            className="bg-blue-950 dark:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 dark:hover:bg-blue-500 transition disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Next'}
          </button>
        </div>

      </div>

      {/* === MODAL: SUKSES === */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <img src="/icons/icon-check.svg" alt="Success" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              {successModalText}
            </p>
          </div>
        </div>
      )}

      {/* === MODAL: KONFIRMASI HAPUS === */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <img src="/icons/icon-hand.svg" alt="Confirm" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              Apakah Anda yakin ingin menghapus berkas ini?
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
              >
                No
              </button>
              <button
                onClick={executeDelete}
                disabled={isPending}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 font-bold px-4 py-2 text-sm transition-all flex items-center gap-1.5"
              >
                {isPending ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Yes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}