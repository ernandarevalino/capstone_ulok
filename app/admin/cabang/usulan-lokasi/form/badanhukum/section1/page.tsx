'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getUploadedDocuments, uploadUlokFile, deleteUlokFile } from '@/actions/cabang'

export default function Section1BadanHukumPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id') || ''
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  const [statusPajak, setStatusPajak] = useState('Non-PKP')
  const [isDikuasakan, setIsDikuasakan] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalText, setSuccessModalText] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; url: string } | null>(null)

  const formatWaktu = (uploadedAt: string | null | undefined) => {
    if (!uploadedAt) return ''
    try {
      const date = new Date(uploadedAt)
      if (isNaN(date.getTime())) return ''
      const pad = (num: number) => String(num).padStart(2, '0')
      const day = pad(date.getDate())
      const month = pad(date.getMonth() + 1)
      const year = String(date.getFullYear()).slice(-2)
      const hours = pad(date.getHours())
      const minutes = pad(date.getMinutes())
      const seconds = pad(date.getSeconds())
      return ` (${day}-${month}-${year} ${hours}:${minutes}:${seconds})`
    } catch (e) {
      return ''
    }
  }

  const loadDataDanDokumen = async () => {
    if (!ulokId) return
    setIsLoading(true)

    const detailRes = await getUlokDetail(ulokId)

    const resDocs = await getUploadedDocuments(ulokId)
    if (resDocs.success && resDocs.data) {
      setUploadedDocs(resDocs.data)
      const docs = resDocs.data
      
      const hasSppkp = docs.some((d: any) => d.document_type === 'sppkp')
      if (hasSppkp) {
        setStatusPajak('PKP')
      } else {
        setStatusPajak('Non-PKP')
      }

      const hasAktaKuasa = docs.some((d: any) => d.document_type === 'akta_kuasa')
      if (hasAktaKuasa) {
        setIsDikuasakan(true)
      }
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
        setSuccessModalText(`Gagal mengunggah: ` + res.error)
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 2000)
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
        setSuccessModalText("Gagal menghapus berkas: " + res.error)
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 2000)
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
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-none">📄 Tersimpan{formatWaktu(existingFile.uploaded_at)}</span>
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
      const res = await updateUlokSubmission(ulokId, {})
      if (res.success) {
        router.push(targetPath)
      } else {
        setSuccessModalText("Gagal menyimpan progress: " + res.error)
        setShowSuccessModal(true)
        setTimeout(() => setShowSuccessModal(false), 2000)
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* === BREADCRUMB NAVIGATION === */}
        <nav className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 select-none mb-10 mt-2 uppercase tracking-wider">
          <span 
            onClick={() => router.push('/admin/cabang/usulan-lokasi')} 
            className="cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition"
          >
            Usulan Lokasi
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span 
            onClick={() => router.push(`/admin/cabang/usulan-lokasi/form/badanhukum?id=${ulokId}`)} 
            className="cursor-pointer hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Form Badan Hukum
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-800 dark:text-gray-100 font-bold">Section 1: Legalitas</span>
        </nav>

        {/* === HEADER SECTION === */}
        <div className="bg-blue-950 dark:bg-[#1E293B] text-white p-6 rounded-xl flex justify-between items-center shadow-sm border border-transparent dark:border-gray-800">
          <div>
            <h1 className="text-lg font-bold">Section 1: Legalitas Instansi & Berkas Manajemen Badan Hukum</h1>
            <p className="text-xs text-blue-200/80 dark:text-gray-400 mt-0.5">Unggah berkas otentik pendirian instansi, perizinan berusaha, perpajakan, dan dokumen direksi.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20 dark:border-gray-700">1 / 2</span>
        </div>

        {/* === BUNDEL 1: BERKAS UTAMA WAJIB === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-law.svg" alt="Legalitas" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Dokumen Utama & Legalitas Dasar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderUploadSlot("ektp_mewakili", "E-KTP (Yang Mewakili / Menandatangani)", "Scan KTP asli perwakilan bertanda tangan")}
            {renderUploadSlot("akta_pendirian", "Akta Pendirian & SK Menteri", "Scan Akta Pendirian awal lengkap beserta SK Kemenkumham")}
            {renderUploadSlot("anggaran_dasar", "Anggaran Dasar Terbaru & SK Menteri", "Scan salinan AD perusahaan terakhir & SK Persetujuan")}
            {renderUploadSlot("nib_oss", "NIB OSS RBA", "Nomor Induk Berusaha berbasis risiko terbaru")}
            {renderUploadSlot("npwp_badan", "NPWP Badan Usaha", "Scan kartu NPWP atas nama perusahaan/instansi resmi")}
          </div>
        </div>

        {/* === BUNDEL 2: KONDISIONAL PERPAJAKAN & KUASA === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-file.svg" alt="Pajak" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Status Pajak & Pelimpahan Kuasa
          </h3>
          
          <div className="rounded-3xl p-4 bg-gray-50/35 dark:bg-gray-800/15 space-y-3">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Opsi Perpajakan Perusahaan:</label>
            <div className="grid grid-cols-2 gap-3">
              {['PKP', 'Non-PKP'].map((opt) => (
                <label key={opt} className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition font-bold text-xs ${statusPajak === opt ? 'border-blue-950 bg-blue-50/50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  <input type="radio" name="statusPajak" checked={statusPajak === opt} onChange={() => setStatusPajak(opt)} className="accent-blue-950 dark:accent-blue-500 w-4 h-4" />
                  {opt}
                </label>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
              {statusPajak === 'PKP' 
                ? renderUploadSlot("sppkp", "Surat Pengukuhan Pengusaha Kena Pajak (SPPKP)", "Format PDF scan resmi")
                : renderUploadSlot("surat_pernyataan_nonpkp", "Surat Pernyataan Non-PKP", "Surat pernyataan resmi bermeterai")
              }
            </div>
          </div>

          <div className="rounded-3xl p-4 bg-gray-50/35 dark:bg-gray-800/15 space-y-3">
            <label className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 cursor-pointer text-xs">
              <input type="checkbox" checked={isDikuasakan} onChange={(e) => setIsDikuasakan(e.target.checked)} className="rounded accent-blue-950 dark:accent-blue-500 w-4 h-4" />
              Apakah Proses Pengurusan Berkas Dikuasakan?
            </label>
            {isDikuasakan && (
              <div className="pt-2 pl-6 border-l-2 border-blue-950/30 dark:border-gray-700">
                {renderUploadSlot("akta_kuasa", "Akta Kuasa Notariil / Legalisasi (Jika Dikuasakan)", "Berkas Surat Kuasa resmi")}
              </div>
            )}
          </div>
        </div>

        {/* === BUNDEL 3: DOKUMEN SPESIFIK STRUKTUR ORGANISASI === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-family.svg" alt="Pengurus" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Dokumen Susunan Pengurus & Direksi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderUploadSlot("akta_penyesuaian", "Akta Penyesuaian dengan UU No. 40 Tahun 2007 & SK Menteri", "Scan dokumen penyesuaian PT")}
            {renderUploadSlot("akta_direksi_komisaris", "Akta Susunan Direksi & Komisaris Terakhir & SK Menteri", "Salinan perubahan direksi/komisaris terbaru")}
            {renderUploadSlot("akta_pengurus", "Akta Susunan Pengurus Terakhir & SK Menteri", "Wajib untuk Yayasan / Koperasi / Lembaga")}
            {renderUploadSlot("ektp_direksi", "E-KTP Direksi / Pengurus", "Scan lembar identitas jajaran pengurus")}
            {renderUploadSlot("rups_persetujuan", "Surat Persetujuan Dewan Komisaris / RUPS (PT)", "Format scan surat keputusan keputusan sewa")}
          </div>
        </div>

        {/* === PANEL TOMBOL NAVIGASI === */}
        <div className="flex justify-between items-center bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-300 dark:border-gray-800 shadow-sm">
          <button 
            type="button" 
            disabled={isPending} 
            onClick={() => handleNavigation(`/admin/cabang/usulan-lokasi/form/badanhukum?id=${ulokId}`)} 
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Back
          </button>
          <button 
            type="button" 
            disabled={isPending} 
            onClick={() => handleNavigation(`/admin/cabang/usulan-lokasi/form/badanhukum/section2?id=${ulokId}`)} 
            className="bg-blue-950 dark:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 dark:hover:bg-blue-500 transition disabled:opacity-50 shadow-sm"
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
