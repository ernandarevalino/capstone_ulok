'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, getUploadedDocuments } from '@/actions/cabang'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { toggleDocumentVerification } from '@/actions/assessor'
import { calculateULOKSAW } from '@/actions/saw'

export default function Section1PeroranganAssessorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id') || ''
  
  // State Utama
  const [isLoading, setIsLoading] = useState(true)
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null)

  // State Form Teks (Read-Only)
  const [statusKepemilikan, setStatusKepemilikan] = useState('Perorangan')
  const [namaPemegang, setNamaPemegang] = useState('')
  const [nik, setNik] = useState('')
  const [namaKitas, setNamaKitas] = useState('')
  const [noKK, setNoKK] = useState('')
  const [noBukuNikah, setNoBukuNikah] = useState('')
  const [namaSebelumGanti, setNamaSebelumGanti] = useState('')
  const [namaSesudahGanti, setNamaSesudahGanti] = useState('')
  const [noSuratKematian, setNoSuratKematian] = useState('')

  // State Kontrol Checkbox UI
  const [hasEktp, setHasEktp] = useState(false)
  const [hasKitas, setHasKitas] = useState(false)

  // State Berkas Terupload
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])

  // State Baru untuk Custom Toast Modal Success / Error
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalText, setSuccessModalText] = useState('')

  const handleToggleVerify = async (docId: string, currentStatus: boolean) => {
    setVerifyingDocId(docId)
    
    // Optimistic Update (UI berubah instan demi kenyamanan user)
    setUploadedDocs(prev => prev.map(doc => {
      if (doc.id === docId) {
        return { ...doc, is_verified: !currentStatus }
      }
      return doc
    }))
    
    const res = await toggleDocumentVerification(docId, currentStatus)
    
    if (!res.success) {
      // Rollback jika gagal
      setUploadedDocs(prev => prev.map(doc => {
        if (doc.id === docId) {
          return { ...doc, is_verified: currentStatus }
        }
        return doc
      }))
      
      // Tampilkan error di modal dengan durasi sedikit lebih lama agar terbaca
      setSuccessModalText(`Gagal memperbarui: ${res.error}`)
      setShowSuccessModal(true)
      setTimeout(() => {
        setShowSuccessModal(false)
      }, 1500)
    } else {
      // Jika berhasil, munculkan modal kustom super cepat (800ms)
      setSuccessModalText(!currentStatus ? 'Verifikasi berhasil!' : 'Verifikasi dibatalkan!')
      setShowSuccessModal(true)
      setTimeout(() => {
        setShowSuccessModal(false)
      }, 800)

      if (ulokId) {
        await calculateULOKSAW(ulokId)
      }
    }
    setVerifyingDocId(null)
  }

  const loadDataDanDokumen = async () => {
    if (!ulokId) return
    setIsLoading(true)
    
    // 1. Ambil data teks dari database
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

    // 2. Ambil data dokumen terupload
    const resDocs = await getUploadedDocuments(ulokId)
    if (resDocs.success && resDocs.data) {
      setUploadedDocs(resDocs.data)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    if (!ulokId) {
      router.push('/admin/assessor/penilaian')
      return
    }
    loadDataDanDokumen()
  }, [ulokId])

  const handleReplyGroup = (groupName: string) => {
    router.push(`/admin/assessor/penilaian/ulok-perorangan?id=${ulokId}&prefill=${encodeURIComponent(`⚠️ [Catatan Assessor - Grup: ${groupName}]: `)}`)
  }

  // Komponen Reusable Slot Render Berkas (View Only & Verify Action)
  const renderUploadSlot = (docType: string, label: string, hint: string) => {
    const existingDoc = uploadedDocs.find(d => d.document_type === docType)

    return (
      <div className="bg-gray-50 dark:bg-gray-800/25 p-3 rounded-2xl flex flex-col justify-between gap-2 transition hover:bg-gray-100 dark:hover:bg-gray-800/40">
        <div>
          <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] block leading-snug">{label}</span>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>
        </div>
        {existingDoc ? (
          <div className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/20 p-1.5 rounded border border-emerald-200 dark:border-emerald-900/40">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-30">📄 Tersimpan</span>
            <div className="flex gap-1.5 items-center">
              
              {/* Button View */}
              <a 
                href={existingDoc.file_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center"
                title="View File"
              >
                <img src="/icons/icon-view.svg" alt="View" className="w-3.5 h-3.5 object-contain dark:invert" />
              </a>

              {/* Button Verify Action */}
              <button
                type="button"
                disabled={verifyingDocId === existingDoc.id}
                onClick={() => handleToggleVerify(existingDoc.id, !!existingDoc.is_verified)}
                title="Verify Document"
                className={`p-1 rounded border shadow-sm transition-all flex items-center justify-center ${
                  existingDoc.is_verified
                    ? 'bg-emerald-100 text-green-600 border-green-300 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-600'
                } ${verifyingDocId === existingDoc.id ? 'opacity-50 cursor-wait' : ''}`}
              >
                {verifyingDocId === existingDoc.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-1.5 rounded border border-dashed border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 flex items-center">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold italic select-none">⚠️ Belum ada dokumen terunggah</span>
          </div>
        )}
      </div>
    )
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* BREADCRUMB NAVIGATION */}
        <nav className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 select-none mb-10 mt-2 uppercase tracking-wider">
          <span 
            onClick={() => router.push('/admin/assessor/penilaian')} 
            className="cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition"
          >
            Penilaian Usulan
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span 
            onClick={() => router.push(`/admin/assessor/penilaian/ulok-perorangan?id=${ulokId}`)} 
            className="cursor-pointer hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Detail Usulan Perorangan
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-800 dark:text-gray-100 font-bold">Section 1: Identitas</span>
        </nav>

        {/* HEADER SECTION */}
        <div className="bg-blue-950 dark:bg-[#1E293B] text-white p-6 rounded-xl flex justify-between items-center shadow-sm border border-transparent dark:border-gray-800">
          <div>
            <h1 className="text-lg font-bold">Penilaian Section 1: Identitas Pemilik & Status Kepemilikan</h1>
            <p className="text-xs text-blue-200/80 dark:text-gray-400 mt-0.5">Peninjauan isian identitas, kartu keluarga, surat keterangan perorangan.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20 dark:border-gray-700">1 / 2</span>
        </div>

        {/* GRUP 1: IDENTITAS & PAJAK DASAR */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <img src="/icons/icon-law.svg" alt="Identitas" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
              Dokumen Identitas & Pajak Dasar
            </h3>
            <button
              type="button"
              onClick={() => handleReplyGroup("Dokumen Identitas & Pajak Dasar")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <img src="/icons/icon-message-now.svg" alt="Reply" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              Reply / Beri Catatan
            </button>
          </div>
            
          {/* Checkbox E-KTP */}
          <div className="rounded-3xl p-4 bg-gray-50/35 dark:bg-gray-800/15 space-y-3 border border-transparent dark:border-gray-800">
            <label className="flex items-center gap-2 font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed text-xs">
              <input type="checkbox" disabled checked={hasEktp} className="rounded accent-blue-950 dark:accent-blue-500 w-4 h-4 cursor-not-allowed" />
              Dokumen E-KTP Pemilik
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 pl-6 border-l-2 border-blue-950/30 dark:border-gray-700">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Nama Lengkap Sesuai KTP</label>
                <input type="text" readOnly value={namaPemegang} className="w-full border p-2 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400 font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">NIK Pemilik (16 Digit)</label>
                <input type="text" readOnly value={nik} className="w-full border p-2 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400 font-medium" />
              </div>
              {renderUploadSlot("ktp_pemilik", "File Scan E-KTP", "Format PDF/JPG, Maksimal 2MB")}
            </div>
          </div>

          {/* Checkbox KITAS/KITAP */}
          <div className="rounded-3xl p-4 bg-gray-50/35 dark:bg-gray-800/15 space-y-3 border border-transparent dark:border-gray-800">
            <label className="flex items-center gap-2 font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed text-xs">
              <input type="checkbox" disabled checked={hasKitas} className="rounded accent-blue-950 dark:accent-blue-500 w-4 h-4 cursor-not-allowed" />
              KITAS / KITAP (Khusus WNA)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 pl-6 border-l-2 border-blue-950/30 dark:border-gray-700">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Nama Sesuai Paspor / KITAS</label>
                <input type="text" readOnly value={namaKitas} className="w-full border p-2 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400 font-medium" />
              </div>
              {renderUploadSlot("kitas_kitap", "File Scan KITAS / KITAP", "Format PDF, Maksimal 2MB")}
            </div>
          </div>

          {/* Dokumen Pajak */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {renderUploadSlot("npwp", "Scan NPWP Asli", "Format PDF/PNG")}
            {renderUploadSlot("pkp_sppkp", "Scan PKP / SPPKP", "Format PDF")}
            {renderUploadSlot("non_pkp", "Scan Non PKP / Surat Pernyataan", "Format PDF")}
          </div>
        </div>

        {/* GRUP 2: KARTU KELUARGA & PERNIKAHAN */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <img src="/icons/icon-file.svg" alt="Keluarga" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
              Kartu Keluarga & Status Pernikahan
            </h3>
            <button
              type="button"
              onClick={() => handleReplyGroup("Kartu Keluarga & Status Pernikahan")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <img src="/icons/icon-message-now.svg" alt="Reply" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              Reply / Beri Catatan
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500">No. Kartu Keluarga (KK)</label>
              <input type="text" readOnly value={noKK} className="w-full border p-2 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400 font-medium" />
            </div>
            {renderUploadSlot("kartu_keluarga", "File Scan Kartu Keluarga", "Format PDF")}
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500">No. Buku Nikah / Akta Perkawinan</label>
              <input type="text" readOnly value={noBukuNikah} className="w-full border p-2 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400 font-medium" />
            </div>
            {renderUploadSlot("buku_nikah", "File Scan Buku Nikah", "Format PDF")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {renderUploadSlot("persetujuan_pasangan", "Surat Persetujuan Suami / Istri", "Wajib di-ttd pasangan")}
            {renderUploadSlot("akta_cerai", "Akta Cerai (Apabila Cerai)", "Format PDF resmi")}
          </div>
        </div>

        {/* GRUP 3: SURAT PENETAPAN GANTI NAMA */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <img src="/icons/icon-file.svg" alt="Ganti Nama" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
              Surat Penetapan Ganti Nama (Jika Ada)
            </h3>
            <button
              type="button"
              onClick={() => handleReplyGroup("Surat Penetapan Ganti Nama")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <img src="/icons/icon-message-now.svg" alt="Reply" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              Reply / Beri Catatan
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Nama Sebelum Ganti</label>
              <input type="text" readOnly value={namaSebelumGanti} className="w-full border p-2 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">Nama Sesudah Ganti</label>
              <input type="text" readOnly value={namaSesudahGanti} className="w-full border p-2 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400 font-medium" />
            </div>
            {renderUploadSlot("dokumen_ganti_nama", "Dokumen Penetapan Resmi", "Format PDF")}
          </div>
        </div>

        {/* GRUP 4: STATUS KHUSUS KEPEMILIKAN LAHAN */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <img src="/icons/icon-law.svg" alt="Status Kepemilikan" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
              Status Khusus Kepemilikan Lahan
            </h3>
            <button
              type="button"
              onClick={() => handleReplyGroup("Status Khusus Kepemilikan Lahan")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <img src="/icons/icon-message-now.svg" alt="Reply" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              Reply / Beri Catatan
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Pilihan Hubungan Status Kepemilikan:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Perorangan', 'Kuasa', 'Waris', 'Hibah'].map((item) => (
                <label key={item} className={`p-3 border rounded-xl flex items-center gap-2 cursor-not-allowed transition font-bold text-xs ${statusKepemilikan === item ? 'border-blue-950 bg-blue-50/50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'}`}>
                  <input type="radio" disabled name="statusKepemilikan" checked={statusKepemilikan === item} className="accent-blue-950 dark:accent-blue-500 w-4 h-4 cursor-not-allowed" />
                  {item === 'Perorangan' ? 'Pemilik Langsung' : item}
                </label>
              ))}
            </div>
          </div>

          {/* DOKUMEN STATUS KEPEMILIKAN */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/40 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-400 md:col-span-2 uppercase tracking-wider">⚠️ Berkas Pelimpahan Kuasa (Kuasa):</p>
              {renderUploadSlot("akta_kuasa", "Akta Kuasa Notariil / Legalisasi", "Scan dokumen kuasa resmi")}
              {renderUploadSlot("ktp_kuasa", "KTP Penerima Kuasa", "Scan identitas penerima kuasa")}
            </div>

            <div className="bg-red-50/30 dark:bg-red-950/10 p-4 rounded-xl border border-red-100 dark:border-red-900/40 space-y-4">
              <p className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">⚠️ Berkas Tambahan Ahli Waris (Waris):</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderUploadSlot("akta_waris", "Akta Waris / SK Waris Resmi", "Scan seluruh lembar ket. waris")}
                {renderUploadSlot("ktp_ahli_waris", "KTP Ahli Waris", "Format PDF/JPG")}
                {renderUploadSlot("kk_ahli_waris", "KK Ahli Waris", "Format PDF")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-1">No. Surat Keterangan Kematian</label>
                  <input type="text" readOnly value={noSuratKematian} className="w-full border p-2 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400 font-medium" />
                </div>
                {renderUploadSlot("surat_kematian", "Scan Berkas Surat Kematian Asli", "Format PDF")}
              </div>
            </div>

            <div className="bg-emerald-50/30 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-3">⚠️ Berkas Penerimaan Hibah (Hibah):</p>
              {renderUploadSlot("akta_hibah", "Akta Hibah Resmi", "Scan berkas akta hibah notariil/PPAT")}
            </div>
          </div>
        </div>

        {/* PANEL TOMBOL NAVIGASI */}
        <div className="flex justify-between items-center bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <button 
            type="button" 
            onClick={() => router.push(`/admin/assessor/penilaian/ulok-perorangan?id=${ulokId}`)} 
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Back
          </button>
          <button 
            type="button" 
            onClick={() => router.push(`/admin/assessor/penilaian/ulok-perorangan/detail-penilaian/section2?id=${ulokId}`)} 
            className="bg-blue-950 dark:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 dark:hover:bg-blue-500 transition"
          >
            Next
          </button>
        </div>

      </div>

      {/* REUSABLE CUSTOM TOAST MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.15s_ease-out]">
            <img src="/icons/icon-check.svg" alt="Success" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              {successModalText}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}