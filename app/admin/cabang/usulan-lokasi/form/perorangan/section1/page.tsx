'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getUploadedDocuments, uploadUlokFile } from '@/actions/cabang'
import { softDeleteDocument } from '@/actions/recyclebin'
import UploadSlot from '@/components/shared/UploadSlot'
import SuccessModal from '@/components/shared/SuccessModal'
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal'

export default function Section1PeroranganPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id') || ''
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  const [statusKepemilikan, setStatusKepemilikan] = useState('Perorangan')
  const [namaPemegang, setNamaPemegang] = useState('')
  const [nik, setNik] = useState('')
  const [namaKitas, setNamaKitas] = useState('')
  const [noKK, setNoKK] = useState('')
  const [noBukuNikah, setNoBukuNikah] = useState('')
  const [namaSebelumGanti, setNamaSebelumGanti] = useState('')
  const [namaSesudahGanti, setNamaSesudahGanti] = useState('')
  const [noSuratKematian, setNoSuratKematian] = useState('')

  const [hasEktp, setHasEktp] = useState(false)
  const [hasKitas, setHasKitas] = useState(false)

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
    } catch {
      return ''
    }
  }

  const loadDataDanDokumen = async () => {
    if (!ulokId) return
    setIsLoading(true)
    
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

  const handleNavigation = (targetPath: string) => {
    if (!ulokId) return
    startTransition(async () => {
      try {
        const payload = {
          jenis_badan_hukum: statusKepemilikan,
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
        if (!res.success) {
          setSuccessModalText("Gagal menyimpan data section 1: " + res.error)
          setShowSuccessModal(true)
          setTimeout(() => setShowSuccessModal(false), 2000)
          return
        }

        router.push(targetPath)
      } catch (error: any) {
        console.error("Error saving before navigation:", error)
        setSuccessModalText("Terjadi kesalahan saat menyimpan data.")
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
        {/* === BREADCRUMB === */}
        <nav className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 select-none mb-10 mt-8 uppercase tracking-wider">
          <span 
            onClick={() => !isPending && handleNavigation('/admin/cabang/usulan-lokasi')} 
            className={`cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
          >
            Usulan Lokasi
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span 
            onClick={() => !isPending && handleNavigation(`/admin/cabang/usulan-lokasi/form/perorangan?id=${ulokId}`)} 
            className={`cursor-pointer hover:text-blue-950 dark:hover:text-blue-400 transition ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
          >
            Form Perorangan
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-800 dark:text-gray-100 font-bold">Section 1: Identitas</span>
        </nav>

        {/* === HEADER === */}
        <div className="bg-blue-950 dark:bg-[#1E293B] text-white p-6 rounded-xl flex justify-between items-center shadow-sm border border-transparent dark:border-gray-800">
          <div>
            <h1 className="text-lg font-bold">Section 1: Identitas Pemilik & Status Kepemilikan</h1>
            <p className="text-xs text-blue-200/80 dark:text-gray-400 mt-0.5">Seluruh inputan teks akan disimpan otomatis saat Anda klik tombol 'Next'.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20 dark:border-gray-700">1 / 2</span>
        </div>

        {/* === FORM: IDENTITAS & PAJAK === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-perorangan.svg" alt="Perorangan" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Dokumen Identitas & Pajak Dasar
          </h3>
            
            <div className="rounded-3xl p-4 bg-gray-50/35 dark:bg-gray-800/15 space-y-3">
              <label className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 cursor-pointer text-xs">
                <input type="checkbox" checked={hasEktp} onChange={(e) => setHasEktp(e.target.checked)} className="rounded accent-blue-950 dark:accent-blue-500 w-4 h-4" />
                Dokumen E-KTP Pemilik
              </label>
              {hasEktp && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 pl-6 border-l-2 border-blue-950/30 dark:border-gray-700">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Nama Lengkap Sesuai KTP</label>
                    <input type="text" value={namaPemegang} onChange={(e) => setNamaPemegang(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nama Lengkap" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">NIK Pemilik (16 Digit)</label>
                    <input type="text" maxLength={16} value={nik} onChange={(e) => setNik(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Masukkan NIK" />
                  </div>
                  <UploadSlot
                    docType="ktp_pemilik"
                    label="File Scan E-KTP"
                    subLabel="Format PDF/JPG, Maksimal 2MB"
                    uploadedDocs={uploadedDocs}
                    isPending={isPending}
                    handleFileUpload={handleFileUpload}
                    setDeleteTarget={setDeleteTarget}
                    formatWaktu={formatWaktu}
                  />
                </div>
              )}
            </div>

            <div className="rounded-3xl p-4 bg-gray-50/35 dark:bg-gray-800/15 space-y-3">
              <label className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 cursor-pointer text-xs">
                <input type="checkbox" checked={hasKitas} onChange={(e) => setHasKitas(e.target.checked)} className="rounded accent-blue-950 dark:accent-blue-500 w-4 h-4" />
                KITAS / KITAP (Khusus WNA)
              </label>
              {hasKitas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 pl-6 border-l-2 border-blue-950/30 dark:border-gray-700">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Nama Sesuai Paspor / KITAS</label>
                    <input type="text" value={namaKitas} onChange={(e) => setNamaKitas(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nama Sesuai Paspor" />
                  </div>
                  <UploadSlot
                    docType="kitas_kitap"
                    label="File Scan KITAS / KITAP"
                    subLabel="Format PDF, Maksimal 2MB"
                    uploadedDocs={uploadedDocs}
                    isPending={isPending}
                    handleFileUpload={handleFileUpload}
                    setDeleteTarget={setDeleteTarget}
                    formatWaktu={formatWaktu}
                  />
                </div>
              )}
            </div>

            {/* === FORM: DOKUMEN PAJAK === */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <UploadSlot
                docType="npwp"
                label="Scan NPWP Asli"
                subLabel="Format PDF/PNG"
                uploadedDocs={uploadedDocs}
                isPending={isPending}
                handleFileUpload={handleFileUpload}
                setDeleteTarget={setDeleteTarget}
                formatWaktu={formatWaktu}
              />
              <UploadSlot
                docType="pkp_sppkp"
                label="Scan PKP / SPPKP"
                subLabel="Format PDF"
                uploadedDocs={uploadedDocs}
                isPending={isPending}
                handleFileUpload={handleFileUpload}
                setDeleteTarget={setDeleteTarget}
                formatWaktu={formatWaktu}
              />
              <UploadSlot
                docType="non_pkp"
                label="Scan Non PKP / Surat Pernyataan"
                subLabel="Format PDF"
                uploadedDocs={uploadedDocs}
                isPending={isPending}
                handleFileUpload={handleFileUpload}
                setDeleteTarget={setDeleteTarget}
                formatWaktu={formatWaktu}
              />
            </div>
          </div>

        {/* === FORM: KK & PERNIKAHAN === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-family.svg" alt="Family" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Kartu Keluarga & Status Pernikahan
          </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">No. Kartu Keluarga (KK)</label>
                <input type="text" value={noKK} onChange={(e) => setNoKK(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nomor KK 16 Digit" />
              </div>
              <UploadSlot
                docType="kartu_keluarga"
                label="File Scan Kartu Keluarga"
                subLabel="Format PDF"
                uploadedDocs={uploadedDocs}
                isPending={isPending}
                handleFileUpload={handleFileUpload}
                setDeleteTarget={setDeleteTarget}
                formatWaktu={formatWaktu}
              />
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">No. Buku Nikah / Akta Perkawinan</label>
                <input type="text" value={noBukuNikah} onChange={(e) => setNoBukuNikah(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nomor Buku Nikah" />
              </div>
              <UploadSlot
                docType="buku_nikah"
                label="File Scan Buku Nikah"
                subLabel="Format PDF"
                uploadedDocs={uploadedDocs}
                isPending={isPending}
                handleFileUpload={handleFileUpload}
                setDeleteTarget={setDeleteTarget}
                formatWaktu={formatWaktu}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <UploadSlot
                docType="persetujuan_pasangan"
                label="Surat Persetujuan Suami / Istri"
                subLabel="Wajib di-ttd pasangan"
                uploadedDocs={uploadedDocs}
                isPending={isPending}
                handleFileUpload={handleFileUpload}
                setDeleteTarget={setDeleteTarget}
                formatWaktu={formatWaktu}
              />
              <UploadSlot
                docType="akta_cerai"
                label="Akta Cerai (Apabila Cerai)"
                subLabel="Format PDF resmi"
                uploadedDocs={uploadedDocs}
                isPending={isPending}
                handleFileUpload={handleFileUpload}
                setDeleteTarget={setDeleteTarget}
                formatWaktu={formatWaktu}
              />
            </div>
          </div>

        {/* === FORM: GANTI NAMA === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-nama.svg" alt="Ganti Nama" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Surat Penetapan Ganti Nama (Jika Ada)
          </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Nama Sebelum Ganti</label>
                <input type="text" value={namaSebelumGanti} onChange={(e) => setNamaSebelumGanti(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nama Lama" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Nama Sesudah Ganti</label>
                <input type="text" value={namaSesudahGanti} onChange={(e) => setNamaSesudahGanti(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nama Baru" />
              </div>
              <UploadSlot
                docType="dokumen_ganti_nama"
                label="Dokumen Penetapan Resmi"
                subLabel="Format PDF"
                uploadedDocs={uploadedDocs}
                isPending={isPending}
                handleFileUpload={handleFileUpload}
                setDeleteTarget={setDeleteTarget}
                formatWaktu={formatWaktu}
              />
            </div>
          </div>

        {/* === FORM: STATUS KEPEMILIKAN === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
            <img src="/icons/icon-file.svg" alt="Status Khusus" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
            Status Khusus Kepemilikan Lahan
          </h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Pilihan Hubungan Status Kepemilikan:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Perorangan', 'Kuasa', 'Waris', 'Hibah'].map((item) => (
                  <label key={item} className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition font-bold text-xs ${statusKepemilikan === item ? 'border-blue-950 bg-blue-50/50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                    <input type="radio" name="statusKepemilikan" checked={statusKepemilikan === item} onChange={() => setStatusKepemilikan(item)} className="accent-blue-950 dark:accent-blue-500 w-4 h-4" />
                    {item === 'Perorangan' ? 'Pemilik Langsung' : item}
                  </label>
                ))}
              </div>
            </div>

            {statusKepemilikan === 'Kuasa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/40 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 animate-fadeIn">
                <UploadSlot
                  docType="akta_kuasa"
                  label="Akta Kuasa Notariil / Legalisasi"
                  subLabel="Scan dokumen kuasa resmi"
                  uploadedDocs={uploadedDocs}
                  isPending={isPending}
                  handleFileUpload={handleFileUpload}
                  setDeleteTarget={setDeleteTarget}
                  formatWaktu={formatWaktu}
                />
                <UploadSlot
                  docType="ktp_kuasa"
                  label="KTP Penerima Kuasa"
                  subLabel="Scan identitas penerima kuasa"
                  uploadedDocs={uploadedDocs}
                  isPending={isPending}
                  handleFileUpload={handleFileUpload}
                  setDeleteTarget={setDeleteTarget}
                  formatWaktu={formatWaktu}
                />
              </div>
            )}

            {statusKepemilikan === 'Waris' && (
              <div className="bg-red-50/30 dark:bg-red-950/10 p-4 rounded-xl border border-red-100 dark:border-red-900/40 space-y-4 animate-fadeIn">
                <p className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">⚠️ Berkas Tambahan Khusus Ahli Waris:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <UploadSlot
                    docType="akta_waris"
                    label="Akta Waris / SK Waris Resmi"
                    subLabel="Scan seluruh lembar ket. waris"
                    uploadedDocs={uploadedDocs}
                    isPending={isPending}
                    handleFileUpload={handleFileUpload}
                    setDeleteTarget={setDeleteTarget}
                    formatWaktu={formatWaktu}
                  />
                  <UploadSlot
                    docType="ktp_ahli_waris"
                    label="KTP Ahli Waris"
                    subLabel="Format PDF/JPG"
                    uploadedDocs={uploadedDocs}
                    isPending={isPending}
                    handleFileUpload={handleFileUpload}
                    setDeleteTarget={setDeleteTarget}
                    formatWaktu={formatWaktu}
                  />
                  <UploadSlot
                    docType="kk_ahli_waris"
                    label="KK Ahli Waris"
                    subLabel="Format PDF"
                    uploadedDocs={uploadedDocs}
                    isPending={isPending}
                    handleFileUpload={handleFileUpload}
                    setDeleteTarget={setDeleteTarget}
                    formatWaktu={formatWaktu}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">No. Surat Keterangan Kematian</label>
                    <input type="text" value={noSuratKematian} onChange={(e) => setNoSuratKematian(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-blue-950" placeholder="Nomor Surat Kematian" />
                  </div>
                  <UploadSlot
                    docType="surat_kematian"
                    label="Scan Berkas Surat Kematian Asli"
                    subLabel="Format PDF"
                    uploadedDocs={uploadedDocs}
                    isPending={isPending}
                    handleFileUpload={handleFileUpload}
                    setDeleteTarget={setDeleteTarget}
                    formatWaktu={formatWaktu}
                  />
                </div>
              </div>
            )}

            {statusKepemilikan === 'Hibah' && (
              <div className="bg-emerald-50/30 dark:bg-emerald-950/10 p-4 rounded-3xl animate-fadeIn">
                <UploadSlot
                  docType="akta_hibah"
                  label="Akta Hibah Resmi"
                  subLabel="Scan berkas akta hibah notariil/PPAT"
                  uploadedDocs={uploadedDocs}
                  isPending={isPending}
                  handleFileUpload={handleFileUpload}
                  setDeleteTarget={setDeleteTarget}
                  formatWaktu={formatWaktu}
                />
              </div>
            )}
          </div>

        {/* === NAVIGASI === */}
        <div className="flex justify-between items-center bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-300 dark:border-gray-800 shadow-sm">
          <button 
            type="button" 
            disabled={isPending}
            onClick={() => handleNavigation('/admin/cabang/usulan-lokasi/form/perorangan?id=' + ulokId)} 
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Back
          </button>
          <button 
            type="button" 
            disabled={isPending}
            onClick={() => handleNavigation(`/admin/cabang/usulan-lokasi/form/perorangan/section2?id=${ulokId}`)} 
            className="bg-blue-950 dark:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 dark:hover:bg-blue-500 transition disabled:opacity-50"
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