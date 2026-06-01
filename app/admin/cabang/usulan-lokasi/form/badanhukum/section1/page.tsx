'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getUploadedDocuments, uploadUlokFile, deleteUlokFile } from '@/actions/cabang'

export default function Section1BadanHukumPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  // State untuk Kondisional Berkas (Pajak & Kuasa)
  const [statusPajak, setStatusPajak] = useState('Non-PKP')
  const [isDikuasakan, setIsDikuasakan] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])

  // Fungsi memuat ulang daftar dokumen yang sudah diunggah
  const fetchDocs = async () => {
    if (!ulokId) return
    const res = await getUploadedDocuments(ulokId)
    if (res.success && res.data) {
      setUploadedDocs(res.data)
    }
  }

  useEffect(() => {
    if (!ulokId) {
      router.push('/admin/cabang/usulan-lokasi')
      return
    }

    const initLoad = async () => {
      setIsLoading(true)
      await fetchDocs()
      const detailRes = await getUlokDetail(ulokId)
      if (detailRes.success && detailRes.data) {
        // Otomatisasi deteksi checkbox/radio berdasarkan berkas terunggah sebelumnya
        const files = detailRes.data
        // Contoh penyesuaian awal state jika data sudah ada
      }
      setIsLoading(false)
    }

    initLoad()
  }, [ulokId])

  const handleSaveAndBack = async () => {
    if (!ulokId) {
      router.push('/admin/cabang/usulan-lokasi')
      return
    }
    startTransition(async () => {
      const res = await updateUlokSubmission(ulokId, {})
      router.push('/admin/cabang/usulan-lokasi')
    })
  }

  const handleSaveAndNext = async () => {
    if (!ulokId) return
    startTransition(async () => {
      const res = await updateUlokSubmission(ulokId, {})
      if (res.success) {
        router.push(`/admin/cabang/usulan-lokasi/form/badanhukum/section2?id=${ulokId}`)
      } else {
        alert('Gagal menyimpan progress Section 1: ' + res.error)
      }
    })
  }

  // Komponen Helper Render Upload Slot terintegrasi ke Server Actions
  const renderUploadSlot = (docType: string, label: string, hint: string) => {
    const existingDoc = uploadedDocs.find(d => d.document_type === docType)
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0 || !ulokId) return
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append('file', file)
      
      setIsLoading(true)
      const res = await uploadUlokFile(ulokId, docType, formData)
      setIsLoading(false)
      if (res.success) {
        fetchDocs()
      } else {
        alert('Gagal mengunggah berkas: ' + res.error)
      }
    }

    const handleFileDelete = async () => {
      if (!existingDoc) return
      if (!confirm(`Apakah Anda yakin ingin menghapus dokumen "${label}"?`)) return
      setIsLoading(true)
      const res = await deleteUlokFile(existingDoc.id, existingDoc.file_url)
      setIsLoading(false)
      if (res.success) {
        fetchDocs()
      } else {
        alert('Gagal menghapus berkas: ' + res.error)
      }
    }

    return (
      <div className="border p-4 rounded-xl bg-white space-y-2 shadow-sm border-gray-200">
        <label className="block text-xs font-bold text-gray-700 leading-snug">{label}</label>
        {existingDoc ? (
          <div className="flex items-center justify-between gap-2 bg-green-50 p-2.5 rounded-lg border border-green-200">
            <span className="text-xs font-bold text-green-700 truncate max-w-45">📄 Berkas Berhasil Diunggah</span>
            <div className="flex gap-2">
              <a href={existingDoc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-950 text-white px-3 py-1 rounded-md font-bold hover:bg-blue-900 transition">
                Lihat
              </a>
              <button type="button" onClick={handleFileDelete} className="text-xs bg-red-600 text-white px-3 py-1 rounded-md font-bold hover:bg-red-700 transition">
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
            <p className="text-[11px] text-gray-400 font-medium">{hint}</p>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xs font-bold text-gray-500 animate-pulse">Memuat Form Dokumen Legalitas Badan Hukum...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* BREADCRUMB NAVIGATION */}
        <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-6 select-none">
          <span 
            onClick={() => router.push('/admin/cabang/usulan-lokasi')} 
            className="cursor-pointer hover:text-blue-950 transition"
          >
            Usulan Lokasi
          </span>
          <span className="text-gray-300">/</span>
          <span 
            onClick={() => router.push(`/admin/cabang/usulan-lokasi/form/badanhukum?id=${ulokId}`)} 
            className="cursor-pointer hover:text-blue-950 transition"
          >
            Form Badan Hukum
          </span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-bold">Section 1: Legalitas</span>
        </nav>

        {/* HEADER */}
        <div className="bg-blue-950 text-white p-6 rounded-xl flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-lg font-bold">Section 1: Legalitas Instansi & Berkas Manajemen Badan Hukum</h1>
            <p className="text-xs text-blue-200/80 mt-0.5">Unggah berkas otentik pendirian instansi, perizinan berusaha, perpajakan, dan dokumen direksi.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">1 / 2</span>
        </div>

        {/* BUNDEL 1: BERKAS UTAMA WAJIB */}
        <div className="bg-white border rounded-xl p-5 space-y-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2">🏢 Dokumen Utama & Legalitas Dasar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderUploadSlot("ektp_mewakili", "E-KTP (Yang Mewakili / Menandatangani)", "Scan KTP asli perwakilan bertanda tangan")}
            {renderUploadSlot("akta_pendirian", "Akta Pendirian & SK Menteri", "Scan Akta Pendirian awal lengkap beserta SK Kemenkumham")}
            {renderUploadSlot("anggaran_dasar", "Anggaran Dasar Terbaru & SK Menteri", "Scan salinan AD perusahaan terakhir & SK Persetujuan")}
            {renderUploadSlot("nib_oss", "NIB OSS RBA", "Nomor Induk Berusaha berbasis risiko terbaru")}
            {renderUploadSlot("npwp_badan", "NPWP Badan Usaha", "Scan kartu NPWP atas nama perusahaan/instansi resmi")}
          </div>
        </div>

        {/* BUNDEL 2: KONDISIONAL PERPAJAKAN & KUASA */}
        <div className="bg-white border rounded-xl p-5 space-y-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2">⚖️ Status Pajak & Pelimpahan Kuasa</h2>
          
          {/* Pajak Radio Group */}
          <div className="space-y-2 bg-gray-50/60 p-4 rounded-xl border">
            <label className="block text-xs font-bold text-gray-600">Opsi Perpajakan Perusahaan:</label>
            <div className="flex gap-4">
              {['PKP', 'Non-PKP'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                  <input type="radio" name="statusPajak" checked={statusPajak === opt} onChange={() => setStatusPajak(opt)} className="w-4 h-4 accent-blue-950" />
                  {opt}
                </label>
              ))}
            </div>
            <div className="pt-3 border-t mt-2">
              {statusPajak === 'PKP' 
                ? renderUploadSlot("sppkp", "Surat Pengukuhan Pengusaha Kena Pajak (SPPKP)", "Format PDF scan resmi")
                : renderUploadSlot("surat_pernyataan_nonpkp", "Surat Pernyataan Non-PKP", "Surat pernyataan resmi bermeterai")
              }
            </div>
          </div>

          {/* Kuasa Checkbox */}
          <div className="border rounded-xl p-4 bg-gray-50/40 space-y-3">
            <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer text-xs">
              <input type="checkbox" checked={isDikuasakan} onChange={(e) => setIsDikuasakan(e.target.checked)} className="rounded accent-blue-950 w-4 h-4" />
              Apakah Proses Pengurusan Berkas Dikuasakan?
            </label>
            {isDikuasakan && (
              <div className="pt-1 pl-6 border-l-2 border-blue-950/30">
                {renderUploadSlot("akta_kuasa", "Akta Kuasa Notariil / Legalisasi (Jika Dikuasakan)", "Berkas Surat Kuasa resmi")}
              </div>
            )}
          </div>
        </div>

        {/* BUNDEL 3: DOKUMEN SPESIFIK STRUKTUR ORGANISASI */}
        <div className="bg-white border rounded-xl p-5 space-y-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2">📋 Dokumen Susunan Pengurus & Direksi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderUploadSlot("akta_penyesuaian", "Akta Penyesuaian dengan UU No. 40 Tahun 2007 & SK Menteri", "Scan dokumen penyesuaian khusus PT")}
            {renderUploadSlot("akta_direksi_komisaris", "Akta Susunan Direksi & Komisaris Terakhir & SK Menteri", "Salinan perubahan direksi/komisaris terbaru")}
            {renderUploadSlot("akta_pengurus", "Akta Susunan Pengurus Terakhir & SK Menteri", "Wajib untuk Yayasan / Koperasi / Lembaga")}
            {renderUploadSlot("ektp_direksi", "E-KTP Direksi / Pengurus", "Scan lembar identitas jajaran pengurus usaha")}
            {renderUploadSlot("rups_persetujuan", "Surat Persetujuan Dewan Komisaris / RUPS (PT)", "Format scan surat keputusan keputusan sewa")}
          </div>
        </div>

        {/* PANEL TOMBOL NAVIGASI */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <button type="button" disabled={isPending} onClick={handleSaveAndBack} className="text-xs font-bold text-gray-500 hover:text-blue-950 transition">
            Back
          </button>
          <button type="button" disabled={isPending} onClick={handleSaveAndNext} className="bg-blue-950 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 transition shadow-sm">
            {isPending ? 'Saving...' : 'Next'}
          </button>
        </div>

      </div>
    </div>
  )
}