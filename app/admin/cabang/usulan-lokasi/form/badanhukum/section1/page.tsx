'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getUploadedDocuments, uploadUlokFile } from '@/actions/cabang'
import { softDeleteDocument } from '@/actions/recyclebin'
import UploadSlot from '@/components/shared/UploadSlot'
import SuccessModal from '@/components/shared/SuccessModal'
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal'

export default function Section1BadanHukumPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id') || ''
  const fromSource = searchParams.get('from')
  const backPath = fromSource === 'feedback' ? '/admin/cabang/feedback' : '/admin/cabang/usulan-lokasi'
  const originLabel = fromSource === 'feedback' ? 'Feedback' : 'Usulan Lokasi'
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
      router.push(backPath)
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
      const res = await softDeleteDocument(deleteTarget.id)
      if (res.success) {
        setDeleteTarget(null)
        setSuccessModalText('Berkas berhasil dipindahkan ke tempat sampah!')
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 1500)

        const resDocs = await getUploadedDocuments(ulokId)
        if (resDocs.success && resDocs.data) setUploadedDocs(resDocs.data)
      } else {
        setSuccessModalText("Gagal memindahkan berkas ke tempat sampah: " + res.error)
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 2000)
        setDeleteTarget(null)
      }
    })
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
            onClick={() => router.push(backPath)} 
            className="cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition"
          >
            {originLabel}
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span 
            onClick={() => router.push(`/admin/cabang/usulan-lokasi/form/badanhukum?id=${ulokId}${fromSource ? `&from=${fromSource}` : ''}`)} 
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
            <UploadSlot docType="ektp_mewakili" label="E-KTP (Yang Mewakili / Menandatangani)" subLabel="Scan KTP asli perwakilan bertanda tangan" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="akta_pendirian" label="Akta Pendirian & SK Menteri" subLabel="Scan Akta Pendirian awal lengkap beserta SK Kemenkumham" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="anggaran_dasar" label="Anggaran Dasar Terbaru & SK Menteri" subLabel="Scan salinan AD perusahaan terakhir & SK Persetujuan" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="nib_oss" label="NIB OSS RBA" subLabel="Nomor Induk Berusaha berbasis risiko terbaru" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="npwp_badan" label="NPWP Badan Usaha" subLabel="Scan kartu NPWP atas nama perusahaan/instansi resmi" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
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
                ? <UploadSlot docType="sppkp" label="Surat Pengukuhan Pengusaha Kena Pajak (SPPKP)" subLabel="Format PDF scan resmi" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
                : <UploadSlot docType="surat_pernyataan_nonpkp" label="Surat Pernyataan Non-PKP" subLabel="Surat pernyataan resmi bermeterai" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
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
                <UploadSlot docType="akta_kuasa" label="Akta Kuasa Notariil / Legalisasi (Jika Dikuasakan)" subLabel="Berkas Surat Kuasa resmi" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
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
            <UploadSlot docType="akta_penyesuaian" label="Akta Penyesuaian dengan UU No. 40 Tahun 2007 & SK Menteri" subLabel="Scan dokumen penyesuaian PT" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="akta_direksi_komisaris" label="Akta Susunan Direksi & Komisaris Terakhir & SK Menteri" subLabel="Salinan perubahan direksi/komisaris terbaru" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="akta_pengurus" label="Akta Susunan Pengurus Terakhir & SK Menteri" subLabel="Wajib untuk Yayasan / Koperasi / Lembaga" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="ektp_direksi" label="E-KTP Direksi / Pengurus" subLabel="Scan lembar identitas jajaran pengurus" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="rups_persetujuan" label="Surat Persetujuan Dewan Komisaris / RUPS (PT)" subLabel="Format scan surat keputusan keputusan sewa" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
          </div>
        </div>

        {/* === PANEL TOMBOL NAVIGASI === */}
        <div className="flex justify-between items-center bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-300 dark:border-gray-800 shadow-sm">
          <button 
            type="button" 
            disabled={isPending} 
            onClick={() => handleNavigation(`/admin/cabang/usulan-lokasi/form/badanhukum?id=${ulokId}${fromSource ? `&from=${fromSource}` : ''}`)} 
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Back
          </button>
          <button 
            type="button" 
            disabled={isPending} 
            onClick={() => handleNavigation(`/admin/cabang/usulan-lokasi/form/badanhukum/section2?id=${ulokId}${fromSource ? `&from=${fromSource}` : ''}`)} 
            className="bg-blue-950 dark:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 dark:hover:bg-blue-500 transition disabled:opacity-50 shadow-sm"
          >
            {isPending ? 'Saving...' : 'Next'}
          </button>
        </div>

      </div>

      {/* === MODAL: SUKSES === */}
      <SuccessModal isOpen={showSuccessModal} message={successModalText} />

      {/* === MODAL: KONFIRMASI HAPUS === */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
        isPending={isPending}
      />

    </div>
  )
}
