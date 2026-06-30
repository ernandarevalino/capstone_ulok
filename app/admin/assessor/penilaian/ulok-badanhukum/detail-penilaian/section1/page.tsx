'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, getUploadedDocuments } from '@/actions/cabang'
import { Check, Loader2, Download } from 'lucide-react'
import { toggleDocumentVerification } from '@/actions/assessor'
import { calculateULOKSAW } from '@/actions/saw'

export default function Section1BadanHukumAssessorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id')
  
  const [isLoading, setIsLoading] = useState(true)
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null)
  const [statusPajak, setStatusPajak] = useState('Non-PKP')
  const [isDikuasakan, setIsDikuasakan] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalText, setSuccessModalText] = useState('')

  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null)

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

  const handleDownload = async (fileUrl: string, docId: string, docType: string) => {
    if (!fileUrl) return
    setDownloadingDocId(docId)
    try {
      const response = await fetch(fileUrl)
      if (!response.ok) throw new Error('Failed to fetch file')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      let filename = `${docType}.pdf`
      try {
        const urlObj = new URL(fileUrl)
        const pathname = urlObj.pathname
        const lastPart = pathname.substring(pathname.lastIndexOf('/') + 1)
        if (lastPart) {
          filename = decodeURIComponent(lastPart)
        }
      } catch (e) {
        // fallback
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Gagal mengunduh berkas. Silakan coba lagi.')
    } finally {
      setDownloadingDocId(null)
    }
  }

  const handleToggleVerify = async (docId: string, currentStatus: boolean) => {
    setVerifyingDocId(docId)
    
    setUploadedDocs(prev => prev.map(doc => {
      if (doc.id === docId) {
        return { ...doc, is_verified: !currentStatus }
      }
      return doc
    }))
    
    const res = await toggleDocumentVerification(docId, currentStatus)
    
    if (!res.success) {
      setUploadedDocs(prev => prev.map(doc => {
        if (doc.id === docId) {
          return { ...doc, is_verified: currentStatus }
        }
        return doc
      }))
      
      setSuccessModalText(`Gagal memperbarui: ${res.error}`)
      setShowSuccessModal(true)
      setTimeout(() => {
        setShowSuccessModal(false)
      }, 1500)
    } else {
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

  useEffect(() => {
    if (!ulokId) {
      router.push('/admin/assessor/penilaian')
      return
    }

    const initLoad = async () => {
      setIsLoading(true)
      
      const resDocs = await getUploadedDocuments(ulokId)
      let currentDocs: any[] = []
      if (resDocs.success && resDocs.data) {
        setUploadedDocs(resDocs.data)
        currentDocs = resDocs.data
      }

      const detailRes = await getUlokDetail(ulokId)
      if (detailRes.success && detailRes.data) {
        if (detailRes.data.is_dikuasakan !== undefined) {
          setIsDikuasakan(detailRes.data.is_dikuasakan)
        }
        
        const hasSppkp = currentDocs.some(d => d.document_type === 'sppkp')
        if (hasSppkp) {
          setStatusPajak('PKP')
        } else {
          setStatusPajak('Non-PKP')
        }
      }
      setIsLoading(false)
    }

    initLoad()
  }, [ulokId])

  const handleReplyGroup = (groupName: string) => {
    router.push(`/admin/assessor/penilaian/ulok-badanhukum?id=${ulokId}&prefill=${encodeURIComponent(`⚠️ [Catatan Assessor - Grup: ${groupName}]: `)}`)
  }

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
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-none">📄 Tersimpan{formatWaktu(existingDoc.uploaded_at)}</span>
            <div className="flex gap-1.5 items-center">
              
              <a 
                href={existingDoc.file_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center"
                title="View File"
              >
                <img src="/icons/icon-view.svg" alt="View" className="w-3.5 h-3.5 object-contain dark:invert" />
              </a>

              <button
                type="button"
                disabled={downloadingDocId === existingDoc.id}
                onClick={() => handleDownload(existingDoc.file_url, existingDoc.id, existingDoc.document_type)}
                className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center disabled:opacity-50"
                title="Download File"
              >
                {downloadingDocId === existingDoc.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                disabled={verifyingDocId === existingDoc.id}
                onClick={() => handleToggleVerify(existingDoc.id, !!existingDoc.is_verified)}
                title="Verify Document"
                className={`p-1 rounded border shadow-sm transition-all flex items-center justify-center ${
                  existingDoc.is_verified
                    ? 'bg-emerald-100 text-green-600 border-green-300 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60'
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
        
        {/* === BREADCRUMB === */}
        <nav className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 select-none mb-10 mt-2 uppercase tracking-wider">
          <span 
            onClick={() => router.push('/admin/assessor/penilaian')} 
            className="cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition"
          >
            Penilaian Usulan
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span 
            onClick={() => router.push(`/admin/assessor/penilaian/ulok-badanhukum?id=${ulokId}`)} 
            className="cursor-pointer hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Detail Usulan Badan Hukum
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-800 dark:text-gray-100 font-bold">Section 1: Legalitas</span>
        </nav>

        {/* === HEADER === */}
        <div className="bg-blue-950 dark:bg-[#1E293B] text-white p-6 rounded-xl flex justify-between items-center shadow-sm border border-transparent dark:border-gray-800">
          <div>
            <h1 className="text-lg font-bold">Penilaian Section 1: Legalitas Instansi & Berkas Manajemen Badan Hukum</h1>
            <p className="text-xs text-blue-200/80 dark:text-gray-400 mt-0.5">Peninjauan berkas otentik pendirian instansi, perizinan berusaha, perpajakan, dan dokumen direksi.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20 dark:border-gray-700">1 / 2</span>
        </div>

        {/* === FORM: DOKUMEN UTAMA & LEGALITAS === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <img src="/icons/icon-law.svg" alt="Legalitas" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
              Dokumen Utama & Legalitas Dasar
            </h3>
            
            <button
              type="button"
              onClick={() => handleReplyGroup("Dokumen Utama & Legalitas Dasar")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <img src="/icons/icon-message-now.svg" alt="Reply" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              Reply / Beri Catatan
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderUploadSlot("ektp_mewakili", "E-KTP (Yang Mewakili / Menandatangani)", "Scan KTP asli perwakilan bertanda tangan")}
            {renderUploadSlot("akta_pendirian", "Akta Pendirian & SK Menteri", "Scan Akta Pendirian awal lengkap beserta SK Kemenkumham")}
            {renderUploadSlot("anggaran_dasar", "Anggaran Dasar Terbaru & SK Menteri", "Scan salinan AD perusahaan terakhir & SK Persetujuan")}
            {renderUploadSlot("nib_oss", "NIB OSS RBA", "Nomor Induk Berusaha berbasis risiko terbaru")}
            {renderUploadSlot("npwp_badan", "NPWP Badan Usaha", "Scan kartu NPWP atas nama perusahaan/instansi resmi")}
          </div>
        </div>

        {/* === FORM: STATUS PAJAK & KUASA === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <img src="/icons/icon-file.svg" alt="Pajak" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
              Status Pajak & Pelimpahan Kuasa
            </h3>
            
            <button
              type="button"
              onClick={() => handleReplyGroup("Status Pajak & Pelimpahan Kuasa")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <img src="/icons/icon-message-now.svg" alt="Reply" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              Reply / Beri Catatan
            </button>
          </div>
          
          <div className="rounded-3xl p-4 bg-gray-50/35 dark:bg-gray-800/15 space-y-3">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Opsi Perpajakan Perusahaan:</label>
            <div className="grid grid-cols-2 gap-3">
              {['PKP', 'Non-PKP'].map((opt) => (
                <label key={opt} className={`p-3 border rounded-xl flex items-center gap-2 cursor-not-allowed transition font-bold text-xs ${statusPajak === opt ? 'border-blue-950 bg-blue-50/50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'}`}>
                  <input type="radio" disabled name="statusPajak" checked={statusPajak === opt} onChange={() => {}} className="accent-blue-950 dark:accent-blue-500 w-4 h-4 cursor-not-allowed" />
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
            <label className="flex items-center gap-2 font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed text-xs">
              <input type="checkbox" disabled checked={isDikuasakan} onChange={() => {}} className="rounded accent-blue-950 dark:accent-blue-500 w-4 h-4 cursor-not-allowed" />
              Apakah Proses Pengurusan Berkas Dikuasakan?
            </label>
            <div className="pt-2 pl-6 border-l-2 border-blue-950/30 dark:border-gray-700">
              {renderUploadSlot("akta_kuasa", "Akta Kuasa Notariil / Legalisasi (Jika Dikuasakan)", "Berkas Surat Kuasa resmi")}
            </div>
          </div>
        </div>

        {/* === FORM: SUSUNAN PENGURUS & DIREKSI === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <img src="/icons/icon-family.svg" alt="Pengurus" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
              Dokumen Susunan Pengurus & Direksi
            </h3>
            
            <button
              type="button"
              onClick={() => handleReplyGroup("Dokumen Susunan Pengurus & Direksi")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <img src="/icons/icon-message-now.svg" alt="Reply" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              Reply / Beri Catatan
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderUploadSlot("akta_penyesuaian", "Akta Penyesuaian dengan UU No. 40 Tahun 2007 & SK Menteri", "Scan dokumen penyesuaian khusus PT")}
            {renderUploadSlot("akta_direksi_komisaris", "Akta Susunan Direksi & Komisaris Terakhir & SK Menteri", "Salinan perubahan direksi/komisaris terbaru")}
            {renderUploadSlot("akta_pengurus", "Akta Susunan Pengurus Terakhir & SK Menteri", "Wajib untuk Yayasan / Koperasi / Lembaga")}
            {renderUploadSlot("ektp_direksi", "E-KTP Direksi / Pengurus", "Scan lembar identitas jajaran pengurus usaha")}
            {renderUploadSlot("rups_persetujuan", "Surat Persetujuan Dewan Komisaris / RUPS (PT)", "Format scan surat keputusan keputusan sewa")}
          </div>
        </div>

        {/* === NAVIGASI === */}
        <div className="flex justify-between items-center bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <button 
            type="button" 
            onClick={() => router.push(`/admin/assessor/penilaian/ulok-badanhukum?id=${ulokId}`)} 
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Back
          </button>
          <button 
            type="button" 
            onClick={() => router.push(`/admin/assessor/penilaian/ulok-badanhukum/detail-penilaian/section2?id=${ulokId}`)} 
            className="bg-blue-950 dark:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 dark:hover:bg-blue-500 transition shadow-sm"
          >
            Next
          </button>
        </div>

      </div>

      {/* === MODAL: SUKSES === */}
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