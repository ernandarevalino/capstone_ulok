'use client'

import React, { useEffect, useState, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getComments, createComment, getUploadedDocuments, getChecklistMaster, getLastUploaderName, uploadUlokFile } from '@/actions/cabang'
import { getCurrentProfile } from '@/actions/auth'
import { supabase } from '@/lib/supabaseClient'
import DocumentChecklistPanel from '@/components/shared/DocumentChecklistPanel'
import { getChecklistMasterIds, getEffectiveChecklistId } from '@/utils/progress'
import UlokSummaryCard from '@/components/shared/UlokSummaryCard'

const mapDocNameToType = (docName: string, jenisBadanHukum: string): string | null => {
  if (['PT', 'Yayasan', 'Koperasi'].includes(jenisBadanHukum)) {
    switch (docName) {
      case 'E-KTP (yang mewakili)':
        return 'ektp_mewakili'
      case 'Akta Pendirian & SK Menteri':
        return 'akta_pendirian'
      case 'Akta Penyesuaian dengan UU No. 40 Tahun 2007 & SK Menteri':
        return 'akta_penyesuaian'
      case 'Anggaran Dasar Terbaru & SK Menteri':
        return 'anggaran_dasar'
      case 'Akta susunan Direksi & Komisaris terakhir & SK Menteri':
        return 'akta_direksi_komisaris'
      case 'Akta susunan Pengurus terakhir & SK Menteri':
        return 'akta_pengurus'
      case 'NIB OSS RBA':
        return 'nib_oss'
      case 'NPWP':
        return 'npwp_badan'
      case 'Surat Pengukuhan Pengusaha Kena Pajak (Apabila PKP) / Surat Pernyataan (Apabila Non-PKP)':
        return 'sppkp'
      case 'E-KTP Direksi/Pengurus':
        return 'ektp_direksi'
      case 'Akta Kuasa Notariil/Legalisasi (Jika Dikuasakan)':
        return 'akta_kuasa'
      case 'Surat Persetujuan Dewan Komisaris/RUPS (PT) (Apabila diperlukan)':
        return 'rups_persetujuan'
      case 'Sertifikat Tanah (Hak Milik / HGB / Hak Pakai)':
        return 'sertifikat_tanah'
      case 'Akta Jual Beli (AJB) / Girik / Letter C (Jika Belum Sertifikat)':
        return 'ajb_girik'
      case 'Surat Pemberitahuan Pajak Terutang (SPPT PBB) Terbaru':
        return 'sppt_pbb'
      case 'Izin Mendirikan Bangunan (IMB) / Persetujuan Bangunan Gedung (PBG)':
        return 'imb_pbg'
      case 'Sertifikat Laik Fungsi (SLF)':
        return 'slf'
      default:
        return null
    }
  } else {
    switch (docName) {
      case 'E-KTP':
        return 'ektp'
      case 'KITAS/KITAP':
        return 'kitas_kitap'
      case 'NPWP':
        return 'npwp'
      case 'PKP/SPPKP / Non PKP/Surat Pernyataan':
        return 'pkp_sppkp'
      case 'Kartu Keluarga':
        return 'kartu_keluarga'
      case 'Buku Nikah/Akta Perkawinan':
        return 'buku_nikah'
      case 'Surat Persetujuan Suami/Istri':
        return 'persetujuan_pasangan'
      case 'Surat Penetapan Ganti Nama (Apabila Ganti Nama)':
        return 'dokumen_ganti_nama'
      case 'Akta Cerai (Apabila Cerai)':
        return 'akta_cerai'
      case 'Sertifikat Tanah (Hak Milik / HGB / Hak Pakai)':
        return 'sertifikat_tanah'
      case 'Akta Jual Beli (AJB) / Girik / Letter C (Jika Belum Sertifikat)':
        return 'ajb_girik'
      case 'Surat Pemberitahuan Pajak Terutang (SPPT PBB) Terbaru':
        return 'sppt_pbb'
      case 'Izin Mendirikan Bangunan (IMB) / Persetujuan Bangunan Gedung (PBG)':
        return 'imb_pbg'
      case 'Sertifikat Laik Fungsi (SLF)':
        return 'slf'
      case 'Akta Kuasa Notariil/Legalisasi (Jika Dikuasakan)':
        return 'akta_kuasa'
      case 'KTP Penerima Kuasa (Jika dikuasakan)':
        return 'ktp_kuasa'
      case 'Akta Waris/Surat Keterangan Waris (Jika Waris)':
        return 'akta_waris'
      case 'Surat Keterangan Kematian (Jika Waris)':
        return 'surat_kematian'
      case 'KTP Ahli Waris (Jika Waris)':
        return 'ktp_ahli_waris'
      case 'KK Ahli Waris (Jika Waris)':
        return 'kk_ahli_waris'
      case 'Akta Hibah (Jika Hibah)':
        return 'akta_hibah'
      default:
        return null
    }
  }
}

export default function DetailUlokBadanHukumPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id')
  const [isPending, startTransition] = useTransition()

  const [isLoading, setIsLoading] = useState(true)
  
  const [namaLokasi, setNamaLokasi] = useState('')
  const [statusBadan, setStatusBadan] = useState('')
  const [namaPemegang, setNamaPemegang] = useState('')
  const [statusSubmission, setStatusSubmission] = useState('Draft')
  const [namaPengusul, setNamaPengusul] = useState('')
  const [namaCabang, setNamaCabang] = useState('')
  
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [lastReviewedAt, setLastReviewedAt] = useState<string | null>(null)

  const formatLastReviewedDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Belum pernah direview'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return 'Belum pernah direview'
      const pad = (num: number) => String(num).padStart(2, '0')
      const day = pad(date.getDate())
      const month = pad(date.getMonth() + 1)
      const year = String(date.getFullYear()).slice(-2)
      const hours = pad(date.getHours())
      const minutes = pad(date.getMinutes())
      const seconds = pad(date.getSeconds())
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
    } catch (e) {
      return 'Belum pernah direview'
    }
  }

  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [checklistItems, setChecklistItems] = useState<any[]>([])
  const [checklistLoading, setChecklistLoading] = useState(true)
  const [percentage, setPercentage] = useState(0)
  const [numerator, setNumerator] = useState(0)
  const [denominator, setDenominator] = useState(0)
  const [lastUploaderName, setLastUploaderName] = useState<string | null>(null)
  const [uploadingDocName, setUploadingDocName] = useState<string | null>(null)

  const fetchChecklistData = useCallback(async () => {
    if (!ulokId) return
    setChecklistLoading(true)
    try {
      const [docsRes, masterRes, uploaderRes] = await Promise.all([
        getUploadedDocuments(ulokId),
        getChecklistMaster(statusBadan || 'PT'),
        getLastUploaderName(ulokId)
      ])

      if (docsRes.success && masterRes.success) {
        const docs = docsRes.data || []
        const master = masterRes.data || []
        
        const submissionMock = {
          jenis_badan_hukum: statusBadan || 'PT',
        }
        
        const checklistMasterIds = getChecklistMasterIds(submissionMock, docs)
        const denom = checklistMasterIds.length

        const uniqueUploadedIds = new Set<number>()
        for (const doc of docs) {
          const effectiveId = getEffectiveChecklistId(doc, submissionMock.jenis_badan_hukum)
          if (effectiveId !== null && checklistMasterIds.includes(effectiveId)) {
            uniqueUploadedIds.add(effectiveId)
          }
        }

        const num = uniqueUploadedIds.size
        const pct = denom > 0 ? parseFloat(((num / denom) * 100).toFixed(2)) : 0

        const filteredChecklist = (master || [])
          .filter((cm: any) => cm.jenis_badan_hukum === submissionMock.jenis_badan_hukum && checklistMasterIds.includes(cm.id))
          .sort((a: any, b: any) => a.id - b.id)

        const items = filteredChecklist.map((cm: any) => {
          const doc = docs.find((d: any) => {
            if (d.checklist_id === cm.id) return true
            const effectiveId = getEffectiveChecklistId(d, submissionMock.jenis_badan_hukum)
            return effectiveId === cm.id
          })
          return {
            nama_dokumen: cm.nama_dokumen,
            is_uploaded: !!(doc && doc.file_url),
            file_url: doc?.file_url || undefined,
            is_negotiable: !!cm.is_negotiable,
            is_verified: doc ? !!doc.is_verified : false
          }
        })

        setNumerator(num)
        setDenominator(denom)
        setPercentage(pct)
        setChecklistItems(items)
      }

      if (uploaderRes.success) {
        setLastUploaderName(uploaderRes.data)
      }
    } catch (err) {
      console.error('Error fetching checklist data:', err)
    } finally {
      setChecklistLoading(false)
    }
  }, [ulokId, statusBadan])

  useEffect(() => {
    fetchChecklistData()
  }, [fetchChecklistData])

  const handleQuickUpload = async (docName: string, file: File) => {
    if (!ulokId) return
    const docType = mapDocNameToType(docName, statusBadan || 'PT')
    if (!docType) {
      alert(`Format nama dokumen "${docName}" tidak dikenali untuk diunggah.`)
      return
    }

    setUploadingDocName(docName)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadUlokFile(ulokId, docType, formData)
      if (res.success) {
        setSuccessMessage('Berkas berhasil diperbarui!')
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 1500)
        await fetchChecklistData()
        router.refresh()
      } else {
        alert('Gagal mengunggah berkas: ' + res.error)
      }
    } catch (error: any) {
      alert('Terjadi kesalahan saat mengunggah: ' + error.message)
    } finally {
      setUploadingDocName(null)
    }
  }

  useEffect(() => {
    if (!ulokId) {
      router.push('/admin/cabang/usulan-lokasi')
      return
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id)
      }
    })

    const fetchDetail = async () => {
      setIsLoading(true)
      const res = await getUlokDetail(ulokId)
      
      if (res.success && res.data) {
        setNamaLokasi(res.data.nama_lokasi || '')
        setStatusBadan(res.data.jenis_badan_hukum || '')
        setNamaPemegang(res.data.nama_pemegang_hak || '')
        setStatusSubmission(res.data.status || 'Draft')
        setLastReviewedAt(res.data.last_reviewed_at || null)
        setNamaPengusul(res.data.profiles?.full_name || 'Pengusul Tidak Diketahui')
        setNamaCabang(res.data.profiles?.branches?.nama_cabang || 'Cabang Tidak Diketahui')
        
        const commentsRes = await getComments(ulokId)
        if (commentsRes.success && commentsRes.data) {
          setComments(commentsRes.data)
        }

        const profileRes = await getCurrentProfile()
        if (profileRes.success && profileRes.profile) {
          setCurrentProfile(profileRes.profile)
        }
      } else {
        alert('Gagal memuat data: ' + res.error)
        router.push('/admin/cabang/usulan-lokasi')
      }
      setIsLoading(false)
    }

    fetchDetail()

    const channel = supabase
      .channel(`comments-ulok-bh-${ulokId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `ulok_id=eq.${ulokId}`,
        },
        async () => {
          const commentsRes = await getComments(ulokId)
          if (commentsRes.success && commentsRes.data) {
            setComments(commentsRes.data)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ulokId, router])

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const activeId = currentUserId || currentProfile?.id
    if (!ulokId || !newComment.trim() || !activeId) return

    setIsSending(true)
    const commentText = newComment.trim()
    const res = await createComment(ulokId, activeId, commentText)
    if (res.success) {
      setNewComment('')
      const commentsRes = await getComments(ulokId)
      if (commentsRes.success && commentsRes.data) {
        setComments(commentsRes.data)
      }
      router.refresh()
    } else {
      alert('Gagal mengirim komentar: ' + res.error)
    }
    setIsSending(false)
  }

  const handleUpdateDetail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ulokId || !namaLokasi || !statusBadan || !namaPemegang) return

    startTransition(async () => {
      const res = await updateUlokSubmission(ulokId, {
        nama_lokasi: namaLokasi,
        jenis_badan_hukum: statusBadan,
        nama_pemegang_hak: namaPemegang
      })

      if (res.success) {
        setSuccessMessage('Data awal usulan berhasil diperbarui!')
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 1500)
      } else {
        alert('Gagal memperbarui data: ' + res.error)
      }
    })
  }

  const handleStatusBadanChange = async (newStatus: string) => {
    setStatusBadan(newStatus)
    if (!ulokId) return

    startTransition(async () => {
      const res = await updateUlokSubmission(ulokId, {
        nama_lokasi: namaLokasi,
        jenis_badan_hukum: newStatus,
        nama_pemegang_hak: namaPemegang
      })

      if (res.success) {
        setSuccessMessage('Status kepemilikan berhasil diubah!')
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 1500)
      } else {
        alert('Gagal memperbarui status kepemilikan: ' + res.error)
      }
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-400 dark:text-gray-500 italic text-sm font-medium transition-colors duration-300">
        <div className="w-6 h-6 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        Memuat detail usulan...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* === BREADCRUMB NAVIGATION === */}
        <nav className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 select-none mb-10 uppercase tracking-wider">
          <span 
            onClick={() => router.push('/admin/cabang/usulan-lokasi')} 
            className="cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition"
          >
            Usulan Lokasi
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-800 dark:text-gray-200 font-extrabold">Form Badan Hukum</span>
        </nav>

        {/* === HEADER PANEL === */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-gray-200 dark:border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/admin/cabang/usulan-lokasi')}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 transition bg-white dark:bg-gray-900 p-2.5 rounded-full shadow-xs border border-gray-200 dark:border-gray-800 active:scale-90 flex items-center justify-center"
              title="Kembali"
            >
              <img 
                src="/icons/icon-back.svg" 
                alt="Kembali" 
                className="w-6 h-6 object-contain dark:brightness-0 dark:invert" 
              />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Data Usulan Lokasi (ULOK)</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-0.5">ID Berkas: {ulokId}</p>
            </div>
          </div>
          
          {/* === GRUP ACTION BUTTONS === */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => router.push(`/admin/cabang/usulan-lokasi/form/badanhukum/section1?id=${ulokId}`)}
              className="w-full sm:w-auto bg-[#142B4D] dark:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-blue-900 dark:hover:bg-slate-700 transition shadow-xs flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
            >
              <img 
                src="/icons/icon-form.svg" 
                alt="Form Icon" 
                className="w-4 h-4 object-contain brightness-0 invert" 
              />
              Form
            </button>

            <button
              form="form-badan-hukum"
              type="submit"
              disabled={isPending}
              className="bg-[#142B4D] dark:bg-slate-800 text-white p-2.5 h-[38px] w-[38px] md:h-[40px] md:w-[40px] rounded-xl hover:bg-emerald-600 dark:hover:bg-emerald-600 transition shadow-xs flex items-center justify-center active:scale-95 disabled:opacity-50 shrink-0"
              title={isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <img 
                  src="/icons/icon-check-2.svg" 
                  alt="Save Icon" 
                  className="w-4 h-4 md:w-5 md:h-5 object-contain brightness-0 invert" 
                />
              )}
            </button>
          </div>
        </div>

        <UlokSummaryCard
          namaLokasi={namaLokasi}
          namaCabang={namaCabang}
          namaPengusul={namaPengusul}
          jenisKepemilikan={statusBadan || 'PT'}
          status={statusSubmission}
          totalDokumen={checklistItems.length}
          dokumenTerunggah={checklistItems.filter((item) => item.is_uploaded).length}
          dokumenSesuai={checklistItems.filter((item) => item.is_verified).length}
          dokumenBelumSesuai={checklistItems.filter((item) => item.is_uploaded && !item.is_verified).length}
        />

        {/* === PANEL FORM DATA UTAMA === */}
        <form 
          id="form-badan-hukum"
          onSubmit={handleUpdateDetail} 
          className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800/80 p-6 space-y-5 transition-colors duration-300"
        >
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3.5">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base flex items-center gap-2.5 tracking-tight">
              <img 
                src="/icons/icon-law.svg" 
                alt="Law Icon" 
                className="w-5 h-5 object-contain dark:brightness-0 dark:invert" 
              />
              Informasi Usulan Kelompok Badan Hukum
            </h2>
            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {statusSubmission === 'Draft' ? 'Belum Direview' : statusSubmission}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Nama Lokasi</label>
              <input 
                type="text"
                value={namaLokasi}
                onChange={(e) => setNamaLokasi(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-950 focus:outline-blue-950 dark:focus:outline-blue-500 font-medium text-gray-700 dark:text-gray-200 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Nama Pemegang Hak</label>
              <input 
                type="text"
                value={namaPemegang}
                onChange={(e) => setNamaPemegang(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-950 focus:outline-blue-950 dark:focus:outline-blue-500 font-medium text-gray-700 dark:text-gray-200 transition-colors"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status Kepemilikan (Khusus Badan Hukum)</label>
              <select 
                value={statusBadan} 
                onChange={(e) => handleStatusBadanChange(e.target.value)}
                disabled={isPending}
                className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-950 focus:outline-blue-950 dark:focus:outline-blue-500 font-medium text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-60"
                required
              >
                <option value="PT">PT (Perseroan Terbatas)</option>
                <option value="Yayasan">Yayasan</option>
                <option value="Koperasi">Koperasi</option>
              </select>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 font-bold">
                {lastReviewedAt ? `Terakhir direview pada (${formatLastReviewedDate(lastReviewedAt)})` : 'Belum pernah direview'}
              </p>
            </div>
          </div>
        </form>

        {/* === PANEL KOMENTAR === */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800/80 overflow-hidden transition-colors duration-300">
          <div className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center gap-2.5">
            <img 
              src="/icons/icon-comment-2.svg" 
              alt="Comment Icon" 
              className="w-4 h-4 object-contain dark:brightness-0 dark:invert" 
            />
            <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm tracking-tight">Kolom Komentar / Pesan Assessor</h2>
          </div>
          
          <div className="p-4 md:p-6 bg-gray-50/30 dark:bg-gray-950/20 min-h-[300px] flex flex-col justify-between">
            {comments.length === 0 ? (
              <div className="text-center my-auto py-12 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                <span className="text-3xl mb-2 opacity-50">✉️</span>
                <p className="font-bold">Belum ada komentar atau pesan dari assessor.</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Seluruh feedback peninjauan berkas akan tampil di sini.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-2 flex flex-col">
                {comments.map((item) => {
                  const isSelf = 
                    (currentUserId && (item.profile_id === currentUserId || item.profiles?.id === currentUserId)) || 
                    (currentProfile?.id && (item.profile_id === currentProfile.id || item.profiles?.id === currentProfile.id)) ||
                    (currentProfile?.full_name && item.profiles?.full_name === currentProfile.full_name)

                  const isComplaint = item.message?.includes('[Catatan Assessor - Grup:')

                  return (
                    <div 
                      key={item.id} 
                      className={`flex w-full flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div 
                        className={`p-4 rounded-2xl border shadow-xs max-w-xl transition-all duration-300 leading-relaxed relative ${
                          isSelf 
                            ? 'bg-[#142B4D] dark:bg-slate-800 border-transparent text-white rounded-tr-none' 
                            : isComplaint 
                              ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-900/60 text-gray-800 dark:text-gray-100 rounded-tl-none' 
                              : 'bg-gray-100 border-gray-200 dark:bg-gray-800/60 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'
                        }`}
                      >
                        <div className={`flex items-center justify-between gap-6 mb-2 text-[10px] uppercase font-bold border-b pb-1.5 ${
                          isSelf 
                            ? 'border-white/10 text-blue-200' 
                            : isComplaint 
                              ? 'border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400' 
                              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          <span className="flex items-center gap-1">
                            {!isSelf && isComplaint && <span>⚠️ REVISI PENTING</span>}
                            <span>{isSelf ? 'Anda (Admin Cabang)' : `${item.profiles?.full_name || 'Assessor'} (${item.profiles?.role || 'User'})`}</span>
                          </span>
                          <span className={isSelf ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}>
                            {new Date(item.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex items-start gap-1.5">
                          {!isSelf && isComplaint && <span className="text-sm shrink-0 mt-0.5 select-none">⚠️</span>}
                          <p className="text-xs md:text-sm font-semibold whitespace-pre-line break-words">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <form onSubmit={handleSendComment} className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-2.5 items-center">
              <input 
                type="text" 
                placeholder="Tulis pesan balasan ke assessor jika diperlukan..." 
                className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-xs md:text-sm bg-white dark:bg-gray-950 focus:outline-blue-950 dark:focus:outline-blue-500 font-medium text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSending}
              />
              <button 
                type="submit"
                className="bg-[#142B4D] dark:bg-slate-800 hover:bg-blue-900 dark:hover:bg-slate-700 text-white p-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center shrink-0 active:scale-95 shadow-xs"
                disabled={isSending || !newComment.trim()}
                title="Kirim Pesan"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <img 
                    src="/icons/icon-send.svg" 
                    alt="Send" 
                    className="w-4 h-4 object-contain brightness-0 invert" 
                  />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* === PANEL CHECKLIST DOKUMEN === */}
        {checklistLoading ? (
          <div className="py-8 text-center text-gray-400 italic flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-800 dark:border-slate-800 dark:border-t-slate-200"></div>
            <span className="text-xs">Memuat status checklist dokumen...</span>
          </div>
        ) : (
          <DocumentChecklistPanel
            percentage={percentage}
            numerator={numerator}
            denominator={denominator}
            jenisBadanHukum={statusBadan || 'PT'}
            checklistItems={checklistItems}
            lastUploaderName={lastUploaderName}
            onUpload={handleQuickUpload}
            isUploadingDocName={uploadingDocName}
          />
        )}

      </div>

      {/* === MODAL: SUKSES === */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <img src="/icons/icon-check.svg" alt="Success" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}