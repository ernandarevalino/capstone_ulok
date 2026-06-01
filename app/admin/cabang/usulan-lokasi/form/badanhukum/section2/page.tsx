'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getUploadedDocuments, uploadUlokFile, deleteUlokFile } from '@/actions/cabang'

export default function Section2BadanHukumPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  // State Utama Komponen Section 2
  const [jenisAlasHak, setJenisAlasHak] = useState('')
  const [noSertifikat, setNoSertifikat] = useState('')
  const [namaSertifikat, setNamaSertifikat] = useState('')
  const [luasSertifikat, setLuasSertifikat] = useState('')
  const [masaBerlakuSertifikat, setMasaBerlakuSertifikat] = useState('')
  
  // State Dokumen Lainnya / Kelurahan
  const [isLainnya, setIsLainnya] = useState(false)
  const [namaAjbLainnya, setNamaAjbLainnya] = useState('')
  const [noAjbLainnya, setNoAjbLainnya] = useState('')
  const [isProsesSertifikat, setIsProsesSertifikat] = useState(false)

  // State Kondisi Objek & Finansial
  const [bentukObjek, setBentukObjek] = useState('')
  const [hargaSewa, setHargaSewa] = useState('')
  const [isJaminan, setIsJaminan] = useState('Tidak')
  const [namaBank, setNamaBank] = useState('')
  const [noSuratJaminan, setNoSuratJaminan] = useState('')
  const [tanggalSuratJaminan, setTanggalSuratJaminan] = useState('')
  const [catatanLainnya, setCatatanLainnya] = useState('')

  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])

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

    const loadData = async () => {
      setIsLoading(true)
      await fetchDocs()
      const res = await getUlokDetail(ulokId)
      if (res.success && res.data) {
        const d = res.data
        setJenisAlasHak(d.jenis_alas_hak || '')
        setNoSertifikat(d.no_sertifikat_alas_hak || '')
        setNamaSertifikat(d.nama_sertifikat_alas_hak || '')
        setLuasSertifikat(d.luas_sertifikat || '')
        setMasaBerlakuSertifikat(d.masa_berlaku_sertifikat || '')
        setNamaAjbLainnya(d.nama_ajb_lainnya || '')
        setNoAjbLainnya(d.no_ajb_lainnya || '')
        if (d.nama_ajb_lainnya || d.no_ajb_lainnya) setIsLainnya(true)
        setBentukObjek(d.bentuk_objek || '')
        setHargaSewa(d.harga_sewa?.toString() || '')
        setIsJaminan(d.dokumen_jaminan || 'Tidak')
        setNamaBank(d.jaminan_bank_nama || '')
        setNoSuratJaminan(d.jaminan_bank_no_surat || '')
        setTanggalSuratJaminan(d.jaminan_bank_tanggal || '')
        setCatatanLainnya(d.data_pribadi_tambahan || '')
      }
      setIsLoading(false)
    }
    loadData()
  }, [ulokId])

  const handleFinalSave = async (targetUrl: string, isSubmit = false) => {
    if (!ulokId) return
    startTransition(async () => {
      const payload: any = {
        jenis_alas_hak: jenisAlasHak,
        no_sertifikat_alas_hak: noSertifikat,
        nama_sertifikat_alas_hak: namaSertifikat,
        luas_sertifikat: luasSertifikat,
        masa_berlaku_sertifikat: jenisAlasHak === 'Hak Milik' ? null : masaBerlakuSertifikat,
        nama_ajb_lainnya: isLainnya ? namaAjbLainnya : null,
        no_ajb_lainnya: isLainnya ? noAjbLainnya : null,
        bentuk_objek: bentukObjek,
        harga_sewa: hargaSewa ? parseFloat(hargaSewa) : null,
        dokumen_jaminan: isJaminan,
        jaminan_bank_nama: isJaminan === 'Ya' ? namaBank : null,
        jaminan_bank_no_surat: isJaminan === 'Ya' ? noSuratJaminan : null,
        jaminan_bank_tanggal: isJaminan === 'Ya' ? tanggalSuratJaminan : null,
        data_pribadi_tambahan: catatanLainnya
      }

      if (isSubmit) {
        payload.status = 'In Review'
      }

      const res = await updateUlokSubmission(ulokId, payload)
      if (res.success) {
        router.push(targetUrl)
      } else {
        alert('Gagal memperbarui berkas lahan: ' + res.error)
      }
    })
  }

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
      if (!confirm(`Hapus berkas "${label}"?`)) return
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
      <div className="border p-3 rounded-xl bg-white space-y-1.5 shadow-sm">
        <label className="block text-[11px] font-bold text-gray-700 leading-tight">{label}</label>
        {existingDoc ? (
          <div className="flex items-center justify-between gap-2 bg-green-50 p-2 rounded-lg border border-green-200">
            <span className="text-[10px] font-medium text-green-700 truncate max-w-30">Sudah Diunggah</span>
            <div className="flex gap-1.5">
              <a href={existingDoc.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-950 text-white px-2 py-0.5 rounded font-bold hover:bg-blue-900 transition">
                Lihat
              </a>
              <button type="button" onClick={handleFileDelete} className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold hover:bg-red-700 transition">
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input type="file" onChange={handleFileChange} className="block w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
            <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xs font-bold text-gray-500 animate-pulse">Memuat Objek & Alas Hak Lahan...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* BREADCRUMB NAVIGATION */}
        <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1 select-none">
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
          <span 
            onClick={() => router.push(`/admin/cabang/usulan-lokasi/form/badanhukum/section1?id=${ulokId}`)} 
            className="cursor-pointer hover:text-blue-950 transition"
          >
            Section 1: Legalitas
          </span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-bold">Section 2: Kelayakan</span>
        </nav>

        {/* HEADER */}
        <div className="bg-blue-950 text-white p-6 rounded-xl flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-lg font-bold">Section 2: Legalitas Lahan, Perizinan Objek & Jaminan Bank</h1>
            <p className="text-xs text-blue-200/80 mt-0.5">Lengkapi sertifikat fisik objek tanah beserta jaminan finansial perbankan di sini.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">2 / 2</span>
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

          {/* DETAIL SERTIFIKAT */}
          {jenisAlasHak !== '' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/60 border border-gray-200">
              <p className="text-xs font-bold text-blue-950 md:col-span-2">Detail Pengisian Berkas Sertifikat ({jenisAlasHak}):</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">No. Sertifikat</label>
                <input type="text" value={noSertifikat} onChange={(e) => setNoSertifikat(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" placeholder="Nomor Sertifikat Resmi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Pemegang Hak</label>
                <input type="text" value={namaSertifikat} onChange={(e) => setNamaSertifikat(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" placeholder="Nama Pemilik Instansi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Luas Tanah (m²)</label>
                <input type="number" value={luasSertifikat} onChange={(e) => setLuasSertifikat(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" placeholder="Contoh: 500" />
              </div>
              
              {/* SEMBUNYIKAN MASA BERLAKU JIKA HAK MILIK */}
              {jenisAlasHak !== 'Hak Milik' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Masa Berlaku Sertifikat</label>
                  <input type="date" value={masaBerlakuSertifikat} onChange={(e) => setMasaBerlakuSertifikat(e.target.value)} className="w-full border p-2 bg-white rounded-lg text-xs" />
                </div>
              ) : <div />}

              <div className="md:col-span-2 pt-2 border-t mt-1">
                {renderUploadSlot("sertifikat_tanah", `Dokumen Scan Buku Sertifikat (${jenisAlasHak})`, "Unggah berkas halaman penuh buku sertifikat")}
              </div>
            </div>
          )}

          {/* DOKUMEN LAINNYA / KELURAHAN */}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {renderUploadSlot("surat_tidak_sengketa", "Surat Keterangan Tidak Sengketa TTD Lurah & Camat", "Format PDF")}
                  {renderUploadSlot("surat_riwayat_tanah", "Surat Keterangan Riwayat Tanah TTD Lurah & Camat", "Format PDF")}
                  {renderUploadSlot("surat_penguasaan_fisik", "Surat Penguasaan Fisik Bidang Tanah TTD Lurah & Camat", "Format PDF")}
                  {renderUploadSlot("berita_acara_pengukuran", "Berita Acara Pengukuran & Gambar Ukur TTD Lurah & Camat", "Format PDF")}
                </div>

                {/* SUB-CHECKBOX PROSES SERTIFIKAT */}
                <div className="border rounded-xl p-3 bg-white space-y-3 shadow-sm">
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
            <label className="block text-xs font-bold text-gray-500 mb-1">Harga Sewa Total per 5 Tahun (Rp):</label>
            <input 
              type="number" 
              value={hargaSewa} 
              onChange={(e) => setHargaSewa(e.target.value)} 
              className="w-full border p-2 bg-white rounded-lg text-xs font-medium focus:outline-blue-950" 
              placeholder="Harga Sewa Total per 5 Tahun" 
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

        {/* PANEL TOMBOL NAVIGASI */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <button 
            type="button" 
            disabled={isPending}
            onClick={() => handleFinalSave(`/admin/cabang/usulan-lokasi/form/badanhukum/section1?id=${ulokId}`)} 
            className="text-xs font-bold text-gray-500 hover:text-blue-950 transition disabled:opacity-40"
          >
            Prev
          </button>
          
          <button 
            type="button"
            disabled={isPending}
            onClick={() => handleFinalSave(`/admin/cabang/usulan-lokasi`, true)}
            className="bg-blue-950 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 transition shadow-sm"
          >
            {isPending ? 'Saving...' : 'Selesai'}
          </button>
        </div>

      </div>
    </div>
  )
}