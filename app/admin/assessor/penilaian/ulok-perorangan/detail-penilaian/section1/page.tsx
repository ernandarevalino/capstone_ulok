'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, getUploadedDocuments } from '@/actions/cabang'

export default function Section1PeroranganAssessorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id') || ''
  const [isLoading, setIsLoading] = useState(true)

  // State Form Teks
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

  // Komponen Reusable Slot Upload Berkas (View Only)
  const renderUploadSlot = (docType: string, label: string, subLabel: string) => {
    const existingFile = uploadedDocs.find(doc => doc.document_type === docType)
    return (
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between gap-2 transition hover:border-blue-950/20">
        <div>
          <span className="font-bold text-gray-700 text-[11px] block">{label}</span>
          <p className="text-[10px] text-gray-400">{subLabel}</p>
        </div>
        {existingFile ? (
          <div className="flex items-center justify-between gap-1 bg-emerald-50 p-1.5 rounded border border-emerald-200">
            <span className="text-[10px] text-emerald-700 font-bold truncate max-w-30">📄 Tersimpan</span>
            <div className="flex gap-1">
              <a href={existingFile.file_url} target="_blank" rel="noreferrer" className="bg-blue-950 text-white px-2 py-0.5 rounded text-[9px] font-bold transition hover:bg-blue-900">
                👁️ View
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 p-1.5 rounded border border-dashed text-center">
            <span className="text-[10px] text-gray-400 font-bold">Belum Ada Dokumen</span>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-500 font-medium animate-pulse">Memuat Formulir Section 1...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-xl border shadow-sm overflow-hidden">
        
        {/* HEADER SECTION */}
        <div className="bg-blue-950 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">Penilaian Section 1: Identitas Pemilik & Status Kepemilikan (Assessor)</h1>
            <p className="text-xs text-blue-200/80 mt-0.5">Peninjauan isian identitas, kartu keluarga, surat keterangan perorangan.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">Langkah 1 dari 2 (Assessor)</span>
        </div>

        <div className="p-6 space-y-6 text-sm">
          
          {/* GRUP 1: IDENTITAS & PAJAK DASAR */}
          <div className="space-y-4 border-b pb-5">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">🪪 Dokumen Identitas & Pajak Dasar</h3>
              <button
                type="button"
                onClick={() => handleReplyGroup("Dokumen Identitas & Pajak Dasar")}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
              >
                💬 Reply / Beri Catatan
              </button>
            </div>
            
            {/* Checkbox E-KTP */}
            <div className="border rounded-xl p-4 bg-gray-50/30 space-y-3">
              <label className="flex items-center gap-2 font-bold text-gray-500 cursor-not-allowed text-xs">
                <input type="checkbox" disabled checked={hasEktp} className="rounded accent-blue-950 w-4 h-4 cursor-not-allowed" />
                Dokumen E-KTP Pemilik
              </label>
              {hasEktp && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 pl-6 border-l-2 border-blue-950/30">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">Nama Lengkap Sesuai KTP</label>
                    <input type="text" readOnly value={namaPemegang} className="w-full border p-2 bg-gray-100 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">NIK Pemilik (16 Digit)</label>
                    <input type="text" readOnly value={nik} className="w-full border p-2 bg-gray-100 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 font-medium" />
                  </div>
                  {renderUploadSlot("ktp_pemilik", "File Scan E-KTP", "Format PDF/JPG, Maksimal 2MB")}
                </div>
              )}
            </div>

            {/* Checkbox KITAS/KITAP */}
            <div className="border rounded-xl p-4 bg-gray-50/30 space-y-3">
              <label className="flex items-center gap-2 font-bold text-gray-500 cursor-not-allowed text-xs">
                <input type="checkbox" disabled checked={hasKitas} className="rounded accent-blue-950 w-4 h-4 cursor-not-allowed" />
                KITAS / KITAP (Khusus WNA)
              </label>
              {hasKitas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 pl-6 border-l-2 border-blue-950/30">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">Nama Sesuai Paspor / KITAS</label>
                    <input type="text" readOnly value={namaKitas} className="w-full border p-2 bg-gray-100 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 font-medium" />
                  </div>
                  {renderUploadSlot("kitas_kitap", "File Scan KITAS / KITAP", "Format PDF, Maksimal 2MB")}
                </div>
              )}
            </div>

            {/* Dokumen Pajak */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {renderUploadSlot("npwp", "Scan NPWP Asli", "Format PDF/PNG")}
              {renderUploadSlot("pkp_sppkp", "Scan PKP / SPPKP", "Format PDF")}
              {renderUploadSlot("non_pkp", "Scan Non PKP / Surat Pernyataan", "Format PDF")}
            </div>
          </div>

          {/* GRUP 2: KARTU KELUARGA & PERNIKAHAN */}
          <div className="space-y-4 border-b pb-5">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">👨‍👩‍👧‍👦 Kartu Keluarga & Status Pernikahan</h3>
              <button
                type="button"
                onClick={() => handleReplyGroup("Kartu Keluarga & Status Pernikahan")}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
              >
                💬 Reply / Beri Catatan
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400">No. Kartu Keluarga (KK)</label>
                <input type="text" readOnly value={noKK} className="w-full border p-2 bg-gray-100 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500" />
              </div>
              {renderUploadSlot("kartu_keluarga", "File Scan Kartu Keluarga", "Format PDF")}
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400">No. Buku Nikah / Akta Perkawinan</label>
                <input type="text" readOnly value={noBukuNikah} className="w-full border p-2 bg-gray-100 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500" />
              </div>
              {renderUploadSlot("buku_nikah", "File Scan Buku Nikah", "Format PDF")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {renderUploadSlot("persetujuan_pasangan", "Surat Persetujuan Suami / Istri", "Wajib di-ttd pasangan")}
              {renderUploadSlot("akta_cerai", "Akta Cerai (Apabila Cerai)", "Format PDF resmi")}
            </div>
          </div>

          {/* GRUP 3: SURAT PENETAPAN GANTI NAMA */}
          <div className="space-y-4 border-b pb-5 bg-gray-50/50 p-4 rounded-xl border">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-xs uppercase text-gray-500">🔄 Surat Penetapan Ganti Nama (Jika Ada)</h3>
              <button
                type="button"
                onClick={() => handleReplyGroup("Surat Penetapan Ganti Nama")}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
              >
                💬 Reply / Beri Catatan
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">Nama Sebelum Ganti</label>
                <input type="text" readOnly value={namaSebelumGanti} className="w-full border p-2 bg-gray-100 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">Nama Sesudah Ganti</label>
                <input type="text" readOnly value={namaSesudahGanti} className="w-full border p-2 bg-gray-100 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500" />
              </div>
              {renderUploadSlot("dokumen_ganti_nama", "Dokumen Penetapan Resmi", "Format PDF")}
            </div>
          </div>

          {/* GRUP 4: STATUS KHUSUS KEPEMILIKAN */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">👑 Status Khusus Kepemilikan Lahan</h3>
              <button
                type="button"
                onClick={() => handleReplyGroup("Status Khusus Kepemilikan Lahan")}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
              >
                💬 Reply / Beri Catatan
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">Pilihan Hubungan Status Kepemilikan:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Perorangan', 'Kuasa', 'Waris', 'Hibah'].map((item) => (
                  <label key={item} className={`p-3 border rounded-xl flex items-center gap-2 cursor-not-allowed transition font-bold text-xs ${statusKepemilikan === item ? 'border-blue-950 bg-blue-50/50 text-blue-950' : 'bg-white text-gray-400'}`}>
                    <input type="radio" disabled name="statusKepemilikan" checked={statusKepemilikan === item} className="accent-blue-950 w-4 h-4 cursor-not-allowed" />
                    {item === 'Perorangan' ? 'Pemilik Langsung' : item}
                  </label>
                ))}
              </div>
            </div>

            {/* DOKUMEN KONDISIOAL STATUS KEPEMILIKAN */}
            {statusKepemilikan === 'Kuasa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/40 p-4 rounded-xl border border-amber-200">
                {renderUploadSlot("akta_kuasa", "Akta Kuasa Notariil / Legalisasi", "Scan dokumen kuasa resmi")}
                {renderUploadSlot("ktp_kuasa", "KTP Penerima Kuasa", "Scan identitas penerima kuasa")}
              </div>
            )}

            {statusKepemilikan === 'Waris' && (
              <div className="bg-red-50/30 p-4 rounded-xl border border-red-100 space-y-4">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider">⚠️ Berkas Tambahan Ahli Waris:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderUploadSlot("akta_waris", "Akta Waris / SK Waris Resmi", "Scan seluruh lembar ket. waris")}
                  {renderUploadSlot("ktp_ahli_waris", "KTP Ahli Waris", "Format PDF/JPG")}
                  {renderUploadSlot("kk_ahli_waris", "KK Ahli Waris", "Format PDF")}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">No. Surat Keterangan Kematian</label>
                    <input type="text" readOnly value={noSuratKematian} className="w-full border p-2 bg-gray-100 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 font-medium" />
                  </div>
                  {renderUploadSlot("surat_kematian", "Scan Berkas Surat Kematian Asli", "Format PDF")}
                </div>
              </div>
            )}

            {statusKepemilikan === 'Hibah' && (
              <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                {renderUploadSlot("akta_hibah", "Akta Hibah Resmi", "Scan berkas akta hibah notariil/PPAT")}
              </div>
            )}
          </div>

          {/* PANEL TOMBOL NAVIGASI */}
          <div className="flex justify-between items-center border-t pt-5 mt-4">
            <button 
              type="button" 
              onClick={() => router.push(`/admin/assessor/penilaian/ulok-perorangan?id=${ulokId}`)} 
              className="text-xs font-bold text-gray-500 hover:text-blue-950 transition"
            >
              ← Kembali ke Chat Penilaian
            </button>
            <button 
              type="button" 
              onClick={() => router.push(`/admin/assessor/penilaian/ulok-perorangan/detail-penilaian/section2?id=${ulokId}`)} 
              className="bg-blue-950 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 transition"
            >
              Lanjut ke Section 2 →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
