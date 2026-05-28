'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, getComments, createComment } from '@/actions/cabang'
import { getCurrentProfile } from '@/actions/auth'
import { supabase } from '@/lib/supabaseClient'
import { updateUlokStatus } from '@/actions/assessor'

export default function DetailPenilaianPeroranganPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id')

  const [isLoading, setIsLoading] = useState(true)
  
  // State untuk data inputan form (Read-Only)
  const [namaLokasi, setNamaLokasi] = useState('')
  const [statusBadan, setStatusBadan] = useState('')
  const [namaPemegang, setNamaPemegang] = useState('')
  const [statusSubmission, setStatusSubmission] = useState('Draft')
  
  // State untuk chat/komentar
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (!ulokId) return
    setIsUpdatingStatus(true)
    const res = await updateUlokStatus(ulokId, newStatus)
    if (res.success) {
      setStatusSubmission(newStatus)
      router.refresh()
    } else {
      alert('Gagal mengubah status: ' + res.error)
    }
    setIsUpdatingStatus(false)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'In Review':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'Revision':
        return 'bg-rose-100 text-rose-800 border-rose-300'
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'Rejected':
        return 'bg-slate-100 text-slate-800 border-slate-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

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

    const fetchDetail = async () => {
      setIsLoading(true)
      const res = await getUlokDetail(ulokId)
      
      if (res.success && res.data) {
        setNamaLokasi(res.data.nama_lokasi || '')
        setStatusBadan(res.data.jenis_badan_hukum || '')
        setNamaPemegang(res.data.nama_pemegang_hak || '')
        setStatusSubmission(res.data.status || 'Draft')
        
        // Fetch comments
        const commentsRes = await getComments(ulokId)
        if (commentsRes.success && commentsRes.data) {
          setComments(commentsRes.data)
        }

        // Fetch user profile
        const profileRes = await getCurrentProfile()
        if (profileRes.success && profileRes.profile) {
          setCurrentProfile(profileRes.profile)
        }
      } else {
        alert('Gagal memuat data: ' + res.error)
        router.push('/admin/assessor/penilaian')
      }
      setIsLoading(false)
    }

    fetchDetail()

    // Realtime subscription untuk chat comments
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

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ulokId || !newComment.trim() || !currentProfile?.id) return

    setIsSending(true)
    const commentText = newComment.trim()
    const res = await createComment(ulokId, currentProfile.id, commentText)
    if (res.success) {
      setNewComment('')
      // Langsung update state local agar instant
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm font-medium">
        Memuat detail usulan...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER & NAVIGASI BALIK */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/admin/assessor/penilaian')}
              className="text-gray-500 hover:text-blue-950 transition bg-white p-2 rounded-full shadow-sm border"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Penilaian Usulan Lokasi (Assessor)</h1>
              <p className="text-xs text-gray-400">ID Berkas: {ulokId}</p>
            </div>
          </div>
          
          {/* TOMBOL UNTUK MULAI PENILAIAN CHECKLIST */}
          <div>
            <button
              onClick={() => router.push(`/admin/assessor/penilaian/ulok-perorangan/detail-penilaian/section1?id=${ulokId}`)}
              className="bg-blue-950 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-900 transition shadow-sm flex items-center gap-2"
            >
              🔎 Mulai Penilaian Berkas / Dokumen
            </button>
          </div>
        </div>

        {/* 1. PANEL FORM DATA UTAMA (READ-ONLY) */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3">
            <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <span>📍</span> Informasi Usulan Kelompok Perorangan (Read-Only)
            </h2>
            
            {/* MANAJEMEN STATUS DROPDOWN */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Ubah Status:</span>
              <select
                value={statusSubmission}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdatingStatus}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition shadow-sm outline-none cursor-pointer ${getStatusStyle(statusSubmission)}`}
              >
                {statusSubmission === 'In Review' && (
                  <option value="In Review" disabled>In Review</option>
                )}
                <option value="Revision">Revision</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Nama Lokasi</label>
              <input 
                type="text"
                value={namaLokasi}
                readOnly
                className="w-full border p-2.5 rounded-lg text-sm bg-gray-50 cursor-not-allowed font-medium text-gray-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Nama Pemegang Hak</label>
              <input 
                type="text"
                value={namaPemegang}
                readOnly
                className="w-full border p-2.5 rounded-lg text-sm bg-gray-50 cursor-not-allowed font-medium text-gray-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1">Status Kepemilikan (Khusus Perorangan)</label>
              <input 
                type="text"
                value={statusBadan}
                readOnly
                className="w-full border p-2.5 rounded-lg text-sm bg-gray-50 cursor-not-allowed font-medium text-gray-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. PANEL KOLOM KOMENTAR / CHAT ACTIVE */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gray-50 border-b p-4 flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h2 className="font-bold text-gray-800 text-sm">Kolom Komentar / Pesan Hubungan ke Cabang</h2>
          </div>
          
          <div className="p-6 bg-gray-50/50 min-h-50 flex flex-col justify-between">
            {/* List Pesan */}
            {comments.length === 0 ? (
              <div className="text-center my-auto py-6 flex flex-col items-center justify-center text-gray-400 text-sm">
                <span className="text-3xl mb-2 opacity-40">✉️</span>
                <p className="font-medium">Belum ada komentar atau pesan dari/ke cabang.</p>
                <p className="text-xs text-gray-400 mt-0.5">Kirim pesan di bawah untuk memberikan catatan review ke cabang.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4 max-h-100 overflow-y-auto pr-1">
                {comments.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border shadow-sm max-w-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-blue-950 bg-blue-50 px-2 py-0.5 rounded">
                        {item.profiles?.full_name || 'Anonim'} ({item.profiles?.role || 'User'})
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(item.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium whitespace-pre-line">{item.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Kotak Input Chat */}
            <form onSubmit={handleSendComment} className="mt-4 pt-4 border-t flex gap-2">
              <input 
                type="text" 
                placeholder="Tulis pesan atau instruksi revisi ke cabang..." 
                className="w-full border p-2.5 rounded-lg text-sm bg-white focus:outline-blue-950 text-gray-700"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSending}
              />
              <button 
                type="submit"
                className="bg-blue-950 hover:bg-blue-900 text-white px-5 rounded-lg text-xs font-bold transition disabled:opacity-50"
                disabled={isSending || !newComment.trim()}
              >
                {isSending ? 'Mengirim...' : 'Kirim'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
