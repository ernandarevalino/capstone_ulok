'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUlokDetail, updateUlokSubmission, getComments, createComment } from '@/actions/cabang'
import { getCurrentProfile } from '@/actions/auth'
import { supabase } from '@/lib/supabaseClient'

export default function DetailUlokBadanHukumPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ulokId = searchParams.get('id')
  const [isPending, startTransition] = useTransition()

  const [isLoading, setIsLoading] = useState(true)
  
  // State untuk data inputan form (Bisa diedit)
  const [namaLokasi, setNamaLokasi] = useState('')
  const [statusBadan, setStatusBadan] = useState('')
  const [namaPemegang, setNamaPemegang] = useState('')
  const [statusSubmission, setStatusSubmission] = useState('Draft')
  
  // State untuk chat/komentar dari assessor
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<any>(null)

  useEffect(() => {
    if (!ulokId) {
      router.push('/admin/cabang/usulan-lokasi')
      return
    }

    const fetchDetail = async () => {
      setIsLoading(true)
      const res = await getUlokDetail(ulokId)
      
      if (res.success && res.data) {
        // Set state data form penyesuaian inputan dari modal awal
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
        router.push('/admin/cabang/usulan-lokasi')
      }
      setIsLoading(false)
    }

    fetchDetail()

    // Realtime subscription untuk chat comments
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

  // Handle update perubahan data awal (Nama Lokasi, Pemegang Hak, Status Kelompok)
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
        alert('Data awal usulan berhasil diperbarui!')
      } else {
        alert('Gagal memperbarui data: ' + res.error)
      }
    })
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
              onClick={() => router.push('/admin/cabang/usulan-lokasi')}
              className="text-gray-500 hover:text-blue-950 transition bg-white p-2 rounded-full shadow-sm border"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Data Usulan Lokasi (ULOK)</h1>
              <p className="text-xs text-gray-400">ID Berkas: {ulokId}</p>
            </div>
          </div>
          
          {/* SATU TOMBOL UTAMA TUNGBAL UNTUK MASUK KE RANGKAIAN FORMULIR */}
          <div>
            <button
              onClick={() => router.push(`/admin/cabang/usulan-lokasi/form/badanhukum/section1?id=${ulokId}`)}
              className="bg-blue-950 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-900 transition shadow-sm flex items-center gap-2"
            >
              📝 Isi Formulir Usulan
            </button>
          </div>
        </div>

        {/* 1. PANEL FORM DATA UTAMA (BISA DI-EDIT) */}
        <form onSubmit={handleUpdateDetail} className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <span>🏢</span> Informasi Usulan Kelompok Badan Hukum
            </h2>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
              {statusSubmission === 'Draft' ? 'Belum Direview' : statusSubmission}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nama Lokasi</label>
              <input 
                type="text"
                value={namaLokasi}
                onChange={(e) => setNamaLokasi(e.target.value)}
                className="w-full border p-2.5 rounded-lg text-sm bg-white focus:outline-blue-950 font-medium text-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nama Pemegang Hak</label>
              <input 
                type="text"
                value={namaPemegang}
                onChange={(e) => setNamaPemegang(e.target.value)}
                className="w-full border p-2.5 rounded-lg text-sm bg-white focus:outline-blue-950 font-medium text-gray-700"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Status Kepemilikan (Khusus Badan Hukum)</label>
              <select 
                value={statusBadan} 
                onChange={(e) => setStatusBadan(e.target.value)}
                className="w-full border p-2.5 rounded-lg text-sm bg-white focus:outline-blue-950 font-medium text-gray-700"
                required
              >
                <option value="Badan Hukum">Badan Hukum</option>
                <option value="PT">PT (Perseroan Terbatas)</option>
                <option value="Yayasan">Yayasan</option>
                <option value="Koperasi">Koperasi</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-blue-950 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-900 transition disabled:opacity-50"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>

        {/* 2. PANEL KOLOM KOMENTAR / CHAT ASSESSOR */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gray-50 border-b p-4 flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h2 className="font-bold text-gray-800 text-sm">Kolom Komentar / Pesan Assessor</h2>
          </div>
          
          <div className="p-6 bg-gray-50/50 min-h-50 flex flex-col justify-between">
            {/* List Pesan */}
            {comments.length === 0 ? (
              <div className="text-center my-auto py-6 flex flex-col items-center justify-center text-gray-400 text-sm">
                <span className="text-3xl mb-2 opacity-40">✉️</span>
                <p className="font-medium">Belum ada komentar atau pesan dari assessor.</p>
                <p className="text-xs text-gray-400 mt-0.5">Seluruh feedback peninjauan berkas akan tampil di sini.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4 max-h-100 overflow-y-auto pr-1">
                {comments.map((item) => {
                  const isComplaint = item.message?.includes('[Catatan Assessor - Grup:')
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border shadow-sm max-w-2xl transition-all duration-300 ${
                        isComplaint 
                          ? 'bg-rose-50 border-rose-300 shadow-rose-100/30' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-bold text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                          isComplaint 
                            ? 'text-rose-700 bg-rose-100' 
                            : 'text-blue-950 bg-blue-50'
                        }`}>
                          {isComplaint && <span>⚠️ REVISI PENTING</span>}
                          <span>{item.profiles?.full_name || 'Anonim'} ({item.profiles?.role || 'User'})</span>
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
                      <div className="flex items-start gap-2">
                        {isComplaint && <span className="text-lg leading-none select-none">⚠️</span>}
                        <p className={`text-sm font-medium whitespace-pre-line ${isComplaint ? 'text-rose-950' : 'text-gray-700'}`}>{item.message}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Kotak Input Chat */}
            <form onSubmit={handleSendComment} className="mt-4 pt-4 border-t flex gap-2">
              <input 
                type="text" 
                placeholder="Tulis pesan balasan ke assessor jika diperlukan..." 
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