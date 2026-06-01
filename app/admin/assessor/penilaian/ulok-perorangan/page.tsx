'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, getComments, createComment } from '@/actions/cabang'
import { getCurrentProfile } from '@/actions/auth'
import { updateUlokStatus } from '@/actions/assessor'
import { supabase } from '@/lib/supabaseClient'

export default function DetailPenilaianPeroranganPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id')
  const [isPending, startTransition] = useTransition()

  const [isLoading, setIsLoading] = useState(true)
  
  // State data usulan (Read-Only untuk Assessor)
  const [namaLokasi, setNamaLokasi] = useState('')
  const [statusBadan, setStatusBadan] = useState('')
  const [namaPemegang, setNamaPemegang] = useState('')
  const [statusSubmission, setStatusSubmission] = useState('Draft')
  
  // State toast modal sukses & text dinamis
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // State chat/komentar
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Fungsi penentu warna badge status dokumen usulan
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'In Review':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60'
      case 'Revision':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60'
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
      case 'Rejected':
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800'
    }
  }

  // Handle otomatis jika ada parameter text feedback dari halaman section penilaian
  useEffect(() => {
    const prefill = searchParams.get('prefill')
    if (prefill) {
      setNewComment(prefill)
    }
  }, [searchParams])

  useEffect(() => {
    if (!ulokId) {
      router.push('/admin/assessor/penilaian')
      return
    }

    // Ambil user ID client session sebagai garda utama pencocokan id chat
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
        
        // Fetch data komentar
        const commentsRes = await getComments(ulokId)
        if (commentsRes.success && commentsRes.data) {
          setComments(commentsRes.data)
        }

        // Fetch user profile penilai saat ini
        const profileRes = await getCurrentProfile()
        if (profileRes.success && profileRes.profile) {
          setCurrentProfile(profileRes.profile)
        }
      } else {
        alert('Gagal memuat data usulan: ' + res.error)
        router.push('/admin/assessor/penilaian')
      }
      setIsLoading(false)
    }

    fetchDetail()

    // Realtime channel listener khusus dokumen usulan terkait Perorangan
    const channel = supabase
      .channel(`comments-ulok-po-assessor-${ulokId}`)
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

  // Fungsi pengiriman catatan revisi / komentar baru oleh Assessor
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
      alert('Gagal mengirim feedback catatan: ' + res.error)
    }
    setIsSending(false)
  }

  // Fungsi perubahan status berkas usulan langsung dari dropdown Assessor
  const handleStatusChange = async (newStatus: string) => {
    if (!ulokId) return
    setStatusSubmission(newStatus)

    startTransition(async () => {
      const res = await updateUlokStatus(ulokId, newStatus)
      if (res.success) {
        setSuccessMessage('Status usulan lokasi berhasil diperbarui!')
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 1500)
      } else {
        alert('Gagal mengubah status berkas: ' + res.error)
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
        
        {/* BREADCRUMB NAVIGATION */}
        <nav className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 select-none mb-10 uppercase tracking-wider">
          <span 
            onClick={() => router.push('/admin/assessor/penilaian')} 
            className="cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition"
          >
            Penilaian Usulan
          </span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-800 dark:text-gray-200 font-extrabold">Detail Usulan Perorangan</span>
        </nav>

        {/* HEADER & NAVIGASI BALIK */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/admin/assessor/penilaian')}
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
          
          {/* ACTION NAVIGATION BUTTON KE HALAMAN PENILAIAN DOKUMEN */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => router.push(`/admin/assessor/penilaian/ulok-perorangan/detail-penilaian/section1?id=${ulokId}`)}
              className="w-full sm:w-auto bg-[#142B4D] dark:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-blue-900 dark:hover:bg-slate-700 transition shadow-xs flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
            >
              <img 
                src="/icons/icon-form.svg" 
                alt="Penilaian" 
                className="w-4 h-4 object-contain brightness-0 invert" 
              />
              Lihat Berkas
            </button>
          </div>
        </div>

        {/* 1. PANEL FORM DATA UTAMA (READ-ONLY FOR ASSESSOR) */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800/80 p-6 space-y-5 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-3.5">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base flex items-center gap-2.5 tracking-tight">
              <img 
                src="/icons/icon-perorangan.svg" 
                alt="Law" 
                className="w-5 h-5 object-contain dark:brightness-0 dark:invert" 
              />
              Informasi Usulan Kelompok Badan Hukum
            </h2>
            
            {/* MANAJEMEN STATUS DROP DOWN BAGI ASSESSOR (HANYA REVISION, APPROVED, REJECTED) */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status:</span>
              <select
                value={statusSubmission}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isPending}
                className={`px-5 py-3 rounded-lg text-xs font-bold border transition shadow-xs outline-none cursor-pointer ${getStatusStyle(statusSubmission)} disabled:opacity-60`}
              >
                {/* Jika status saat ini dari db adalah Draft atau In Review, tampilkan sebagai opsi disabled agar alur logika SAW tidak rusak */}
                {(statusSubmission === 'Draft' || statusSubmission === 'In Review') && (
                  <option value={statusSubmission} disabled>{statusSubmission === 'Draft' ? 'Draft (Belum Direview)' : 'In Review'}</option>
                )}
                <option value="Revision">Revision</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Nama Lokasi</label>
              <input 
                type="text"
                value={namaLokasi}
                readOnly
                disabled
                className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-gray-50/50 dark:bg-gray-950/40 text-gray-400 dark:text-gray-500 font-semibold cursor-not-allowed outline-none select-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Nama Pemegang Hak</label>
              <input 
                type="text"
                value={namaPemegang}
                readOnly
                disabled
                className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-gray-50/50 dark:bg-gray-950/40 text-gray-400 dark:text-gray-500 font-semibold cursor-not-allowed outline-none select-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status Kepemilikan (Khusus Perorangan)</label>
              <input 
                type="text"
                value={statusBadan}
                readOnly
                disabled
                className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-gray-50/50 dark:bg-gray-950/40 text-gray-400 dark:text-gray-500 font-semibold cursor-not-allowed outline-none select-none"
              />
            </div>
          </div>
        </div>

        {/* 2. PANEL KOLOM KOMENTAR / CHAT ASSESSOR */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800/80 overflow-hidden transition-colors duration-300">
          <div className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center gap-2.5">
            <img 
              src="/icons/icon-comment-2.svg" 
              alt="Comment" 
              className="w-4 h-4 object-contain dark:brightness-0 dark:invert" 
            />
            <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm tracking-tight">Kolom Komentar / Pesan Hubungan ke Cabang</h2>
          </div>
          
          <div className="p-4 md:p-6 bg-gray-50/30 dark:bg-gray-950/20 min-h-[300px] flex flex-col justify-between">
            {/* List Pesan */}
            {comments.length === 0 ? (
              <div className="text-center my-auto py-12 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                <span className="text-3xl mb-2 opacity-50">✉️</span>
                <p className="font-bold">Belum ada komentar atau pesan dari/ke cabang.</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Kirim pesan di bawah untuk memberikan catatan review ke cabang.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-2 flex flex-col">
                {comments.map((item) => {
                  // Cek validitas berlapis pencocokan id/role agar Anda (Assessor) selalu di KANAN, Admin Cabang di KIRI
                  const isSelf = 
                    (currentUserId && (item.user_id === currentUserId || item.profiles?.id === currentUserId)) || 
                    (currentProfile?.id && (item.user_id === currentProfile.id || item.profiles?.id === currentProfile.id)) ||
                    (currentProfile?.full_name && item.profiles?.full_name === currentProfile.full_name) ||
                    (item.profiles?.role?.toUpperCase() === 'ASSESSOR')

                  const isComplaint = item.message?.includes('[Catatan Assessor - Grup:')

                  return (
                    // PENYESUAIAN UTAMA: Menggunakan w-full & justify-end untuk mendorong balon chat penilai ke kanan layar
                    <div 
                      key={item.id} 
                      className={`flex w-full ${isSelf ? 'justify-end' : 'justify-start'}`}
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
                        {/* Header info identitas pengirim */}
                        <div className={`flex items-center justify-between gap-6 mb-2 text-[10px] uppercase font-bold border-b pb-1.5 ${
                          isSelf 
                            ? 'border-white/10 text-blue-200' 
                            : isComplaint 
                              ? 'border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400' 
                              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          <span className="flex items-center gap-1">
                            {!isSelf && isComplaint && <span>⚠️ REVISI PENTING</span>}
                            <span>{isSelf ? 'Anda (Assessor)' : `${item.profiles?.full_name || 'Admin Cabang'} (${item.profiles?.role || 'User'})`}</span>
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

                        {/* Teks Isi Komentar / Catatan */}
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

            {/* Kotak Input Chat Catatan Revisi */}
            <form onSubmit={handleSendComment} className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-2.5 items-center">
              <input 
                type="text" 
                placeholder="Tulis pesan atau instruksi revisi ke cabang..." 
                className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-xs md:text-sm bg-white dark:bg-gray-950 focus:outline-blue-950 dark:focus:outline-blue-500 font-medium text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSending}
              />
              <button 
                type="submit"
                className="bg-[#142B4D] dark:bg-slate-800 hover:bg-blue-900 dark:hover:bg-slate-700 text-white p-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center shrink-0 active:scale-95 shadow-xs"
                disabled={isSending || !newComment.trim()}
                title="Kirim Catatan"
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

      {/* TOAST CUSTOM MODAL (NOTIFIKASI SUKSES UPDATE STATUS BERKAS) */}
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