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

  // State Form Teks
  const [statusKepemilikan, setStatusKepemilikan] = useState('Perorangan') // Pilihan Status: Pemilik Langsung (Perorangan) / Kuasa / Waris / Hibah
  const [namaPemegang, setNamaPemegang] = useState('')
  const [nik, setNik] = useState('')
  const [namaKitas, setNamaKitas] = useState('')
  const [noKK, setNoKK] = useState('')
  const [noBukuNikah, setNoBukuNikah] = useState('')
  const [namaSebelumGanti, setNamaSebelumGanti] = useState('')
  const [namaSesudahGanti, setNamaSesudahGanti] = useState('')
  const [noSuratKematian, setNoSuratKematian] = useState('')

  // State Kontrol Checkbox UI (Biar Form Ringkas)
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

      // Auto check checkbox UI jika data di DB sudah ada isinya
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
      router.push('/admin/cabang/usulan-lokasi')
      return
    }
    loadDataDanDokumen()
  }, [ulokId])

  // Proses Upload File Berkas Inline
  const handleFileUpload = async (docType: string, file: File) => {
    if (!file || !ulokId) return
    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const res = await uploadUlokFile(ulokId, docType, formData)
      if (res.success) {
        alert(`Berhasil mengunggah dokumen!`)
        // Refresh status berkas
        const resDocs = await getUploadedDocuments(ulokId)
        if (resDocs.success && resDocs.data) setUploadedDocs(resDocs.data)
      } else {
        alert(`Gagal mengunggah: ` + res.error)
      }
    })
  }

  // Proses Hapus Berkas Inline
  const handleFileDelete = async (docId: string, fileUrl: string) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus berkas ini?")
    if (!confirmDelete) return

    startTransition(async () => {
      const res = await deleteUlokFile(docId, fileUrl)
      if (res.success) {
        alert("Berkas berhasil dihapus!")
        // Refresh status berkas
        const resDocs = await getUploadedDocuments(ulokId)
        if (resDocs.success && resDocs.data) setUploadedDocs(resDocs.data)
      } else {
        alert("Gagal menghapus berkas: " + res.error)
      }
    })
  }

  // Komponen Reusable Slot Upload Berkas inline
  const renderUploadSlot = (docType: string, label: string, subLabel: string) => {
    const existingFile = uploadedDocs.find(doc => doc.document_type === docType)
    return (
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between gap-2 hover:border-blue-950/30 transition">
        <div>
          <span className="font-bold text-gray-700 text-[11px] block">{label}</span>
          <p className="text-[10px] text-gray-400">{subLabel}</p>
        </div>
        {existingFile ? (
          <div className="flex items-center justify-between gap-1 bg-emerald-50 p-1.5 rounded border border-emerald-200">
            <span className="text-[10px] text-emerald-700 font-bold truncate max-w-30">📄 Tersimpan</span>
            <div className="flex gap-1">
              <a href={existingFile.file_url} target="_blank" rel="noreferrer" className="bg-blue-950 text-white px-2 py-0.5 rounded text-[9px] font-bold transition hover:bg-blue-900">View</a>
              <button type="button" onClick={() => handleFileDelete(existingFile.id, existingFile.file_url)} className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-bold transition hover:bg-red-700">Delete</button>
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
            className="text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 file:cursor-pointer w-full text-gray-400" 
          />
        )}
      </div>
    )
  }

  // Navigasi Sekaligus Auto-Save Data Teks Halaman Section 1
  const handleNavigation = async (targetPath: string) => {
    if (!ulokId) return
    startTransition(async () => {
      const payload = {
        jenis_badan_hukum: statusKepemilikan, // Menyimpan status pilihan ke kolom jenis_badan_hukum
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

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-500 font-medium">Memuat Formulir Section 1...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-xl border shadow-sm overflow-hidden">
        
        {/* HEADER SECTION */}
        <div className="bg-blue-950 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">Section 1: Identitas Pemilik & Status Kepemilikan</h1>
            <p className="text-xs text-blue-200/80 mt-0.5">Seluruh inputan teks akan disimpan otomatis saat Anda klik tombol 'Selanjutnya'.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">Langkah 1 dari 2</span>
        </div>

        <div className="p-6 space-y-6 text-sm">
          
          {/* GRUP 1: IDENTITAS & PAJAK DASAR */}
          <div className="space-y-4 border-b pb-5">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">🪪 Dokumen Identitas & Pajak Dasar</h3>
            
            {/* Checkbox E-KTP */}
            <div className="border rounded-xl p-4 bg-gray-50/30 space-y-3">
              <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer text-xs">
                <input type="checkbox" checked={hasEktp} onChange={(e) => setHasEktp(e.target.checked)} className="rounded accent-blue-950 w-4 h-4" />
                Dokumen E-KTP Pemilik
              </label>
              {hasEktp && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 pl-6 border-l-2 border-blue-950/30">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Nama Lengkap Sesuai KTP</label>
                    <input type="text" value={namaPemegang} onChange={(e) => setNamaPemegang(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs font-medium" placeholder="Nama Lengkap" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">NIK Pemilik (16 Digit)</label>
                    <input type="text" maxLength={16} value={nik} onChange={(e) => setNik(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs font-medium" placeholder="Masukkan NIK" />
                  </div>
                  {renderUploadSlot("ktp_pemilik", "File Scan E-KTP", "Format PDF/JPG, Maksimal 2MB")}
                </div>
              )}
            </div>

            {/* Checkbox KITAS/KITAP */}
            <div className="border rounded-xl p-4 bg-gray-50/30 space-y-3">
              <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer text-xs">
                <input type="checkbox" checked={hasKitas} onChange={(e) => setHasKitas(e.target.checked)} className="rounded accent-blue-950 w-4 h-4" />
                KITAS / KITAP (Khusus WNA)
              </label>
              {hasKitas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 pl-6 border-l-2 border-blue-950/30">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Nama Sesuai Paspor / KITAS</label>
                    <input type="text" value={namaKitas} onChange={(e) => setNamaKitas(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs font-medium" placeholder="Nama Sesuai Paspor" />
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
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">👨‍👩‍👧‍👦 Kartu Keluarga & Status Pernikahan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500">No. Kartu Keluarga (KK)</label>
                <input type="text" value={noKK} onChange={(e) => setNoKK(e.target.value)} className="w-full border p-2 rounded-lg text-xs" placeholder="Nomor KK 16 Digit" />
              </div>
              {renderUploadSlot("kartu_keluarga", "File Scan Kartu Keluarga", "Format PDF")}
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500">No. Buku Nikah / Akta Perkawinan</label>
                <input type="text" value={noBukuNikah} onChange={(e) => setNoBukuNikah(e.target.value)} className="w-full border p-2 rounded-lg text-xs" placeholder="Nomor Buku Nikah" />
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
            <h3 className="font-bold text-xs uppercase text-gray-500">🔄 Surat Penetapan Ganti Nama (Jika Ada)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Nama Sebelum Ganti</label>
                <input type="text" value={namaSebelumGanti} onChange={(e) => setNamaSebelumGanti(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" placeholder="Nama Lama" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Nama Sesudah Ganti</label>
                <input type="text" value={namaSesudahGanti} onChange={(e) => setNamaSesudahGanti(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" placeholder="Nama Baru" />
              </div>
              {renderUploadSlot("dokumen_ganti_nama", "Dokumen Penetapan Resmi", "Format PDF")}
            </div>
          </div>

          {/* GRUP 4: STATUS KHUSUS KEPEMILIKAN */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">👑 Status Khusus Kepemilikan Lahan</h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">Pilihan Hubungan Status Kepemilikan:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Perorangan', 'Kuasa', 'Waris', 'Hibah'].map((item) => (
                  <label key={item} className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition font-bold text-xs ${statusKepemilikan === item ? 'border-blue-950 bg-blue-50/50 text-blue-950' : 'bg-white hover:bg-gray-50'}`}>
                    <input type="radio" name="statusKepemilikan" checked={statusKepemilikan === item} onChange={() => setStatusKepemilikan(item)} className="accent-blue-950 w-4 h-4" />
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
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider">⚠️ Berkas Tambahan Khusus Ahli Waris:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderUploadSlot("akta_waris", "Akta Waris / SK Waris Resmi", "Scan seluruh lembar ket. waris")}
                  {renderUploadSlot("ktp_ahli_waris", "KTP Ahli Waris", "Format PDF/JPG")}
                  {renderUploadSlot("kk_ahli_waris", "KK Ahli Waris", "Format PDF")}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">No. Surat Keterangan Kematian</label>
                    <input type="text" value={noSuratKematian} onChange={(e) => setNoSuratKematian(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs font-medium" placeholder="Nomor Surat Kematian" />
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
          <div className="flex justify-end gap-3 border-t pt-5 mt-4">
            <button 
              type="button" 
              onClick={() => handleNavigation(`/admin/cabang/usulan-lokasi/form/perorangan?id=${ulokId}`)} 
              className="px-5 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition"
            >
              ← Kembali ke Detail
            </button>
            <button 
              type="button" 
              disabled={isPending}
              onClick={() => handleNavigation(`/admin/cabang/usulan-lokasi/form/perorangan/section2?id=${ulokId}`)} 
              className="bg-blue-950 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 transition disabled:opacity-50"
            >
              {isPending ? 'Menyimpan...' : 'Selanjutnya: Data Lahan & Perizinan →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}