'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getAssessorHistoriSubmissions } from '@/actions/assessor'

export default function AssessorHistoriPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<any[]>([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [feedbackIndices, setFeedbackIndices] = useState<Record<string, number>>({})

  const fetchSubmissions = async () => {
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
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const processedSubmissions = React.useMemo(() => {
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
  const paginatedSubmissions = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return processedSubmissions.slice(startIndex, startIndex + itemsPerPage)
  }, [processedSubmissions, currentPage])

  const getDetailRoute = (id: string, jenisBadanHukum: string) => {
    const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa']
    if (kelompokPerorangan.includes(jenisBadanHukum)) {
      return `/admin/assessor/penilaian/ulok-perorangan?id=${id}`
    }
    return `/admin/assessor/penilaian/ulok-badanhukum?id=${id}`
  }

  const handleViewDetail = (subId: string, jenisBadanHukum: string) => {
    startTransition(() => {
      const targetRoute = getDetailRoute(subId, jenisBadanHukum)
      router.push(targetRoute)
    })
  }

  const handleNextFeedback = (subId: string, maxComments: number) => {
    setFeedbackIndices((prev) => {
      const currentIdx = prev[subId] || 0
      const nextIdx = (currentIdx + 1) % maxComments
      return {
        ...prev,
        [subId]: nextIdx,
      }
    })
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
    if (s === 'revision' || s === 'perlu revisi') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
          Revision
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
                  paginatedSubmissions.map((item) => {
                    const assessorComments = item.assessorComments
                    const currentFeedbackIdx = feedbackIndices[item.id] || 0
                    const currentComment = assessorComments[currentFeedbackIdx]
                    const branchName = item.profiles?.branches?.nama_cabang || 'Cabang Pusat / Lainnya'

                    return (
                      <React.Fragment key={item.id}>
                        {/* === TABLE ROW: MAIN DATA === */}
                        <tr className="hover:bg-blue-50/20 dark:hover:bg-gray-800/40 transition-all duration-300 ease-in-out border-b border-gray-100 dark:border-gray-800/60">
                          <td className="p-4 pl-6 font-bold text-gray-900 dark:text-gray-100">
                            <div className="flex items-center gap-2.5">
                              <img src="/icons/icon-current.svg" alt="Location Icon" className="w-4 h-4 object-contain" />
                              <span className="hover:text-blue-900 dark:hover:text-blue-400 transition-colors">{item.nama_lokasi}</span>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-gray-700 dark:text-gray-300">
                            {item.nama_pemegang_hak || '-'}
                          </td>
                          <td className="p-4">
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold px-2.5 py-1 rounded-md text-[11px] border border-gray-200 dark:border-gray-700">
                              {branchName}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500 dark:text-gray-400 font-medium">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="p-4 text-center">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="p-4 text-center font-extrabold text-blue-950 dark:text-blue-400">
                            {item.final_score !== null && item.final_score !== undefined 
                              ? item.final_score.toFixed(2) 
                              : '0.00'}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleViewDetail(item.id, item.jenis_badan_hukum)}
                              disabled={isPending}
                              title="Lihat Detail Penilaian"
                              className="p-2 text-blue-950 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-900 dark:hover:text-blue-400 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl flex items-center justify-center mx-auto disabled:opacity-50"
                            >
                              <img src="/icons/icon-message-now.svg" alt="Detail" className="w-5 h-5 object-contain dark:brightness-0 dark:invert" />
                            </button>
                          </td>
                        </tr>

                        {/* === TABLE ROW: FEEDBACK DETAIL === */}
                        <tr>
                          <td colSpan={7} className="bg-gray-50/40 dark:bg-gray-950/20 p-5 pl-6 pr-6 md:pl-12 border-b border-gray-100 dark:border-gray-800/60">
                            <div className="relative bg-white dark:bg-gray-900 border border-blue-100/80 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3 transition-all duration-300 hover:shadow-md dark:hover:border-gray-700">
                              
                              {/* === CHAT BALLOON POINTER === */}
                              <div className="absolute -top-2.5 left-8 w-5 h-5 bg-white dark:bg-gray-900 border-t border-l border-blue-100/80 dark:border-gray-800 rotate-45 rounded-tl"></div>
                              
                              {/* === COMMENT HEADER === */}
                              <div className="flex items-center justify-between text-[11px] border-b border-gray-200 dark:border-gray-800 pb-2 relative z-10">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-blue-950 dark:text-blue-400 bg-blue-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                                    {currentComment?.profiles?.full_name || 'Assessor'}
                                  </span>
                                  <span className="text-gray-400 dark:text-gray-500 font-medium">
                                    ({currentComment?.profiles?.role || 'Assessor'})
                                  </span>
                                </div>
                                <div className="text-gray-400 dark:text-gray-500 flex items-center gap-2.5">
                                  <span className="font-medium">{formatDate(currentComment?.created_at)}</span>
                                  {assessorComments.length > 1 && (
                                    <span className="bg-blue-50 dark:bg-gray-800 text-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-lg font-bold">
                                      {currentFeedbackIdx + 1} of {assessorComments.length}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* === COMMENT BODY === */}
                              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-line leading-relaxed italic pl-1 relative z-10">
                                "{currentComment?.message}"
                              </p>

                              {/* === CHAT NAVIGATION === */}
                              {assessorComments.length > 1 && (
                                <div className="flex justify-end pt-1 relative z-10">
                                  <button
                                    onClick={() => handleNextFeedback(item.id, assessorComments.length)}
                                    className="text-[10px] font-extrabold text-blue-950 dark:text-blue-300 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 px-3 py-1.5 rounded-xl hover:bg-blue-100 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                                  >
                                    Next Feedback &rarr;
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    )
                  })
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