'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getAssessorHistoriSubmissions } from '@/actions/assessor'

export default function AssessorHistoriPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<any[]>([])
  
  // Pagination State for main table
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Track sub-pagination indices for feedback comments of each submission
  const [feedbackIndices, setFeedbackIndices] = useState<Record<string, number>>({})

  // Fetch feedback submissions from Server Action
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

  // Process and filter submissions according to specifications:
  // 1. Must have at least one comment from an Assessor.
  // 2. Clear Ticket: The last comment must NOT be from role 'admin_cabang'
  // 3. Fluid Order: Submissions with the newest assessor comment should be placed first.
  const processedSubmissions = React.useMemo(() => {
    return submissions
      .map((sub) => {
        // Find comments by Assessor (role === 'assessor')
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

        // Rule 2: Clear Ticket - Must NOT have been replied to yet by Admin Cabang.
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
  const getDetailRoute = (id: string, jenisBadanHukum: string) => {
    const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa']
    if (kelompokPerorangan.includes(jenisBadanHukum)) {
      return `/admin/assessor/penilaian/ulok-perorangan/detail-penilaian/section1?id=${id}`
    }
    return `/admin/assessor/penilaian/ulok-badanhukum/detail-penilaian/section1?id=${id}`
  }

  // Handle "Lihat Detail" button click
  const handleViewDetail = (subId: string, jenisBadanHukum: string) => {
    startTransition(() => {
      const targetRoute = getDetailRoute(subId, jenisBadanHukum)
      router.push(targetRoute)
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
    if (s === 'approved') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-emerald-600 bg-emerald-50 border-emerald-200">
          Approved
        </span>
      )
    }
    if (s === 'revision') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-rose-600 bg-rose-50 border-rose-200">
          Revision
        </span>
      )
    }
    if (s === 'rejected') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-slate-600 bg-slate-50 border-slate-200">
          Rejected
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold border text-amber-600 bg-amber-50 border-amber-200">
        In Review
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER PAGE */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            Histori Penilaian Assessor
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            Daftar usulan lokasi yang pernah Anda komentari / beri catatan revisi.
          </p>
        </div>

        {/* CARD TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* HEADER NAVY BLUE */}
          <div className="bg-[#142B4D] p-5 flex items-center justify-between">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <span>📋</span> Daftar Histori Komentar & Revisi
            </h3>
            <span className="bg-[#EAB308] text-[#142B4D] text-xs px-3 py-1 rounded-full font-bold">
              {processedSubmissions.length} Data Aktif
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b">
                  <th className="p-4 pl-6 text-center w-16">No</th>
                  <th className="p-4">Nama ULOK</th>
                  <th className="p-4">Asal Cabang</th>
                  <th className="p-4 w-48">Tanggal Diajukan</th>
                  <th className="p-4 text-center w-36">Status</th>
                  <th className="p-4 text-center w-32">Skor ULOK</th>
                  <th className="p-4 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400 italic">
                      Memuat daftar histori usulan...
                    </td>
                  </tr>
                ) : paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400">
                      <span className="text-4xl block mb-2 opacity-50">🎉</span>
                      <p className="font-bold text-gray-500">Tidak ada data histori!</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Belum ada usulan lokasi yang dikomentari atau semua usulan yang Anda beri catatan telah dibalas oleh Admin Cabang.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((item, idx) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1
                    const assessorComments = item.assessorComments
                    const currentFeedbackIdx = feedbackIndices[item.id] || 0
                    const currentComment = assessorComments[currentFeedbackIdx]
                    const branchName = item.profiles?.branches?.nama_cabang || 'Cabang Pusat / Lainnya'

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
                          <td className="p-4">
                            <span className="bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-md text-[11px] border">
                              {branchName}
                            </span>
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
                              onClick={() => handleViewDetail(item.id, item.jenis_badan_hukum)}
                              disabled={isPending}
                              className="bg-blue-950 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-900 transition shadow-sm flex items-center justify-center gap-1 mx-auto disabled:opacity-50 whitespace-nowrap"
                            >
                              🔍 Lihat Detail
                            </button>
                          </td>
                        </tr>

                        {/* FEEDBACK ROW */}
                        <tr>
                          <td colSpan={7} className="bg-gray-50/70 p-4 pl-12 pr-6 border-b">
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
