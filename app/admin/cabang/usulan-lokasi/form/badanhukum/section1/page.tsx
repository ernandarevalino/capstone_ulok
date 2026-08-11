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

  const renderUploadSlot = (docType: string, label: string, subLabel: string) => {
    if (docType === 'dokumen_tambahan') {
      const existingFiles = uploadedDocs.filter(doc => doc.document_type === docType)
      return (
        <div className="bg-gray-50 dark:bg-gray-800/25 p-3 rounded-2xl flex flex-col justify-between gap-2 transition hover:bg-gray-100 dark:hover:bg-gray-800/40">
          <div>
            <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] block">{label}</span>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{subLabel}</p>
          </div>
          {existingFiles.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {existingFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/20 p-1.5 rounded border border-emerald-200 dark:border-emerald-900/40">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-none">
                    📄 Tersimpan{formatWaktu(file.uploaded_at)}
                  </span>
                  <div className="flex gap-1.5 items-center">
                    <a 
                      href={file.file_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all"
                      title="View File"
                    >
                      <img src="/icons/icon-view.svg" alt="View" className="w-3.5 h-3.5 object-contain dark:invert" />
                    </a>
                    <button 
                      type="button" 
                      onClick={() => setDeleteTarget({ id: file.id, url: file.file_url })} 
                      className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 transition-all"
                      title="Delete File"
                    >
                      <img src="/icons/icon-remove.svg" alt="Delete" className="w-3.5 h-3.5 object-contain" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <input 
            type="file" 
            multiple
            accept=".pdf, .jpg, .jpeg, .png"
            disabled={isPending}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                if (e.target.files[0]) {
                  handleFileUpload(docType, e.target.files[0])
                }
              }
            }}
            className="text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-gray-200 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-300 dark:hover:file:bg-gray-600 file:cursor-pointer w-full text-gray-400 dark:text-gray-500 animate-fadeIn" 
          />
        </div>
      )
    }

    const allFiles = uploadedDocs.filter(doc => doc.document_type === docType)
    const latestFile = allFiles.find(doc => doc.is_latest) || allFiles[0]
    const historyFiles = latestFile ? allFiles.filter(doc => doc.id !== latestFile.id) : []

    return (
      <div className="bg-gray-50 dark:bg-gray-800/25 p-3 rounded-2xl flex flex-col justify-between gap-2.5 transition hover:bg-gray-100 dark:hover:bg-gray-800/40">
        <div>
          <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] block">{label}</span>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{subLabel}</p>
        </div>

        {latestFile ? (
          <div className="space-y-2 w-full">
            <div className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40 w-full">
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] text-emerald-800 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                  <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-1 py-0.2 rounded text-[8px] uppercase tracking-wide">
                    v{latestFile.version || 1}
                  </span>
                  Terbaru
                </span>
                <span className="text-[8px] text-gray-500 dark:text-gray-400 italic">
                  Tersimpan{formatWaktu(latestFile.uploaded_at)}
                </span>
              </div>
              <div className="flex gap-1.5 items-center shrink-0">
                <a 
                  href={latestFile.file_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all"
                  title="View File"
                >
                  <img src="/icons/icon-view.svg" alt="View" className="w-3.5 h-3.5 object-contain dark:invert" />
                </a>
                <button 
                  type="button" 
                  onClick={() => setDeleteTarget({ id: latestFile.id, url: latestFile.file_url })} 
                  className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 transition-all"
                  title="Delete File"
                >
                  <img src="/icons/icon-remove.svg" alt="Delete" className="w-3.5 h-3.5 object-contain" />
                </button>
              </div>
            </div>

            {historyFiles.length > 0 && (
              <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-2 w-full">
                <button
                  type="button"
                  onClick={() => toggleAccordion(docType)}
                  className="w-full flex items-center justify-between text-[9px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors py-0.5"
                >
                  <span className="flex items-center gap-1 text-[9px]">
                    📜 Riwayat File Lama ({historyFiles.length})
                  </span>
                  <span className={`transform transition-transform duration-200 ${openAccordions[docType] ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {openAccordions[docType] && (
                  <div className="mt-1.5 space-y-1 pl-0.5 max-h-36 overflow-y-auto w-full">
                    {historyFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between gap-2 bg-gray-100/50 dark:bg-gray-800/30 p-1.5 rounded-lg border border-gray-200/40 dark:border-gray-700/20 w-full">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[8px] font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-0.5">
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-450 px-1 py-0.2 rounded text-[7px]">
                              v{file.version || 1}
                            </span>
                            Versi Lama
                          </span>
                          <span className="text-[7px] text-gray-400 dark:text-gray-500 italic">
                            Unggah{formatWaktu(file.uploaded_at)}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center shrink-0">
                          <a 
                            href={file.file_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="p-0.5 rounded bg-white dark:bg-gray-755 border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 transition-all"
                            title="View File"
                          >
                            <img src="/icons/icon-view.svg" alt="View" className="w-3/3 object-contain dark:invert" />
                          </a>
                          <button 
                            type="button" 
                            onClick={() => setDeleteTarget({ id: file.id, url: file.file_url })} 
                            className="p-0.5 rounded bg-white dark:bg-gray-755 border border-gray-200 dark:border-gray-700 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/10 hover:border-red-300 transition-all"
                            title="Delete"
                          >
                            <img src="/icons/icon-remove.svg" alt="Delete" className="w-3 h-3 object-contain" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-2 w-full">
              <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 block mb-1">Unggah Versi Baru:</span>
              <input 
                type="file" 
                accept=".pdf, .jpg, .jpeg, .png"
                disabled={isPending}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) handleFileUpload(docType, e.target.files[0])
                }}
                className="text-[9px] file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[8px] file:font-bold file:bg-blue-50 dark:file:bg-blue-950/20 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30 file:cursor-pointer w-full text-gray-450 dark:text-gray-500" 
              />
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
