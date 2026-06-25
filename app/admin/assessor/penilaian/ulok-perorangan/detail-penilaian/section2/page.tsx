'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, getUploadedDocuments } from '@/actions/cabang'
import { Check, Loader2 } from 'lucide-react'
import { toggleDocumentVerification } from '@/actions/assessor'
import { calculateULOKSAW } from '@/actions/saw'

export default function Section2PeroranganAssessorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id')

  const [isLoading, setIsLoading] = useState(true)
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null)

  const [jenisAlasHak, setJenisAlasHak] = useState('')
  const [noSertifikat, setNoSertifikat] = useState('')
  const [namaSertifikat, setNamaSertifikat] = useState('')
  const [luasSertifikat, setLuasSertifikat] = useState('')
  const [masaBerlakuSertifikat, setMasaBerlakuSertifikat] = useState('')
  
  const [isLainnya, setIsLainnya] = useState(false)
  const [namaAjbLainnya, setNamaAjbLainnya] = useState('')
  const [noAjbLainnya, setNoAjbLainnya] = useState('')
  const [isProsesSertifikat, setIsProsesSertifikat] = useState(false)

  const [bentukObjek, setBentukObjek] = useState('')
  const [hargaSewa, setHargaSewa] = useState<number | null>(null)
  const [isJaminan, setIsJaminan] = useState('Tidak')
  const [namaBank, setNamaBank] = useState('')
  const [noSuratJaminan, setNoSuratJaminan] = useState('')
  const [tanggalSuratJaminan, setTanggalSuratJaminan] = useState('')
  const [catatanLainnya, setCatatanLainnya] = useState('')

  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalText, setSuccessModalText] = useState('')

  const handleToggleVerify = async (docId: string, currentStatus: boolean) => {
    setVerifyingDocId(docId)
    
    setUploadedDocs(prev => prev.map(doc => {
      if (doc.id === docId) {
        return { ...doc, is_verified: !currentStatus }
      }
      return doc
    }))
    
    const res = await toggleDocumentVerification(docId, currentStatus)
    
    if (!res.success) {
      setUploadedDocs(prev => prev.map(doc => {
        if (doc.id === docId) {
          return { ...doc, is_verified: currentStatus }
        }
        return doc
      }))
      
      setSuccessModalText(`Gagal memperbarui: ${res.error}`)
      setShowSuccessModal(true)
      setTimeout(() => {
        setShowSuccessModal(false)
      }, 1500)
    } else {
      setSuccessModalText(!currentStatus ? 'Verifikasi berhasil!' : 'Verifikasi dibatalkan!')
      setShowSuccessModal(true)
      setTimeout(() => {
        setShowSuccessModal(false)
      }, 800)

      if (ulokId) {
        await calculateULOKSAW(ulokId)
      }
    }
    setVerifyingDocId(null)
  }

  const fetchDocs = async () => {
    if (!ulokId) return []
    const res = await getUploadedDocuments(ulokId)
    if (res.success && res.data) {
      setUploadedDocs(res.data)
      return res.data
    }
    return []
  }

  useEffect(() => {
    if (!ulokId) {
      router.push('/admin/assessor/penilaian')
      return
    }

    const loadData = async () => {
      setIsLoading(true)
      const docs = await fetchDocs()
      const res = await getUlokDetail(ulokId)
      if (res.success && res.data) {
        const d = res.data
        setJenisAlasHak(d.jenis_alas_hak || '')
        setNoSertifikat(d.no_sertifikat_alas_hak || '')
        setNamaSertifikat(d.nama_sertifikat || '')
        setLuasSertifikat(d.luas_sertifikat || '')
        setMasaBerlakuSertifikat(d.masa_berlaku || '')
        setNamaAjbLainnya(d.nama_ajb || '')
        setNoAjbLainnya(d.no_ajb_lainnya || '')
        if (d.nama_ajb || d.no_ajb_lainnya) setIsLainnya(true)
        setBentukObjek(d.bentuk_objek || '')
        setHargaSewa(d.harga_sewa || null)
        setIsJaminan(d.dokumen_jaminan || 'Tidak')
        setNamaBank(d.nama_jaminan || '')
        setNoSuratJaminan(d.no_surat_jaminan || '')
        setTanggalSuratJaminan(d.tanggal_jaminan || '')
        setCatatanLainnya(d.data_pribadi_lainnya || '')

        if (d.tanggal_proses) setIsProsesSertifikat(true)
        const berkasProsesExist = docs.some((doc: any) => 
          ['covernote_notaris', 'tanda_terima_bpn', 'surat_perintah_setor', 'bukti_pembayaran'].includes(doc.document_type)
        )
        if (berkasProsesExist) setIsProsesSertifikat(true)
      }
      setIsLoading(false)
    }
    loadData()
  }, [ulokId])

  const handleReplyGroup = (groupName: string) => {
    router.push(`/admin/assessor/penilaian/ulok-perorangan?id=${ulokId}&prefill=${encodeURIComponent(`⚠️ [Catatan Assessor - Grup: ${groupName}]: `)}`)
  }

  const handleSelesaiPenilaian = () => {
    setSuccessModalText("Penilaian Selesai Anda bisa menilainya lagi lain kali")
    setShowSuccessModal(true)
    
    setTimeout(() => {
      setShowSuccessModal(false)
      router.push(`/admin/assessor/penilaian/ulok-perorangan?id=${ulokId}`)
    }, 1500)
  }

  const renderUploadSlot = (docType: string, label: string, hint: string) => {
    const existingDoc = uploadedDocs.find(d => d.document_type === docType)

    return (
      <div className="bg-gray-50 dark:bg-gray-800/25 p-3 rounded-2xl flex flex-col justify-between gap-2 transition hover:bg-gray-100 dark:hover:bg-gray-800/40">
        <div>
          <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] block leading-snug">{label}</span>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>
        </div>
        {existingDoc ? (
          <div className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/20 p-1.5 rounded border border-emerald-200 dark:border-emerald-900/40">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-30">📄 Tersimpan</span>
            <div className="flex gap-1.5 items-center">
              
              <a 
                href={existingDoc.file_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center"
                title="View File"
              >
                <img src="/icons/icon-view.svg" alt="View" className="w-3.5 h-3.5 object-contain dark:invert" />
              </a>

              <button
                type="button"
                disabled={verifyingDocId === existingDoc.id}
                onClick={() => handleToggleVerify(existingDoc.id, !!existingDoc.is_verified)}
                title="Verify Document"
                className={`p-1 rounded border shadow-sm transition-all flex items-center justify-center ${
                  existingDoc.is_verified
                    ? 'bg-emerald-100 text-green-600 border-green-300 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-600'
                } ${verifyingDocId === existingDoc.id ? 'opacity-50 cursor-wait' : ''}`}
              >
                {verifyingDocId === existingDoc.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                )}
              </button>

            </div>
          </div>
        ) : (
          <div className="p-1.5 rounded border border-dashed border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 flex items-center">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold italic select-none">⚠️ Belum ada dokumen terunggah</span>
          </div>
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
        
        {/* === BREADCRUMB === */}
        <nav className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 select-none mb-10 mt-2 uppercase tracking-wider">
          <span 
            onClick={() => router.push('/admin/assessor/penilaian')} 
            className="cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition"
          >
            Penilaian Usulan
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span 
            onClick={() => router.push(`/admin/assessor/penilaian/ulok-perorangan?id=${ulokId}`)} 
            className="cursor-pointer hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Detail Usulan Perorangan
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span 
            onClick={() => router.push(`/admin/assessor/penilaian/ulok-perorangan/detail-penilaian/section1?id=${ulokId}`)} 
            className="cursor-pointer hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Section 1: Identitas
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-800 dark:text-gray-100 font-bold">Section 2: Kelayakan</span>
        </nav>

        {/* === HEADER === */}
        <div className="bg-blue-950 dark:bg-[#1E293B] text-white p-6 rounded-xl flex justify-between items-center shadow-sm border border-transparent dark:border-gray-800">
          <div>
            <h1 className="text-lg font-bold">Penilaian Section 2: Legalitas Lahan, Perizinan Objek & Jaminan Bank</h1>
            <p className="text-xs text-blue-200/80 dark:text-gray-400 mt-0.5">Peninjauan sertifikat fisik objek tanah beserta jaminan finansial perbankan di sini.</p>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20 dark:border-gray-700">2 / 2</span>
        </div>

        {/* === FORM: ALAS HAK & KEPEMILIKAN === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <img src="/icons/icon-law.svg" alt="Legalitas" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
              Alas Hak & Bukti Kepemilikan Lahan
            </h3>
            
            <button
              type="button"
              onClick={() => handleReplyGroup("Alas Hak / Bukti Kepemilikan Lahan")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <img src="/icons/icon-message-now.svg" alt="Reply" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              Reply / Beri Catatan
            </button>
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Pilihan Jenis Sertifikat:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Hak Milik', 'Hak Guna Bangunan', 'Hak Pengelolaan', 'Hak Pakai'].map((type) => (
                <label key={type} className={`p-3 border rounded-xl flex items-center gap-2 cursor-not-allowed transition font-bold text-xs ${jenisAlasHak === type ? 'border-blue-950 bg-blue-50/50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'}`}>
                  <input type="radio" disabled name="jenisAlasHak" checked={jenisAlasHak === type} className="accent-blue-950 dark:accent-blue-500 w-4 h-4 cursor-not-allowed" />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* === FORM: DETAIL SERTIFIKAT === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/60 dark:bg-gray-800/15 border border-gray-200 dark:border-gray-800">
            <p className="text-xs font-bold text-blue-950 dark:text-blue-400 md:col-span-2">Detail Pengisian Berkas Sertifikat ({jenisAlasHak || 'Sertifikat Lahan'}):</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">No. Sertifikat</label>
              <input type="text" readOnly value={noSertifikat} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nama Pemegang Hak</label>
              <input type="text" readOnly value={namaSertifikat} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Luas Tanah (m²)</label>
              <input type="number" readOnly value={luasSertifikat} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400" />
            </div>
            
            {jenisAlasHak !== 'Hak Milik' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Masa Berlaku Sertifikat</label>
                <input type="date" readOnly value={masaBerlakuSertifikat} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400" />
              </div>
            ) : <div />}

            <div className="md:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-800 mt-1">
              {renderUploadSlot("sertifikat_tanah", `Dokumen Scan Buku Sertifikat (${jenisAlasHak || 'Lahan'})`, "Halaman penuh buku sertifikat")}
            </div>
          </div>

          {/* === FORM: DOKUMEN LAINNYA === */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/40 dark:bg-gray-800/5 space-y-3">
            <label className="flex items-center gap-2 font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed text-xs">
              <input type="checkbox" disabled checked={isLainnya} className="rounded accent-blue-950 dark:accent-blue-500 w-4 h-4 cursor-not-allowed" />
              Lainnya (AJB / Girik / Surat Kelurahan)
            </label>
            
            <div className="space-y-4 pt-2 pl-6 border-l-2 border-blue-950/30 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Nama / Jenis Dokumen</label>
                  <input type="text" readOnly value={namaAjbLainnya} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">No. & Luas Objek AJB</label>
                  <input type="text" readOnly value={noAjbLainnya} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400" />
                </div>
                {renderUploadSlot("ajb_girik", "Dokumen Berkas AJB", "Format PDF scan lengkap")}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {renderUploadSlot("surat_tidak_sengketa", "Surat Keterangan Tidak Sengketa TTD Lurah & Camat", "Format PDF")}
                {renderUploadSlot("surat_riwayat_tanah", "Surat Keterangan Riwayat Tanah TTD Lurah & Camat", "Format PDF")}
                {renderUploadSlot("surat_penguasaan_fisik", "Surat Penguasaan Fisik Bidang Tanah TTD Lurah & Camat", "Format PDF")}
                {renderUploadSlot("berita_acara_pengukuran", "Berita Acara Pengukuran & Gambar Ukur TTD Lurah & Camat", "Format PDF")}
              </div>

              {/* === FORM: PROSES SERTIFIKAT === */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-white dark:bg-gray-900/50 space-y-3 shadow-sm">
                <label className="flex items-center gap-2 font-bold text-red-950 dark:text-red-400 cursor-not-allowed text-xs">
                  <input type="checkbox" disabled checked={isProsesSertifikat} className="rounded accent-red-700 w-4 h-4 cursor-not-allowed" />
                  Sertifikat Masih Dalam Proses Pengurusan?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 pl-4 border-l-2 border-red-200 dark:border-red-900/40">
                  {renderUploadSlot("covernote_notaris", "Covernote Notaris", "Kondisional proses")}
                  {renderUploadSlot("tanda_terima_bpn", "Tanda Terima BPN", "Kondisional proses")}
                  {renderUploadSlot("surat_perintah_setor", "Surat Perintah Setor", "Kondisional proses")}
                  {renderUploadSlot("bukti_pembayaran", "Bukti Pembayaran SPS", "Kondisional proses")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === FORM: FISIK OBJEK & IZIN === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <img src="/icons/icon-file.svg" alt="Objek" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
              Kondisi Fisik Objek & Izin Pelengkap
            </h3>
            
            <button
              type="button"
              onClick={() => handleReplyGroup("Kondisi Fisik Objek & Izin Pelengkap")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <img src="/icons/icon-message-now.svg" alt="Reply" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              Reply / Beri Catatan
            </button>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Bentuk Objek Lahan / Bangunan:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Ruko', 'Rumah Tinggal', 'Tanah Kosong', 'Ruang Usaha'].map((item) => (
                <label key={item} className={`p-3 border rounded-xl flex items-center gap-2 cursor-not-allowed transition font-bold text-xs ${bentukObjek === item ? 'border-blue-950 bg-blue-50/50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'}`}>
                  <input type="radio" disabled name="bentukObjek" checked={bentukObjek === item} className="accent-blue-950 dark:accent-blue-500 w-4 h-4 cursor-not-allowed" />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Harga Sewa per Tahun:</label>
            <p className="text-sm font-black text-blue-950 dark:text-blue-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
              Rp {hargaSewa?.toLocaleString('id-ID') || 0}
            </p>
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

        {/* === FORM: STATUS JAMINAN BANK === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <img src="/icons/icon-law.svg" alt="Financial" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
              Status Penjaminan Keuangan / Finansial
            </h3>
            
            <button
              type="button"
              onClick={() => handleReplyGroup("Status Penjaminan Keuangan / Finansial")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <img src="/icons/icon-message-now.svg" alt="Reply" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              Reply / Beri Catatan
            </button>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Apakah Lahan/Bangunan Sedang Menjadi Jaminan Bank?</label>
            <div className="flex gap-4">
              {['Tidak', 'Ya'].map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 cursor-not-allowed text-xs font-bold text-gray-500 dark:text-gray-400">
                  <input type="radio" disabled name="isJaminan" value={opt} checked={isJaminan === opt} className="w-4 h-4 accent-blue-950 dark:accent-blue-500 cursor-not-allowed" />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-800">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nama Bank Penjamin</label>
              <input type="text" readOnly value={namaBank} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nomor Surat Bank</label>
              <input type="text" readOnly value={noSuratJaminan} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Tanggal Surat Jaminan</label>
              <input type="date" readOnly value={tanggalSuratJaminan} className="w-full border border-gray-200 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs cursor-not-allowed outline-none text-gray-500 dark:text-gray-400" />
            </div>
            {renderUploadSlot("surat_persetujuan_bank", "Surat Persetujuan Resmi Bank", "Scan dokumen persetujuan agunan bank")}
          </div>
        </div>

        {/* === FORM: DATA TAMBAHAN === */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <img src="/icons/icon-file.svg" alt="Catatan" className="w-4 h-4 object-contain dark:brightness-0 dark:invert" />
              Data Catatan & Pendukung Tambahan
            </h3>
            
            <button
              type="button"
              onClick={() => handleReplyGroup("Data Catatan & Pendukung Tambahan")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <img src="/icons/icon-message-now.svg" alt="Reply" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              Reply / Beri Catatan
            </button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Catatan Tambahan (Textarea)</label>
            <textarea rows={3} readOnly value={catatanLainnya} className="w-full border border-gray-200 dark:border-gray-700 p-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 cursor-not-allowed outline-none text-gray-500 dark:text-gray-400 font-medium whitespace-pre-wrap" />
          </div>
          <div className="pt-2">
            {renderUploadSlot("dokumen_tambahan", "Dokumen Berkas Pendukung Tambahan Lainnya", "Format berkas bebas gabungan")}
          </div>
        </div>

        {/* === NAVIGASI === */}
        <div className="flex justify-between items-center bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <button 
            type="button" 
            onClick={() => router.push(`/admin/assessor/penilaian/ulok-perorangan/detail-penilaian/section1?id=${ulokId}`)} 
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 transition"
          >
            Prev
          </button>
          
          <button 
            type="button"
            onClick={handleSelesaiPenilaian}
            className="bg-blue-950 dark:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-900 dark:hover:bg-blue-500 transition shadow-sm"
          >
            Selesai
          </button>
        </div>

      </div>

      {/* === MODAL: SUKSES === */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.15s_ease-out]">
            <img src="/icons/icon-check.svg" alt="Success" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              {successModalText}
            </p>
          </div>
        </div>
      )}

    </div>
  )
}