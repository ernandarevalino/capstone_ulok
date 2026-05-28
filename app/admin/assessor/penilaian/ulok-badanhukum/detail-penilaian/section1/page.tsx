'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, getUploadedDocuments } from '@/actions/cabang'

export default function Section1BadanHukumAssessorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id')
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
      router.push('/admin/assessor/penilaian')
      return
    }

    const initLoad = async () => {
      setIsLoading(true)
      await fetchDocs()
      const detailRes = await getUlokDetail(ulokId)
      if (detailRes.success && detailRes.data) {
        // Isian conditional dari DB
        if (detailRes.data.is_dikuasakan !== undefined) {
          setIsDikuasakan(detailRes.data.is_dikuasakan)
        }
        // Jika ada statusPajak atau sejenisnya di data, set state.
        // Di code asal, statusPajak hanya state lokal yang berubah jika user pilih PKP/Non-PKP,
        // namun bisa juga dideteksi dari berkas sppkp/non-pkp yang ada.
        const files = detailRes.data
        const hasSppkp = uploadedDocs.some(d => d.document_type === 'sppkp')
        if (hasSppkp) {
          setStatusPajak('PKP')
        }
      }
      setIsLoading(false)
    }

    initLoad()
  }, [ulokId])

  const handleReplyGroup = (groupName: string) => {
    router.push(`/admin/assessor/penilaian/ulok-badanhukum?id=${ulokId}&prefill=${encodeURIComponent(`⚠️ [Catatan Assessor - Grup: ${groupName}]: `)}`)
  }

  // Komponen Helper Render Upload Slot (View Only untuk Assessor)
  const renderUploadSlot = (docType: string, label: string, hint: string) => {
    const existingDoc = uploadedDocs.find(d => d.document_type === docType)

    return (
      <div className="border p-4 rounded-xl bg-white space-y-2 shadow-sm border-gray-200">
        <label className="block text-xs font-bold text-gray-700 leading-snug">{label}</label>
        {existingDoc ? (
          <div className="flex items-center justify-between gap-2 bg-green-50 p-2.5 rounded-lg border border-green-200">
            <span className="text-xs font-bold text-green-700 truncate max-w-45">📄 Berkas Berhasil Diunggah</span>
            <div className="flex gap-2">
              <a href={existingDoc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-950 text-white px-3 py-1.5 rounded-md font-bold hover:bg-blue-900 transition flex items-center gap-1 shadow-sm">
                👁️ Lihat
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-1 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
            <p className="text-[11px] text-gray-400 font-bold">⚠️ Belum ada dokumen terunggah</p>
            <p className="text-[10px] text-gray-400 font-medium">{hint}</p>
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
        
        {/* HEADER */}
        <div className="bg-blue-950 text-white p-6 rounded-xl flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-lg font-bold">Penilaian Section 1: Legalitas Instansi & Berkas Manajemen Badan Hukum</h1>
            <p className="text-xs text-blue-200/80 mt-0.5">Peninjauan berkas otentik pendirian instansi, perizinan berusaha, perpajakan, dan dokumen direksi.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">Langkah 1 dari 2 (Assessor)</span>
        </div>

        {/* BUNDEL 1: BERKAS UTAMA WAJIB */}
        <div className="bg-white border rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">🏢 Dokumen Utama & Legalitas Dasar</h2>
            <button
              type="button"
              onClick={() => handleReplyGroup("Dokumen Utama & Legalitas Dasar")}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
            >
              💬 Reply / Beri Catatan
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

        {/* BUNDEL 2: KONDISIONAL PERPAJAKAN & KUASA */}
        <div className="bg-white border rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">⚖️ Status Pajak & Pelimpahan Kuasa</h2>
            <button
              type="button"
              onClick={() => handleReplyGroup("Status Pajak & Pelimpahan Kuasa")}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
            >
              💬 Reply / Beri Catatan
            </button>
          </div>
          
          {/* Pajak Radio Group */}
          <div className="space-y-2 bg-gray-50/60 p-4 rounded-xl border">
            <label className="block text-xs font-bold text-gray-600">Opsi Perpajakan Perusahaan:</label>
            <div className="flex gap-4">
              {['PKP', 'Non-PKP'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-not-allowed text-xs font-bold text-gray-500">
                  <input type="radio" disabled name="statusPajak" checked={statusPajak === opt} onChange={() => {}} className="w-4 h-4 accent-blue-950 cursor-not-allowed" />
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
            <label className="flex items-center gap-2 font-bold text-gray-500 cursor-not-allowed text-xs">
              <input type="checkbox" disabled checked={isDikuasakan} onChange={() => {}} className="rounded accent-blue-950 w-4 h-4 cursor-not-allowed" />
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
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">📋 Dokumen Susunan Pengurus & Direksi</h2>
            <button
              type="button"
              onClick={() => handleReplyGroup("Dokumen Susunan Pengurus & Direksi")}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
            >
              💬 Reply / Beri Catatan
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

        {/* FOOTER NAVIGATION */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <button type="button" onClick={() => router.push(`/admin/assessor/penilaian/ulok-badanhukum?id=${ulokId}`)} className="text-xs font-bold text-gray-500 hover:text-blue-950 transition">
            ← Kembali ke Chat Penilaian
          </button>
          <button type="button" onClick={() => router.push(`/admin/assessor/penilaian/ulok-badanhukum/detail-penilaian/section2?id=${ulokId}`)} className="bg-blue-950 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 transition shadow-sm">
            Lanjut Ke Section 2 →
          </button>
        </div>

      </div>
    </div>
  )
}
