'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getFeedbackSubmissions } from '@/actions/cabang'

export default function FeedbackPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<any[]>([])
  
  // Pagination State for main table
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Track sub-pagination indices for feedback comments of each submission
  // key: submissionId, value: index of current shown assessor comment (0-based)
  const [feedbackIndices, setFeedbackIndices] = useState<Record<string, number>>({})

  // Fetch feedback submissions from Server Action
  const fetchSubmissions = async () => {
    setLoading(true)
    const res = await getFeedbackSubmissions()
    if (res.success && res.data) {
      setSubmissions(res.data)
    } else {
      if (res.error && res.error.includes('Unauthorized')) {
        router.push('/')
      } else {
        alert("Gagal memuat feedback: " + res.error)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  // Process and filter submissions according to the specifications:
  // 1. Must have at least one comment from an Assessor.
  // 2. Clear Ticket: The last comment must NOT be from role 'admin_cabang'
  // 3. Fluid Order: Submissions with the newest assessor comment should be placed first.
  const processedSubmissions = React.useMemo(() => {
    return submissions
      .map((sub) => {
        // Find all comments by Assessor (role === 'assessor')
        const assessorComments = (sub.comments || [])
          .filter((c: any) => c.profiles?.role === 'assessor')
          // Sort assessor comments descending by created_at (newest first)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        // Get overall comments sorted ascending to determine the absolute last/latest comment on this submission
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
        // Rule 1: Must have at least one comment from Assessor
        if (sub.assessorComments.length === 0) return false

        // Rule 2: Clear Ticket - Must NOT have been replied to yet.
        // If the absolute last comment on the ticket was by 'admin_cabang', then it has been replied. Filter it out.
        if (sub.lastComment && sub.lastComment.profiles?.role === 'admin_cabang') {
          return false
        }

        return true
      })
      .sort((a, b) => {
        // Rule 3: Fluid ordering - Sort by the created_at of the latest assessor comment (descending)
        const dateA = new Date(a.assessorComments[0].created_at).getTime()
        const dateB = new Date(b.assessorComments[0].created_at).getTime()
        return dateB - dateA
      })
  }, [submissions])

  // Pagination calculations
  const totalItems = processedSubmissions.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const paginatedSubmissions = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return processedSubmissions.slice(startIndex, startIndex + itemsPerPage)
  }, [processedSubmissions, currentPage])

  // Helper to determine the path based on jenis_badan_hukum
  const getFormRoute = (jenisBadanHukum: string) => {
    const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa']
    if (kelompokPerorangan.includes(jenisBadanHukum)) {
      return `/admin/cabang/usulan-lokasi/form/perorangan`
    }
    return `/admin/cabang/usulan-lokasi/form/badanhukum`
  }

  // Handle "↳ Balas" button click
  const handleReply = (subId: string, jenisBadanHukum: string) => {
    startTransition(() => {
      const targetRoute = getFormRoute(jenisBadanHukum)
      router.push(`${targetRoute}?id=${subId}`)
    })
  }

  // Handle "Next ->" feedback sub-pagination
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

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Format status UI helper
  const getStatusBadge = (status: string) => {
    const s = status ? status.toLowerCase() : ''
    if (s === 'approved' || s === 'telah disetujui') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-green-600 bg-green-50 border-green-200">
          Telah Disetujui
        </span>
      )
    }
    if (s === 'in review' || s === 'dalam review' || s === 'revision' || s === 'perlu revisi') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-yellow-600 bg-yellow-50 border-yellow-200">
          Dalam Review
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-blue-600 bg-blue-50 border-blue-200">
        Belum Direview
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER PAGE */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            Feedback & Revisi Assessor
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            Daftar feedback, catatan revisi, dan pesan dari Assessor untuk usulan lokasi cabang Anda.
          </p>
        </div>

        {/* CARD TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* HEADER NAVY BLUE */}
          <div className="bg-[#142B4D] p-5 flex items-center justify-between">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <span>💬</span> Kolom Feedback & Catatan Revisi
            </h3>
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold">
              {processedSubmissions.length} Tiket Perlu Tindakan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b">
                  <th className="p-4 pl-6 text-center w-16">No</th>
                  <th className="p-4">Nama ULOK</th>
                  <th className="p-4 w-48">Tanggal</th>
                  <th className="p-4 text-center w-36">Status</th>
                  <th className="p-4 text-center w-32">Skor ULOK</th>
                  <th className="p-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-400 italic">
                      Memuat daftar feedback usulan...
                    </td>
                  </tr>
                ) : paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-400">
                      <span className="text-4xl block mb-2 opacity-50">🎉</span>
                      <p className="font-bold text-gray-500">Tidak ada feedback baru!</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Seluruh catatan revisi dari Assessor telah diselesaikan atau dibalas.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((item, idx) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1
                    const assessorComments = item.assessorComments
                    const currentFeedbackIdx = feedbackIndices[item.id] || 0
                    const currentComment = assessorComments[currentFeedbackIdx]

                    return (
                      <React.Fragment key={item.id}>
                        {/* MAIN ROW */}
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 pl-6 text-center font-bold text-gray-400">
                            {rowNumber}
                          </td>
                          <td className="p-4 font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <span className="text-base">📍</span>
                              {item.nama_lokasi}
                            </div>
                          </td>
                          <td className="p-4 text-gray-500">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="p-4 text-center">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="p-4 text-center font-black text-blue-950">
                            {item.final_score !== null && item.final_score !== undefined 
                              ? item.final_score.toFixed(2) 
                              : '0.00'}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleReply(item.id, item.jenis_badan_hukum)}
                              disabled={isPending}
                              className="bg-blue-950 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-900 transition shadow-sm flex items-center justify-center gap-1.5 mx-auto disabled:opacity-50"
                            >
                              <span>↳</span> Balas
                            </button>
                          </td>
                        </tr>

                        {/* FEEDBACK ROW */}
                        <tr>
                          <td colSpan={6} className="bg-gray-50/70 p-4 pl-12 pr-6 border-b">
                            <div className="relative bg-white border border-gray-150 rounded-xl p-4 shadow-sm space-y-2">
                              {/* Comment Header info */}
                              <div className="flex items-center justify-between text-[11px] border-b pb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-blue-950 bg-blue-50 px-2 py-0.5 rounded">
                                    {currentComment?.profiles?.full_name || 'Assessor'}
                                  </span>
                                  <span className="text-gray-400">
                                    ({currentComment?.profiles?.role || 'Assessor'})
                                  </span>
                                </div>
                                <div className="text-gray-400 flex items-center gap-2">
                                  <span>{formatDate(currentComment?.created_at)}</span>
                                  {assessorComments.length > 1 && (
                                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                                      {currentFeedbackIdx + 1} of {assessorComments.length}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Comment Body */}
                              <p className="text-xs md:text-sm text-gray-700 font-medium whitespace-pre-line leading-relaxed italic pl-1">
                                "{currentComment?.message}"
                              </p>

                              {/* Sub-pagination button */}
                              {assessorComments.length > 1 && (
                                <div className="flex justify-end pt-1">
                                  <button
                                    onClick={() => handleNextFeedback(item.id, assessorComments.length)}
                                    className="text-[10px] font-extrabold text-blue-950 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded hover:bg-blue-100 transition flex items-center gap-1 shadow-xs"
                                  >
                                    Next <span>➔</span>
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

          {/* MAIN PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                Menampilkan halaman {currentPage} dari {totalPages} ({totalItems} usulan)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border bg-white rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border bg-white rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
