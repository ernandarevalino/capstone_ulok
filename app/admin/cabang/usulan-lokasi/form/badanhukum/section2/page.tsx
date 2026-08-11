'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getUploadedDocuments, uploadUlokFile } from '@/actions/cabang'
import { softDeleteDocument } from '@/actions/recyclebin'
import UploadSlot from '@/components/shared/UploadSlot'
import SuccessModal from '@/components/shared/SuccessModal'
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal'

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

    const resDetail = await getUlokDetail(ulokId)
    if (resDetail.success && resDetail.data) {
      const d = resDetail.data
      setJenisAlasHak(d.jenis_alas_hak || '')
      setNoSertifikat(d.no_sertifikat_alas_hak || '')
      setNamaSertifikat(d.nama_sertifikat || '')
      setLuasSertifikat(d.luas_sertifikat?.toString() || '')
      setMasaBerlakuSertifikat(d.masa_berlaku || '')
      
      setNamaAjbLainnya(d.nama_ajb || '')
      setNoAjbLainnya(d.no_ajb_lainnya || '')
      setLuasAjbLainnya(d.luas_ajb || '')

      setBentukObjek(d.bentuk_objek || '')
      setHargaSewa(d.harga_sewa ? d.harga_sewa.toString() : '')
      setIsJaminan(d.dokumen_jaminan ? 'Ya' : 'Tidak')
      setNamaBank(d.nama_jaminan || '')
      setNoSuratJaminan(d.no_surat_jaminan || '')
      setTanggalSuratJaminan(d.tanggal_jaminan || '')
      setCatatanLainnya(d.data_pribadi_lainnya || '')

      if (d.nama_ajb || d.no_ajb_lainnya) setIsLainnya(true)
      if (d.tanggal_proses) setIsProsesSertifikat(true)
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

  const handleMultipleFileUpload = async (docType: string, files: FileList) => {
    if (!files || files.length === 0 || !ulokId) return

    startTransition(async () => {
      let hasError = false
      let errorMessage = ''

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await uploadUlokFile(ulokId, docType, formData)
        if (!res.success) {
          hasError = true
          errorMessage = res.error || 'Gagal mengunggah salah satu file'
        }
      }

      if (!hasError) {
        setSuccessModalText('Semua berkas berhasil diperbarui!')
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 1500)
      } else {
        alert(`Gagal mengunggah berkas: ` + errorMessage)
      }

      const resDocs = await getUploadedDocuments(ulokId)
      if (resDocs.success && resDocs.data) setUploadedDocs(resDocs.data)
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
        alert("Gagal memindahkan berkas ke tempat sampah: " + res.error)
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
        nama_sertifikat: namaSertifikat,
        luas_sertifikat: luasSertifikat || null,
        masa_berlaku: jenisAlasHak === 'Hak Milik' ? null : (masaBerlakuSertifikat || null),
        
        nama_ajb: isLainnya ? namaAjbLainnya : '',
        no_ajb_lainnya: isLainnya ? noAjbLainnya : '',
        luas_ajb: isLainnya ? luasAjbLainnya : '',
        tanggal_proses: isProsesSertifikat ? new Date().toISOString().split('T')[0] : null,

        bentuk_objek: bentukObjek,
        harga_sewa: hargaSewa ? parseFloat(hargaSewa) : null,
        dokumen_jaminan: isJaminan === 'Ya',
        nama_jaminan: isJaminan === 'Ya' ? namaBank : '',
        no_surat_jaminan: isJaminan === 'Ya' ? noSuratJaminan : '',
        tanggal_jaminan: isJaminan === 'Ya' ? (tanggalSuratJaminan || null) : null,
        data_pribadi_lainnya: catatanLainnya
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
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
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
                <UploadSlot docType="sertifikat_tanah" label={`Dokumen Scan Buku Sertifikat (${jenisAlasHak})`} subLabel="Unggah berkas halaman penuh buku sertifikat" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
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
                  <UploadSlot docType="ajb_girik" label="Dokumen Berkas AJB" subLabel="Format PDF scan lengkap" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <UploadSlot docType="surat_tidak_sengketa" label="Surat Keterangan Tidak Sengketa TTD Lurah & Camat" subLabel="Format PDF" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
                  <UploadSlot docType="surat_riwayat_tanah" label="Surat Keterangan Riwayat Tanah TTD Lurah & Camat" subLabel="Format PDF" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
                  <UploadSlot docType="surat_penguasaan_fisik" label="Surat Penguasaan Fisik Bidang Tanah TTD Lurah & Camat" subLabel="Format PDF" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
                  <UploadSlot docType="berita_acara_pengukuran" label="Berita Acara Pengukuran & Gambar Ukur TTD Lurah & Camat" subLabel="Format PDF" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
                </div>

                <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-white dark:bg-[#111827] space-y-3 shadow-sm">
                  <label className="flex items-center gap-2 font-bold text-red-900 dark:text-red-400 cursor-pointer text-xs">
                    <input type="checkbox" checked={isProsesSertifikat} onChange={(e) => setIsProsesSertifikat(e.target.checked)} className="rounded accent-red-700 w-4 h-4" />
                    Sertifikat Masih Dalam Proses Pengurusan?
                  </label>
                  {isProsesSertifikat && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 pl-4 border-l-2 border-red-200 dark:border-red-900/40 animate-fadeIn">
                      <UploadSlot docType="covernote_notaris" label="Covernote Notaris" subLabel="Kondisional proses" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
                      <UploadSlot docType="tanda_terima_bpn" label="Tanda Terima BPN" subLabel="Kondisional proses" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
                      <UploadSlot docType="surat_perintah_setor" label="Surat Perintah Setor" subLabel="Kondisional proses" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
                      <UploadSlot docType="bukti_pembayaran" label="Bukti Pembayaran SPS" subLabel="Kondisional proses" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === BUNDEL 2: BENTUK OBJEK & IZIN PELENGKAP === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-4 shadow-sm">
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
            <UploadSlot docType="sppt_pbb" label="SPPT PBB Terbaru" subLabel="Scan lembar pajak tahunan" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="stts_pbb" label="STTS PBB (Bukti Bayar)" subLabel="Tanda terima bayar pajak" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="imb_pbg" label="Dokumen IMB / PBG" subLabel="Surat izin mendirikan bangunan" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="slf" label="SLF (Sertifikat Laik Fungsi)" subLabel="Surat kelayakan gedung" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="izin_tetangga" label="Izin Lingkungan / Tetangga" subLabel="Format PDF / TTD warga" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            <UploadSlot docType="persetujuan_developer" label="Surat Persetujuan Developer" subLabel="Wajib jika di kawasan Perumahan" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
          </div>
        </div>

        {/* === BUNDEL 3: STATUS JAMINAN BANK === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-4 shadow-sm">
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
              <UploadSlot docType="surat_persetujuan_bank" label="Surat Persetujuan Resmi Bank" subLabel="Scan dokumen persetujuan agunan bank" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
            </div>
          )}
        </div>

        {/* === BUNDEL 4: DATA TAMBAHAN KETERANGAN === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-3 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-file.svg" alt="Catatan" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Data Catatan & Pendukung Tambahan
          </h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Catatan Tambahan (Textarea)</label>
            <textarea rows={3} value={catatanLainnya} onChange={(e) => setCatatanLainnya(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 text-xs rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-blue-950 font-medium" placeholder="Tambahkan informasi pelengkap opsional di sini..." />
          </div>
          <div className="pt-2">
            <UploadSlot docType="dokumen_tambahan" label="Dokumen Berkas Pendukung Tambahan Lainnya" subLabel="Format berkas bebas gabungan" uploadedDocs={uploadedDocs} isPending={isPending} handleFileUpload={handleFileUpload} handleMultipleFileUpload={handleMultipleFileUpload} setDeleteTarget={setDeleteTarget} formatWaktu={formatWaktu} />
          </div>
        </div>

        {/* === PANEL TOMBOL NAVIGASI === */}
        <div className="flex justify-between items-center bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-300 dark:border-gray-800 shadow-sm">
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