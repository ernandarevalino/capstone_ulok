'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getUploadedDocuments, uploadUlokFile, deleteUlokFile } from '@/actions/cabang'

export default function Section2PeroranganPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id') || ''
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  // State Form Objek Lahan & Bangunan
  const [jenisAlasHak, setJenisAlasHak] = useState('') // HM / HGB / Hak Pengelolaan / Hak Pakai
  const [noSertifikat, setNoSertifikat] = useState('')
  const [namaSertifikat, setNamaSertifikat] = useState('')
  const [luasSertifikat, setLuasSertifikat] = useState('')
  const [masaBerlakuSertifikat, setMasaBerlakuSertifikat] = useState('')
  
  // State Dokumen Pendukung Lainnya (Sesuai Revisi Kamu)
  const [isLainnya, setIsLainnya] = useState(false)
  const [namaAjbLainnya, setNamaAjbLainnya] = useState('')
  const [noAjbLainnya, setNoAjbLainnya] = useState('')
  const [luasAjbLainnya, setLuasAjbLainnya] = useState('')
  
  const [isProsesSertifikat, setIsProsesSertifikat] = useState(false)

  // Bentuk Fisik & Izin
  const [bentukObjek, setBentukObjek] = useState('')
  const [hargaSewa, setHargaSewa] = useState('')
  const [isJaminan, setIsJaminan] = useState('Tidak')
  const [namaBank, setNamaBank] = useState('')
  const [noSuratJaminan, setNoSuratJaminan] = useState('')
  const [tanggalSuratJaminan, setTanggalSuratJaminan] = useState('')
  const [catatanLainnya, setCatatanLainnya] = useState('')

  // State Berkas Terupload
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])

  const loadDataDanDokumen = async () => {
    if (!ulokId) return
    setIsLoading(true)

    // 1. Ambil data teks objek
    const resDetail = await getUlokDetail(ulokId)
    if (resDetail.success && resDetail.data) {
      const d = resDetail.data
      setJenisAlasHak(d.jenis_alas_hak || '')
      setNoSertifikat(d.no_sertifikat_alas_hak || '')
      setNamaSertifikat(d.nama_sertifikat_alas_hak || '')
      setLuasSertifikat(d.luas_sertifikat?.toString() || '')
      setMasaBerlakuSertifikat(d.masa_berlaku_sertifikat || '')
      
      setNamaAjbLainnya(d.nama_ajb_lainnya || '')
      setNoAjbLainnya(d.no_ajb_lainnya || '')
      setLuasAjbLainnya(d.luas_ajb_lainnya || '')

      setBentukObjek(d.bentuk_objek || '')
      setHargaSewa(d.harga_sewa?.toString() || '')
      setIsJaminan(d.dokumen_jaminan ? 'Ya' : 'Tidak')
      setNamaBank(d.jaminan_bank_nama || '')
      setNoSuratJaminan(d.jaminan_bank_no_surat || '')
      setTanggalSuratJaminan(d.jaminan_bank_tanggal || '')
      setCatatanLainnya(d.data_pribadi_tambahan || '')

      // Auto check UI kriteria penyesuaian baru jika data exist
      if (d.nama_ajb_lainnya || d.no_ajb_lainnya) setIsLainnya(true)
      if (d.tanggal_proses_sertifikat) setIsProsesSertifikat(true)
    }

    // 2. Ambil list dokumen
    const resDocs = await getUploadedDocuments(ulokId)
    if (resDocs.success && resDocs.data) {
      setUploadedDocs(resDocs.data)
      // Jika berkas proses sertifikat terdeteksi sudah pernah ada, nyalakan checkbox proses
      const berkasProsesExist = resDocs.data.some((doc: any) => 
        ['covernote_notaris', 'tanda_terima_bpn', 'surat_perintah_setor', 'bukti_pembayaran'].includes(doc.document_type)
      )
      if (berkasProsesExist) setIsProsesSertifikat(true)
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

  // File Upload Handler
  const handleFileUpload = async (docType: string, file: File) => {
    if (!file || !ulokId) return
    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const res = await uploadUlokFile(ulokId, docType, formData)
      if (res.success) {
        alert(`Berhasil mengunggah dokumen!`)
        const resDocs = await getUploadedDocuments(ulokId)
        if (resDocs.success && resDocs.data) setUploadedDocs(resDocs.data)
      } else {
        alert(`Gagal mengunggah: ` + res.error)
      }
    })
  }

  // File Delete Handler
  const handleFileDelete = async (docId: string, fileUrl: string) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus berkas ini?")
    if (!confirmDelete) return

    startTransition(async () => {
      const res = await deleteUlokFile(docId, fileUrl)
      if (res.success) {
        alert("Berkas berhasil dihapus!")
        const resDocs = await getUploadedDocuments(ulokId)
        if (resDocs.success && resDocs.data) setUploadedDocs(resDocs.data)
      } else {
        alert("Gagal menghapus berkas: " + res.error)
      }
    })
  }

  const renderUploadSlot = (docType: string, label: string, subLabel: string) => {
    const existingFile = uploadedDocs.find(doc => doc.document_type === docType)
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between gap-2 hover:border-blue-950/30 transition">
        <div>
          <span className="font-bold text-gray-700 text-[11px] block">{label}</span>
          <p className="text-[10px] text-gray-400">{subLabel}</p>
        </div>
        {existingFile ? (
          <div className="flex items-center justify-between gap-1 bg-emerald-50 p-1.5 rounded border border-emerald-200">
            <span className="text-[10px] text-emerald-700 font-bold truncate max-w-37.5">📄 Tersimpan</span>
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
            className="text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer w-full text-gray-400" 
          />
        )}
      </div>
    )
  }

  // Submit Final / Simpan Saat Back
  const handleFinalSave = async (targetPath: string, showSuccessAlert = false) => {
    if (!ulokId) return
    startTransition(async () => {
      const payload = {
        jenis_alas_hak: jenisAlasHak,
        no_sertifikat_alas_hak: noSertifikat,
        nama_sertifikat_alas_hak: namaSertifikat,
        luas_sertifikat: luasSertifikat || null,
        masa_berlaku_sertifikat: jenisAlasHak === 'Hak Milik' ? null : (masaBerlakuSertifikat || null), // Sesuai revisi: reset null jika HM
        
        nama_ajb_lainnya: isLainnya ? namaAjbLainnya : '',
        no_ajb_lainnya: isLainnya ? noAjbLainnya : '',
        luas_ajb_lainnya: isLainnya ? luasAjbLainnya : '',
        tanggal_proses_sertifikat: isProsesSertifikat ? new Date().toISOString().split('T')[0] : null,

        bentuk_objek: bentukObjek,
        harga_sewa: hargaSewa ? parseFloat(hargaSewa) : null,
        dokumen_jaminan: isJaminan === 'Ya',
        jaminan_bank_nama: isJaminan === 'Ya' ? namaBank : '',
        jaminan_bank_no_surat: isJaminan === 'Ya' ? noSuratJaminan : '',
        jaminan_bank_tanggal: isJaminan === 'Ya' ? (tanggalSuratJaminan || null) : null,
        data_pribadi_tambahan: catatanLainnya
      }

      const res = await updateUlokSubmission(ulokId, payload)
      if (res.success) {
        if (showSuccessAlert) alert("Seluruh rangkaian data usulan lokasi berhasil disimpan secara lengkap!")
        router.push(targetPath)
      } else {
        alert("Gagal menyimpan data Section 2: " + res.error)
      }
    })
  }

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-500 font-medium">Memuat Formulir Section 2...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="bg-blue-950 text-white p-6 rounded-xl flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-lg font-bold">Section 2: Legalitas Lahan, Perizinan Objek & Jaminan Bank</h1>
            <p className="text-xs text-blue-200/80 mt-0.5">Lengkapi sertifikat fisik objek tanah beserta jaminan finansial perbankan di sini.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">Langkah 2 dari 2</span>
        </div>

        {/* BUNDEL 1: ALAS HAK / BUKTI KEPEMILIKAN LAHAN */}
        <div className="bg-white border rounded-xl p-5 space-y-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2">📜 Alas Hak & Bukti Kepemilikan Lahan</h2>
          
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500">Pilihan Jenis Sertifikat:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Hak Milik', 'Hak Guna Bangunan', 'Hak Pengelolaan', 'Hak Pakai'].map((type) => (
                <label key={type} className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition font-bold text-xs ${jenisAlasHak === type ? 'border-blue-950 bg-blue-50/50 text-blue-950' : 'bg-white hover:bg-gray-50'}`}>
                  <input type="radio" name="jenisAlasHak" checked={jenisAlasHak === type} onChange={() => setJenisAlasHak(type)} className="accent-blue-950 w-4 h-4" />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* DETAIL SERTIFIKAT (KONDISIONAL JIKA SERTIFIKAT DIPILIH) */}
          {jenisAlasHak !== '' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/60 border border-gray-200">
              <p className="text-xs font-bold text-blue-950 md:col-span-2">Detail Pengisian Berkas Sertifikat ({jenisAlasHak}):</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">No. Sertifikat</label>
                <input type="text" value={noSertifikat} onChange={(e) => setNoSertifikat(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" placeholder="Nomor Sertifikat Resmi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Pemegang Hak</label>
                <input type="text" value={namaSertifikat} onChange={(e) => setNamaSertifikat(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" placeholder="Nama Pemilik Tanah" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Luas Tanah (m²)</label>
                <input type="number" value={luasSertifikat} onChange={(e) => setLuasSertifikat(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" placeholder="Contoh: 150" />
              </div>
              
              {/* REVISI: SEMBUNYIKAN SELEKTIF MASA BERLAKU JIKA HAK MILIK */}
              {jenisAlasHak !== 'Hak Milik' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Masa Berlaku Sertifikat</label>
                  <input type="date" value={masaBerlakuSertifikat} onChange={(e) => setMasaBerlakuSertifikat(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" />
                </div>
              ) : <div />}

              <div className="md:col-span-2 pt-2 border-t mt-1">
                {renderUploadSlot("sertifikat_tanah", `Dokumen Scan Buku Sertifikat (${jenisAlasHak})`, "Unggah berkas halaman penuh buku sertifikat asli")}
              </div>
            </div>
          )}

          {/* REVISI: KONDISIONAL CHECKBOX LAINNYA */}
          <div className="border rounded-xl p-4 bg-gray-50/40 space-y-3">
            <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer text-xs">
              <input type="checkbox" checked={isLainnya} onChange={(e) => setIsLainnya(e.target.checked)} className="rounded accent-blue-950 w-4 h-4" />
              Lainnya (AJB / Girik / Surat Kelurahan)
            </label>
            
            {isLainnya && (
              <div className="space-y-4 pt-2 pl-6 border-l-2 border-blue-950/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Nama / Jenis Dokumen</label>
                    <input type="text" value={namaAjbLainnya} onChange={(e) => setNamaAjbLainnya(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" placeholder="Contoh: AJB / Girik" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">No. & Luas Objek AJB</label>
                    <input type="text" value={noAjbLainnya} onChange={(e) => setNoAjbLainnya(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" placeholder="No. Dokumen & Luas Objek" />
                  </div>
                  {renderUploadSlot("ajb_girik", "Dokumen Berkas AJB", "Format PDF scan lengkap")}
                </div>

                {/* SLOT UPLOAD KUMPULAN SURAT KELURAHAN (INLINE) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {renderUploadSlot("surat_tidak_sengketa", "Surat Keterangan Tidak Sengketa TTD Lurah & Camat", "Format PDF")}
                  {renderUploadSlot("surat_riwayat_tanah", "Surat Keterangan Riwayat Tanah TTD Lurah & Camat", "Format PDF")}
                  {renderUploadSlot("surat_penguasaan_fisik", "Surat Penguasaan Fisik Bidang Tanah TTD Lurah & Camat", "Format PDF")}
                  {renderUploadSlot("berita_acara_pengukuran", "Berita Acara Pengukuran & Gambar Ukur TTD Lurah & Camat", "Format PDF")}
                </div>

                {/* REVISI: SUB-CHECKBOX PROSES SERTIFIKAT DI DALAMNYA */}
                <div className="border rounded-xl p-3 bg-white space-y-3 shadow-2xl">
                  <label className="flex items-center gap-2 font-bold text-red-900 cursor-pointer text-xs">
                    <input type="checkbox" checked={isProsesSertifikat} onChange={(e) => setIsProsesSertifikat(e.target.checked)} className="rounded accent-red-700 w-4 h-4" />
                    Sertifikat Masih Dalam Proses Pengurusan?
                  </label>
                  {isProsesSertifikat && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 pl-4 border-l-2 border-red-200">
                      {renderUploadSlot("covernote_notaris", "Covernote Notaris", "Kondisional proses")}
                      {renderUploadSlot("tanda_terima_bpn", "Tanda Terima BPN", "Kondisional proses")}
                      {renderUploadSlot("surat_perintah_setor", "Surat Perintah Setor", "Kondisional proses")}
                      {renderUploadSlot("bukti_pembayaran", "Bukti Pembayaran SPS", "Kondisional proses")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BUNDEL 2: BENTUK OBJEK & IZIN PELENGKAP */}
        <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2">🏢 Kondisi Fisik Objek & Izin Pelengkap</h2>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">Bentuk Objek Lahan / Bangunan:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Ruko', 'Rumah Tinggal', 'Tanah Kosong', 'Ruang Usaha'].map((item) => (
                <label key={item} className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition font-bold text-xs ${bentukObjek === item ? 'border-blue-950 bg-blue-50/50 text-blue-950' : 'bg-white hover:bg-gray-50'}`}>
                  <input type="radio" name="bentukObjek" checked={bentukObjek === item} onChange={() => setBentukObjek(item)} className="accent-blue-950 w-4 h-4" />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Harga Sewa per Tahun (Rp):</label>
            <input 
              type="number" 
              value={hargaSewa} 
              onChange={(e) => setHargaSewa(e.target.value)} 
              className="w-full border p-2 bg-white rounded-lg text-xs font-medium focus:outline-blue-950" 
              placeholder="Contoh: 75000000" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {renderUploadSlot("sppt_pbb", "SPPT PBB Terbaru", "Scan lembar pajak tahunan")}
            {renderUploadSlot("stts_pbb", "STTS PBB (Bukti Bayar)", "Tanda terima bayar pajak")}
            {renderUploadSlot("imb_pbg", "Dokumen IMB / PBG", "Surat izin mendirikan bangunan")}
            {renderUploadSlot("slf", "SLF (Sertifikat Laik Fungsi)", "Surat kelayakan gedung")}
            {renderUploadSlot("izin_tetangga", "Izin Lingkungan / Tetangga", "Format PDF / TTD warga")}
            {renderUploadSlot("persetujuan_developer", "Surat Persetujuan Developer", "Wajib jika di kawasan Perumahan")}
          </div>
        </div>

        {/* BUNDEL 3: STATUS JAMINAN BANK */}
        <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2">🏦 Status Penjaminan Keuangan / Finansial</h2>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">Apakah Lahan/Bangunan Sedang Menjadi Jaminan Bank?</label>
            <div className="flex gap-4">
              {['Tidak', 'Ya'].map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                  <input type="radio" name="isJaminan" value={opt} checked={isJaminan === opt} onChange={(e) => setIsJaminan(e.target.value)} className="w-4 h-4 accent-blue-950" />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {isJaminan === 'Ya' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Bank Penjamin</label>
                <input type="text" value={namaBank} onChange={(e) => setNamaBank(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs font-medium" placeholder="Nama Lembaga Perbankan" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor Surat Bank</label>
                <input type="text" value={noSuratJaminan} onChange={(e) => setNoSuratJaminan(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs font-medium" placeholder="No. Surat Keterangan Bank" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Surat Jaminan</label>
                <input type="date" value={tanggalSuratJaminan} onChange={(e) => setTanggalSuratJaminan(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" />
              </div>
              {renderUploadSlot("surat_persetujuan_bank", "Surat Persetujuan Resmi Bank", "Scan dokumen persetujuan agunan bank")}
            </div>
          )}
        </div>

        {/* BUNDEL 4: DATA TAMBAHAN KETERANGAN */}
        <div className="bg-white border rounded-xl p-5 space-y-3 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800">📝 Data Catatan & Pendukung Tambahan</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Catatan Tambahan (Textarea)</label>
            <textarea rows={3} value={catatanLainnya} onChange={(e) => setCatatanLainnya(e.target.value)} className="w-full border p-2 text-xs rounded-lg focus:outline-blue-950 font-medium" placeholder="Tambahkan informasi pelengkap opsional di sini..." />
          </div>
          <div className="pt-2">
            {renderUploadSlot("dokumen_tambahan", "Dokumen Berkas Pendukung Tambahan Lainnya", "Format berkas bebas gabungan")}
          </div>
        </div>

        {/* NAVIGASI TOMBOL FOOTER */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <button 
            type="button" 
            disabled={isPending}
            onClick={() => handleFinalSave(`/admin/cabang/usulan-lokasi/form/perorangan/section1?id=${ulokId}`)} 
            className="text-xs font-bold text-gray-500 hover:text-blue-950 transition disabled:opacity-40"
          >
            ← Kembali & Edit Section 1
          </button>
          
          <button 
            type="button"
            disabled={isPending}
            onClick={() => handleFinalSave(`/admin/cabang/usulan-lokasi/form/perorangan?id=${ulokId}`, true)}
            className="bg-blue-950 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 transition shadow-sm"
          >
            {isPending ? 'Menyimpan Form...' : '💾 Selesai & Keluar Form'}
          </button>
        </div>

      </div>
    </div>
  )
}