'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getComments, createComment } from '@/actions/cabang'
import { getCurrentProfile } from '@/actions/auth'
import { supabase } from '@/lib/supabaseClient'

export default function DetailUlokPeroranganPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id')
  const [isPending, startTransition] = useTransition()

  const [isLoading, setIsLoading] = useState(true)
  
  const [namaLokasi, setNamaLokasi] = useState('')
  const [statusBadan, setStatusBadan] = useState('')
  const [namaPemegang, setNamaPemegang] = useState('')
  const [statusSubmission, setStatusSubmission] = useState('Draft')
  
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
      .channel(`comments-ulok-po-${ulokId}`)
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
        
        {/* === BREADCRUMB === */}
        <nav className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 select-none mb-10 uppercase tracking-wider">
          <span 
            onClick={() => router.push('/admin/cabang/usulan-lokasi')} 
            className="cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition"
          >
            Usulan Lokasi
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-800 dark:text-gray-200 font-extrabold">Form Perorangan</span>
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
          
          {/* === ACTION BUTTONS === */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => router.push(`/admin/cabang/usulan-lokasi/form/perorangan/section1?id=${ulokId}`)}
              className="bg-[#142B4D] dark:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-blue-900 dark:hover:bg-slate-700 transition shadow-xs flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
            >
              <img 
                src="/icons/icon-form.svg" 
                alt="Form Icon" 
                className="w-4 h-4 object-contain brightness-0 invert" 
              />
              Form
            </button>

            <button
              form="form-perorangan"
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

        {/* === FORM: PERORANGAN UTAMA === */}
        <form 
          id="form-perorangan" 
          onSubmit={handleUpdateDetail} 
          className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800/80 p-6 space-y-5 transition-colors duration-300"
        >
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3.5">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base flex items-center gap-2.5 tracking-tight">
              <img 
                src="/icons/icon-perorangan.svg" 
                alt="Perorangan Icon" 
                className="w-5 h-5 object-contain dark:brightness-0 dark:invert" 
              />
              Informasi Usulan Kelompok Perorangan
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
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status Kepemilikan (Khusus Perorangan)</label>
              <select 
                value={statusBadan} 
                onChange={(e) => handleStatusBadanChange(e.target.value)}
                disabled={isPending}
                className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-950 focus:outline-blue-950 dark:focus:outline-blue-500 font-medium text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-60"
                required
              >
                <option value="Perorangan">Perorangan</option>
                <option value="Waris">Waris / Ahli Waris</option>
                <option value="Hibah">Hibah</option>
                <option value="Kuasa">Kuasa / Penerima Kuasa</option>
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