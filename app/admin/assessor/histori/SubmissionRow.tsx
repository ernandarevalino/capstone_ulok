'use client'

import React, { useState, memo } from 'react'

interface SubmissionRowProps {
  item: any
  isPending: boolean
  handleViewDetail: (subId: string, jenisBadanHukum: string) => void
  formatDate: (dateStr: string) => string
  getStatusBadge: (status: string) => React.ReactNode
}

const parseFeedbackMessage = (message: string) => {
  if (!message) return { tag: null, text: '' }

  const match = message.match(/\[([\s\S]*?)\]:\s*([\s\S]*)$/)
  if (match) {
    return {
      tag: match[1], // "Catatan Assessor - Dokumen: File Scan E-KTP"
      text: match[2].trim()
    }
  }
  return { tag: null, text: message }
}

const SubmissionRow: React.FC<SubmissionRowProps> = ({
  item,
  isPending,
  handleViewDetail,
  formatDate,
  getStatusBadge,
}) => {
  const [currentFeedbackIdx, setCurrentFeedbackIdx] = useState(0)

  const assessorComments = item.assessorComments || []
  const currentComment = assessorComments[currentFeedbackIdx]
  const branchName = item.profiles?.branches?.nama_cabang || 'Cabang Pusat / Lainnya'

  const handleNextFeedbackLocal = () => {
    if (assessorComments.length > 1) {
      setCurrentFeedbackIdx((prev) => (prev + 1) % assessorComments.length)
    }
  }

  return (
    <React.Fragment>
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

            <div className="absolute -top-2.5 left-8 w-5 h-5 bg-white dark:bg-gray-900 border-t border-l border-blue-100/80 dark:border-gray-800 rotate-45 rounded-tl"></div>

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

            {(() => {
              const { tag, text } = parseFeedbackMessage(currentComment?.message)
              return (
                <div className="pl-1 relative z-10 space-y-1">
                  {tag && (
                    <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100">
                      {tag.replace(/^Catatan Assessor\s*-\s*(.+?):\s*(.+)$/i, 'Catatan Assessor - $1 ($2):')}
                    </p>
                  )}
                  <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-line leading-relaxed">
                    "{text}"
                  </p>
                </div>
              )
            })()}

            {assessorComments.length > 1 && (
              <div className="flex justify-end pt-1 relative z-10">
                <button
                  onClick={handleNextFeedbackLocal}
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
}

export default memo(SubmissionRow)