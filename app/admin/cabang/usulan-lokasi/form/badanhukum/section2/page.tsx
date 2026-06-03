'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getUploadedDocuments, uploadUlokFile, deleteUlokFile } from '@/actions/cabang'

export default function Section2BadanHukumPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id') || ''
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  const [jenisAlasHak, setJenisAlasHak] = useState('')
  const [noSertifikat, setNoSertifikat] = useState('')
  const [namaSertifikat, setNamaSertifikat] = useState('')
  const [luasSertifikat, setLuasSertifikat] = useState('')
  const [masaBerlakuSertifikat, setMasaBerlakuSertifikat] = useState('')
  
  const [isLainnya, setIsLainnya] = useState(false)
  const [namaAjbLainnya, setNamaAjbLainnya] = useState('')
  const [noAjbLainnya, setNoAjbLainnya] = useState('')
  const [luasAjbLainnya, setLuasAjbLainnya] = useState('')
  const [isProsesSertifikat, setIsProsesSertifikat] = useState(false)

  const [bentukObjek, setBentukObjek] = useState('')
  const [hargaSewa, setHargaSewa] = useState('')
  const [isJaminan, setIsJaminan] = useState('Tidak')
  const [namaBank, setNamaBank] = useState('')
  const [noSuratJaminan, setNoSuratJaminan] = useState('')
  const [tanggalSuratJaminan, setTanggalSuratJaminan] = useState('')
  const [catatanLainnya, setCatatanLainnya] = useState('')

  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalText, setSuccessModalText] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; url: string } | null>(null)

  const loadDataDanDokumen = async () => {
    if (!ulokId) return
    setIsLoading(true)

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
      setHargaSewa(d.harga_sewa ? d.harga_sewa.toString() : '')
      setIsJaminan(d.dokumen_jaminan ? 'Ya' : 'Tidak')
      setNamaBank(d.jaminan_bank_nama || '')
      setNoSuratJaminan(d.jaminan_bank_no_surat || '')
      setTanggalSuratJaminan(d.jaminan_bank_tanggal || '')
      setCatatanLainnya(d.data_pribadi_tambahan || '')

      if (d.nama_ajb_lainnya || d.no_ajb_lainnya) setIsLainnya(true)
      if (d.tanggal_proses_sertifikat) setIsProsesSertifikat(true)
    }

    const resDocs = await getUploadedDocuments(ulokId)
    if (resDocs.success && resDocs.data) {
      setUploadedDocs(resDocs.data)
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
        alert(`Gagal mengunggah: ` + res.error)
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
        alert("Gagal menghapus berkas: " + res.error)
        setDeleteTarget(null)
      }
    })
  }

  const handleFinalSave = async (targetPath: string, isSubmit = false) => {
    if (!ulokId) return
    startTransition(async () => {
      const payload: any = {
        jenis_alas_hak: jenisAlasHak,
        no_sertifikat_alas_hak: noSertifikat,
        nama_sertifikat_alas_hak: namaSertifikat,
        luas_sertifikat: luasSertifikat || null,
        masa_berlaku_sertifikat: jenisAlasHak === 'Hak Milik' ? null : (masaBerlakuSertifikat || null),
        
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
        if (isSubmit) {
          setSuccessModalText('Data Telah Disimpan, Silakan Masuk Kembali Ke Form Saat Mengubahnya!..')
          setShowSuccessModal(true)
          setTimeout(() => {
            setShowSuccessModal(false)
            router.push(targetPath)
          }, 2000)
        } else {
          router.push(targetPath)
        }
      } else {
        alert("Gagal menyimpan data Section 2: " + res.error)
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
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-30">📄 Tersimpan</span>
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-400 dark:text-gray-500 italic text-sm font-medium transition-colors duration-300">
        <div className="w-6 h-6 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        Memuat Form Section 2...
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
          <span 
            onClick={() => handleFinalSave(`/admin/cabang/usulan-lokasi/form/badanhukum/section1?id=${ulokId}`, false)} 
            className="cursor-pointer hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Section 1: Legalitas
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-800 dark:text-gray-100 font-bold">Section 2: Kelayakan</span>
        </nav>

        {/* === HEADER PANEL === */}
        <div className="bg-blue-950 dark:bg-[#1E293B] text-white p-6 rounded-xl flex justify-between items-center shadow-sm border border-transparent dark:border-gray-800">
          <div>
            <h1 className="text-lg font-bold">Section 2: Legalitas Lahan, Perizinan Objek & Jaminan Bank</h1>
            <p className="text-xs text-blue-200/80 dark:text-gray-400 mt-0.5">Lengkapi sertifikat fisik objek tanah beserta jaminan finansial perbankan di sini.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20 dark:border-gray-700">2 / 2</span>
        </div>

        {/* === BUNDEL 1: ALAS HAK / BUKTI KEPEMILIKAN LAHAN === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-file.svg" alt="Alas Hak" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Alas Hak & Bukti Kepemilikan Lahan
          </h2>
          
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Pilihan Jenis Sertifikat:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Hak Milik', 'Hak Guna Bangunan', 'Hak Pengelolaan', 'Hak Pakai'].map((type) => (
                <label key={type} className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition font-bold text-xs ${jenisAlasHak === type ? 'border-blue-950 bg-blue-50/50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  <input type="radio" name="jenisAlasHak" checked={jenisAlasHak === type} onChange={() => setJenisAlasHak(type)} className="accent-blue-950 dark:accent-blue-500 w-4 h-4" />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {jenisAlasHak !== '' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/60 dark:bg-gray-800/15 border border-gray-200 dark:border-gray-800 animate-fadeIn">
              <p className="text-xs font-bold text-blue-950 dark:text-blue-400 md:col-span-2">Detail Pengisian Berkas Sertifikat ({jenisAlasHak}):</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">No. Sertifikat</label>
                <input type="text" value={noSertifikat} onChange={(e) => setNoSertifikat(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nomor Sertifikat Resmi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nama Pemegang Hak</label>
                <input type="text" value={namaSertifikat} onChange={(e) => setNamaSertifikat(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nama Pemilik Instansi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Luas Tanah (m²)</label>
                <input type="number" value={luasSertifikat} onChange={(e) => setLuasSertifikat(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Contoh: 500" />
              </div>
              
              {jenisAlasHak !== 'Hak Milik' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Masa Berlaku Sertifikat</label>
                  <input type="date" value={masaBerlakuSertifikat} onChange={(e) => setMasaBerlakuSertifikat(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-blue-950" />
                </div>
              ) : <div />}

              <div className="md:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-800 mt-1">
                {renderUploadSlot("sertifikat_tanah", `Dokumen Scan Buku Sertifikat (${jenisAlasHak})`, "Unggah berkas halaman penuh buku sertifikat")}
              </div>
            </div>
          )}

          <div className="rounded-3xl p-4 bg-gray-50/35 dark:bg-gray-800/15 space-y-3">
            <label className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 cursor-pointer text-xs">
              <input type="checkbox" checked={isLainnya} onChange={(e) => setIsLainnya(e.target.checked)} className="rounded accent-blue-950 dark:accent-blue-500 w-4 h-4" />
              Lainnya (AJB / Girik / Surat Kelurahan)
            </label>
            
            {isLainnya && (
              <div className="space-y-4 pt-2 pl-6 border-l-2 border-blue-950/30 dark:border-gray-700 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Nama / Jenis Dokumen</label>
                    <input type="text" value={namaAjbLainnya} onChange={(e) => setNamaAjbLainnya(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Contoh: AJB / Girik" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">No. & Luas Objek AJB</label>
                    <input type="text" value={noAjbLainnya} onChange={(e) => setNoAjbLainnya(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="No. Dokumen & Luas Objek" />
                  </div>
                  {renderUploadSlot("ajb_girik", "Dokumen Berkas AJB", "Format PDF scan lengkap")}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {renderUploadSlot("surat_tidak_sengketa", "Surat Keterangan Tidak Sengketa TTD Lurah & Camat", "Format PDF")}
                  {renderUploadSlot("surat_riwayat_tanah", "Surat Keterangan Riwayat Tanah TTD Lurah & Camat", "Format PDF")}
                  {renderUploadSlot("surat_penguasaan_fisik", "Surat Penguasaan Fisik Bidang Tanah TTD Lurah & Camat", "Format PDF")}
                  {renderUploadSlot("berita_acara_pengukuran", "Berita Acara Pengukuran & Gambar Ukur TTD Lurah & Camat", "Format PDF")}
                </div>

                <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-white dark:bg-[#111827] space-y-3 shadow-sm">
                  <label className="flex items-center gap-2 font-bold text-red-900 dark:text-red-400 cursor-pointer text-xs">
                    <input type="checkbox" checked={isProsesSertifikat} onChange={(e) => setIsProsesSertifikat(e.target.checked)} className="rounded accent-red-700 w-4 h-4" />
                    Sertifikat Masih Dalam Proses Pengurusan?
                  </label>
                  {isProsesSertifikat && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 pl-4 border-l-2 border-red-200 dark:border-red-900/40 animate-fadeIn">
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

        {/* === BUNDEL 2: BENTUK OBJEK & IZIN PELENGKAP === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-file.svg" alt="Fisik Objek" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Kondisi Fisik Objek & Izin Pelengkap
          </h2>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Bentuk Objek Lahan / Bangunan:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Ruko', 'Rumah Tinggal', 'Tanah Kosong', 'Ruang Usaha'].map((item) => (
                <label key={item} className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition font-bold text-xs ${bentukObjek === item ? 'border-blue-950 bg-blue-50/50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  <input type="radio" name="bentukObjek" checked={bentukObjek === item} onChange={() => setBentukObjek(item)} className="accent-blue-950 dark:accent-blue-500 w-4 h-4" />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Harga Sewa Total per 5 Tahun (Rp):</label>
            <input 
              type="number" 
              value={hargaSewa} 
              onChange={(e) => setHargaSewa(e.target.value)} 
              className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" 
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

        {/* === BUNDEL 3: STATUS JAMINAN BANK === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-file.svg" alt="Jaminan Bank" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Status Penjaminan Keuangan / Finansial
          </h2>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Apakah Lahan/Bangunan Sedang Menjadi Jaminan Bank?</label>
            <div className="flex gap-4">
              {['Tidak', 'Ya'].map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300">
                  <input type="radio" name="isJaminan" value={opt} checked={isJaminan === opt} onChange={(e) => setIsJaminan(e.target.value)} className="w-4 h-4 accent-blue-950 dark:accent-blue-500" />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {isJaminan === 'Ya' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/15 border border-gray-200 dark:border-gray-800 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nama Bank Penjamin</label>
                <input type="text" value={namaBank} onChange={(e) => setNamaBank(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nama Lembaga Perbankan" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nomor Surat Bank</label>
                <input type="text" value={noSuratJaminan} onChange={(e) => setNoSuratJaminan(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="No. Surat Keterangan Bank" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Tanggal Surat Jaminan</label>
                <input type="date" value={tanggalSuratJaminan} onChange={(e) => setTanggalSuratJaminan(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-blue-950" />
              </div>
              {renderUploadSlot("surat_persetujuan_bank", "Surat Persetujuan Resmi Bank", "Scan dokumen persetujuan agunan bank")}
            </div>
          )}
        </div>

        {/* === BUNDEL 4: DATA TAMBAHAN KETERANGAN === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-file.svg" alt="Catatan" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Data Catatan & Pendukung Tambahan
          </h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Catatan Tambahan (Textarea)</label>
            <textarea rows={3} value={catatanLainnya} onChange={(e) => setCatatanLainnya(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 text-xs rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-blue-950 font-medium" placeholder="Tambahkan informasi pelengkap opsional di sini..." />
          </div>
          <div className="pt-2">
            {renderUploadSlot("dokumen_tambahan", "Dokumen Berkas Pendukung Tambahan Lainnya", "Format berkas bebas gabungan")}
          </div>
        </div>

        {/* === PANEL TOMBOL NAVIGASI === */}
        <div className="flex justify-between items-center bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <button 
            type="button" 
            disabled={isPending}
            onClick={() => handleFinalSave(`/admin/cabang/usulan-lokasi/form/badanhukum/section1?id=${ulokId}`, false)} 
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 transition disabled:opacity-50"
          >
            Prev
          </button>
          
          <button 
            type="button"
            disabled={isPending}
            onClick={() => handleFinalSave(`/admin/cabang/usulan-lokasi/form/badanhukum?id=${ulokId}`, true)}
            className="bg-blue-950 dark:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 dark:hover:bg-blue-500 transition disabled:opacity-50 shadow-sm"
          >
            {isPending ? 'Saving...' : 'Selesai'}
          </button>
        </div>

      </div>

      {/* === MODAL: SUKSES === */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <img src="/icons/icon-check.svg" alt="Success" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm leading-relaxed">
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