'use client'

import React, { useState, useEffect, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getAssessorHistoriSubmissions } from '@/actions/assessor'

// Dynamic import for SubmissionRow with loading/skeleton support
const SubmissionRow = dynamic(() => import('./SubmissionRow'), {
  ssr: false,
  loading: () => (
    <tr>
      <td colSpan={7} className="p-12 text-center text-gray-400 dark:text-gray-500 italic text-sm">
        <div className="w-6 h-6 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Memuat baris usulan...
      </td>
    </tr>
  )
})

// Move pure helper functions outside the component to prevent recreating them on every render
const getDetailRoute = (id: string, jenisBadanHukum: string) => {
  const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa']
  if (kelompokPerorangan.includes(jenisBadanHukum)) {
    return `/admin/assessor/penilaian/ulok-perorangan?id=${id}`
  }
  return `/admin/assessor/penilaian/ulok-badanhukum?id=${id}`
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const getStatusBadge = (status: string) => {
  const s = status ? status.toLowerCase() : ''
  if (s === 'approved' || s === 'telah disetujui') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-green-600 bg-green-50 border-green-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
        Approved
      </span>
    )
  }
  if (s === 'revisi' || s === 'revision' || s === 'perlu revisi') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
        Revisi
      </span>
    )
  }
  if (s === 'rejected' || s === 'ditolak') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
        Rejected
      </span>
    )
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
      In Review
    </span>
  )
}

export default function AssessorHistoriPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<any[]>([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    const res = await getAssessorHistoriSubmissions()
    if (res.success && res.data) {
      setSubmissions(res.data)
    } else {
      if (res.error && res.error.includes('Unauthorized')) {
        router.push('/')
      } else {
        alert("Gagal memuat histori: " + res.error)
      }
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const processedSubmissions = useMemo(() => {
    return submissions
      .map((sub) => {
        const assessorComments = (sub.comments || [])
          .filter((c: any) => c.profiles?.role === 'assessor')
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        const allCommentsSorted = [...(sub.comments || [])].sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        const lastComment = allCommentsSorted[allCommentsSorted.length - 1]

        return {
          ...sub,
          assessorComments,
          lastComment,
        }
      })
      .filter((sub) => {
        if (sub.assessorComments.length === 0) return false

        if (sub.lastComment && sub.lastComment.profiles?.role === 'admin_cabang') {
          return false
        }

        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.lastComment?.created_at || a.created_at).getTime()
        const dateB = new Date(b.lastComment?.created_at || b.created_at).getTime()
        return dateB - dateA
      })
  }, [submissions])

  const totalItems = processedSubmissions.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return processedSubmissions.slice(startIndex, startIndex + itemsPerPage)
  }, [processedSubmissions, currentPage])

  const handleViewDetail = useCallback((subId: string, jenisBadanHukum: string) => {
    startTransition(() => {
      const targetRoute = getDetailRoute(subId, jenisBadanHukum)
      router.push(targetRoute)
    })
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* === HEADER PAGE === */}
        <div className="max-w-255 mx-auto mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Histori Penilaian Assessor
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
            Daftar usulan lokasi yang pernah Anda komentari / beri catatan revisi.
          </p>
        </div>

        {/* === CARD TABLE === */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/80 overflow-hidden">
          
          {/* === CARD HEADER: ASSESSOR HISTORI === */}
          <div className="bg-[#142B4D] dark:bg-slate-900 p-5 flex items-center justify-between transition-colors">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <img src="/icons/icon-comment.svg" alt="Comment Icon" className="w-5 h-5 object-contain brightness-0 invert" /> 
              Daftar Histori Komentar & Revisi
            </h3>
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold">
              {processedSubmissions.length} Data Aktif
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <th className="p-4 pl-6">Nama ULOK</th>
                  <th className="p-4">Nama Pemilik</th>
                  <th className="p-4">Asal Cabang</th>
                  <th className="p-4 w-48">Tanggal Diajukan</th>
                  <th className="p-4 text-center w-32">Status</th>
                  <th className="p-4 text-center w-28">Skor ULOK</th>
                  <th className="p-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400 dark:text-gray-500 italic text-sm">
                      <div className="w-6 h-6 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Memuat daftar histori usulan...
                    </td>
                  </tr>
                ) : paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400 dark:text-gray-500">
                      <p className="font-bold text-gray-500 dark:text-gray-400">Tidak ada data histori</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Belum ada usulan lokasi yang dikomentari atau semua usulan yang Anda beri catatan telah dibalas oleh Admin Cabang.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((item) => (
                    <SubmissionRow
                      key={item.id}
                      item={item}
                      isPending={isPending}
                      handleViewDetail={handleViewDetail}
                      formatDate={formatDate}
                      getStatusBadge={getStatusBadge}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* === PAGINATION === */}
          {totalPages > 1 && (
            <div className="p-5 bg-gray-50/80 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Menampilkan <span className="font-semibold text-gray-700 dark:text-gray-200">{currentPage}</span> dari <span className="font-semibold text-gray-700 dark:text-gray-200">{totalPages}</span> ({totalItems} usulan)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  &larr; Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
