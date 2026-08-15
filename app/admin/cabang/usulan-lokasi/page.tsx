'use client'

import React, { useState, useEffect, useTransition, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getUlokSubmissions, createUlokSubmission } from '@/actions/cabang'
import { softDeleteUlok, getDeletedUlokCount } from '@/actions/recyclebin'
import {
  Download,
  Trash2,
  Search,
  Filter,
  Plus,
  Folder,
  ClipboardList,
  ChevronDown,
  Check,
  AlertTriangle,
  X,
  Eye,
  Edit3,
  CheckCircle2,
  Building2,
  RotateCcw,
} from 'lucide-react'
import { exportUlokSubmissionsCSV } from '@/actions/export'
import { getCurrentUserBranchId } from '@/actions/saw'

const formatLastReviewedShort = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'Belum direview'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Belum direview'
    const pad = (num: number) => String(num).padStart(2, '0')
    const day = pad(date.getDate())
    const month = pad(date.getMonth() + 1)
    const year = String(date.getFullYear()).slice(-2)
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    return `${day}-${month}-${year} ${hours}:${minutes}`
  } catch (e) {
    return 'Belum direview'
  }
}

const formatTimestamp = (dateStr: string | null | undefined) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    const pad = (num: number) => String(num).padStart(2, '0')
    const day = pad(date.getDate())
    const month = pad(date.getMonth() + 1)
    const year = String(date.getFullYear()).slice(-2)
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    return `${day}-${month}-${year} ${hours}:${minutes}`
  } catch (e) {
    return ''
  }
}

const getFormRoute = (jenisBadanHukum: string) => {
  const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa']
  if (kelompokPerorangan.includes(jenisBadanHukum)) {
    return `/admin/cabang/usulan-lokasi/form/perorangan`
  }
  return `/admin/cabang/usulan-lokasi/form/badanhukum`
}

// ============================================================
// TableGroup Component
// ============================================================
interface TableGroupProps {
  title: string
  allowedStatuses: string[]
  colorStyles: string
  filteredSubmissions: any[]
  expandedGroup: string | null
  currentPage: number
  expandedRowId: string | null
  downloadingDocName: string | null
  isPending: boolean
  toggleGroup: (title: string) => void
  setExpandedRowId: (id: string | null) => void
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  handleDeleteLocation: (id: string, namaLokasi: string) => void
  handleDownload: (url: string, filename: string) => Promise<void>
  router: ReturnType<typeof import('next/navigation').useRouter>
}

const TableGroup = React.memo(function TableGroup({
  title,
  allowedStatuses,
  colorStyles,
  filteredSubmissions,
  expandedGroup,
  currentPage,
  expandedRowId,
  downloadingDocName,
  isPending,
  toggleGroup,
  setExpandedRowId,
  setCurrentPage,
  handleDeleteLocation,
  handleDownload,
  router,
}: TableGroupProps) {
  const isExpanded = expandedGroup === title
  const itemsPerPage = 12

  const { dataSorted, displayedData, totalItems, totalPages, activePage } = useMemo(() => {
    const sorted = [...filteredSubmissions]
      .filter((item) => allowedStatuses.includes(item.status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const total = sorted.length
    const pages = Math.ceil(total / itemsPerPage)
    const active = Math.min(currentPage, pages || 1)

    const displayed = isExpanded
      ? sorted.slice((active - 1) * itemsPerPage, active * itemsPerPage)
      : sorted.slice(0, 3)

    return { dataSorted: sorted, displayedData: displayed, totalItems: total, totalPages: pages, activePage: active }
  }, [filteredSubmissions, allowedStatuses, currentPage, isExpanded])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden mb-6">
      <div
        onClick={() => toggleGroup(title)}
        className="bg-[#142B4D] dark:bg-slate-900 p-4 md:p-5 flex items-center justify-between cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Chevron for expand/collapse */}
          <ChevronDown
            className={`w-5 h-5 text-white/80 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />

          {/* Dynamic Icon based on lucide-react */}
          <ClipboardList className="w-5 h-5 text-white/90" />

          <h3 className="text-white font-bold text-sm md:text-base tracking-wide">
            {title}
          </h3>
        </div>

        {/* Right-aligned Badge */}
        <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">
          {dataSorted.length} Usulan
        </span>
      </div>
        {/* === DESKTOP TABLE VIEW === */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold text-xs border-b border-gray-100 dark:border-gray-800">
                <th className="p-4 w-1/4">Nama ULOK</th>
                <th className="p-4">Tanggal Dibuat</th>
                <th className="p-4">Kepemilikan</th>
                <th className="p-4 text-center">Status Assessor</th>
                <th className="p-4 text-center">Progres</th>
                <th className="p-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
                    Tidak ada data usulan lokasi
                  </td>
                </tr>
              ) : (
                displayedData.map((item) => {
                  const isExpandedRow = expandedRowId === item.id
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => setExpandedRowId(isExpandedRow ? null : item.id)}
                        className={`border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors cursor-pointer select-none ${
                          isExpandedRow ? 'bg-gray-50/40 dark:bg-gray-900/10' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Chevron Arrow Toggle */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedRowId(isExpandedRow ? null : item.id)
                              }}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer"
                              title={isExpandedRow ? 'Sembunyikan Checklist' : 'Tampilkan Checklist'}
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                                  isExpandedRow ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                                {item.nama_lokasi}
                              </span>
                              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                                Review: {formatLastReviewedShort(item.last_reviewed_at)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {item.jenis_badan_hukum}
                          </span>{' '}
                          ({item.nama_pemegang_hak})
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${colorStyles}`}>
                            {item.status === 'Draft' ? 'Belum Direview' : item.status}
                          </span>
                        </td>
                        <td className="p-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                          <div className="flex flex-col items-center justify-center">
                            <span>
                              {item.numerator ?? 0}/{item.denominator ?? 0} ({Math.round(item.persentase ?? 0)}%)
                            </span>
                            {item.persentase === 100 && item.documents_completed_at && (
                              <div className="text-[10px] text-gray-400 dark:text-gray-500 font-normal mt-0.5 whitespace-nowrap">
                                Lengkap pada: {formatTimestamp(item.documents_completed_at)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center items-center gap-2 mx-auto">
                            <button
                              onClick={() => router.push(`${getFormRoute(item.jenis_badan_hukum)}?id=${item.id}`)}
                              className="p-2 rounded-lg bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#142B4D] dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
                              title="Lihat Detail"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(item.id, item.nama_lokasi)}
                              disabled={isPending}
                              className="p-2 rounded-lg bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:scale-100 flex items-center justify-center"
                              title="Hapus Usulan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Accordion Row Checklists */}
                      {isExpandedRow && (
                        <tr className="bg-gray-50/60 dark:bg-gray-900/30 transition-all duration-300">
                          <td colSpan={6} className="p-5 border-t border-gray-100 dark:border-gray-800">
                            <div className="bg-white dark:bg-gray-950 rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800/85 shadow-sm space-y-4">
                              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-3">
                                <div className="flex items-center gap-2">
                                  <ClipboardList className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                    Status Checklist Dokumen ({item.persentase}% - {item.numerator}/{item.denominator} Terupload)
                                  </h4>
                                </div>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                  Jalur: {item.jenis_badan_hukum}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {item.checklistStatus && item.checklistStatus.length > 0 ? (
                                  item.checklistStatus.map((doc: any, idx: number) => {
                                    const isUploaded = doc.is_uploaded
                                    const isVerified = !!doc.is_verified

                                    let rowClass = ''
                                    let iconElement = null
                                    let textClass = ''
                                    let badgeText = ''
                                    let badgeClass = ''

                                    if (!isUploaded) {
                                      rowClass =
                                        'bg-gray-50/40 dark:bg-gray-950/10 border-gray-150 dark:border-gray-900/40 hover:border-gray-250 dark:hover:border-gray-800'
                                      iconElement = (
                                        <span className="text-gray-400 dark:text-gray-500 flex-shrink-0 bg-gray-100 dark:bg-gray-900/60 w-5 h-5 rounded-full flex items-center justify-center">
                                          <X className="w-3 h-3" />
                                        </span>
                                      )
                                      textClass = 'text-gray-400 dark:text-gray-500'
                                      badgeText = 'BELUM TERUNGGAH'
                                      badgeClass =
                                        'bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-450 border border-gray-200 dark:border-gray-800/80'
                                    } else if (!isVerified) {
                                      rowClass =
                                        'bg-amber-50/30 dark:bg-amber-950/10 border-amber-100/80 dark:border-amber-900/30 hover:border-amber-250 dark:hover:border-amber-800'
                                      iconElement = (
                                        <span className="text-amber-500 dark:text-amber-400 flex-shrink-0 bg-amber-100/60 dark:bg-amber-950/40 w-5 h-5 rounded-full flex items-center justify-center">
                                          <AlertTriangle className="w-3 h-3" />
                                        </span>
                                      )
                                      textClass = 'text-gray-800 dark:text-gray-205'
                                      badgeText = 'BELUM SESUAI'
                                      badgeClass =
                                        'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                                    } else {
                                      rowClass =
                                        'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/80 dark:border-emerald-900/30 hover:border-emerald-250 dark:hover:border-emerald-800'
                                      iconElement = (
                                        <span className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 bg-emerald-100/60 dark:bg-emerald-950/40 w-5 h-5 rounded-full flex items-center justify-center">
                                          <Check className="w-3 h-3" />
                                        </span>
                                      )
                                      textClass = 'text-gray-800 dark:text-gray-205'
                                      badgeText = 'SUDAH SESUAI'
                                      badgeClass =
                                        'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/50'
                                    }

                                    return (
                                      <div
                                        key={idx}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${rowClass}`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          {iconElement}
                                          <span
                                            className={`text-xs font-semibold truncate ${textClass}`}
                                            title={doc.nama_dokumen}
                                          >
                                            {doc.nama_dokumen}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                          {doc.is_negotiable && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/40 select-none">
                                              Opsional
                                            </span>
                                          )}

                                          <div className="flex items-center gap-1.5 ml-2">
                                            <span
                                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeClass}`}
                                            >
                                              {badgeText}
                                            </span>
                                            {isUploaded && doc.file_url && (
                                              <div className="flex gap-1">
                                                <a
                                                  href={doc.file_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="p-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center"
                                                  title="View File"
                                                >
                                                  <Eye className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                                </a>
                                                <button
                                                  type="button"
                                                  disabled={downloadingDocName === doc.nama_dokumen}
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDownload(doc.file_url!, doc.nama_dokumen)
                                                  }}
                                                  className="p-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center disabled:opacity-50"
                                                  title="Download File"
                                                >
                                                  {downloadingDocName === doc.nama_dokumen ? (
                                                    <span className="w-3 h-3 border-2 border-[#142B4D] dark:border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                                                  ) : (
                                                    <Download className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                                  )}
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })
                                ) : (
                                  <div className="col-span-full py-4 text-center text-xs text-gray-400 italic">
                                    Tidak ada data checklist wajib untuk badan hukum ini.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* === MOBILE CARD VIEW === */}
        <div className="block md:hidden overflow-x-auto">
          {displayedData.length === 0 ? (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
              Tidak ada data usulan lokasi
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 min-w-[300px]">
              {displayedData.map((item) => (
                <div
                  key={item.id}
                  className="p-4 space-y-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                >
                  {/* Nama ULOK & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="font-bold text-gray-800 dark:text-gray-100 text-sm break-all leading-snug">
                          {item.nama_lokasi}
                        </span>
                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                          Review: {formatLastReviewedShort(item.last_reviewed_at)}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 shrink-0 rounded-full text-[10px] font-bold inline-block text-center ${colorStyles}`}
                    >
                      {item.status === 'Draft' ? 'Belum Direview' : item.status}
                    </span>
                  </div>

                  {/* Detail Info Grid */}
                  <div className="grid grid-cols-3 gap-x-2 gap-y-3 text-xs text-gray-600 dark:text-gray-400 pt-1.5 border-t border-gray-50 dark:border-gray-800">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                        Tanggal Dibuat
                      </p>
                      <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                        Kepemilikan
                      </p>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {item.jenis_badan_hukum}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">({item.nama_pemegang_hak})</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                        Progres
                      </p>
                      <p className="font-bold text-[#142B4D] dark:text-blue-400 truncate">
                        {item.numerator ?? 0}/{item.denominator ?? 0} ({Math.round(item.persentase ?? 0)}%)
                      </p>
                      {item.persentase === 100 && item.documents_completed_at && (
                        <p className="text-[9px] text-gray-400 leading-tight">
                          Lengkap: {formatTimestamp(item.documents_completed_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800/60 pt-2.5">
                    <button
                      onClick={() => router.push(`${getFormRoute(item.jenis_badan_hukum)}?id=${item.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#142B4D] hover:bg-[#1a3863] text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm h-11 min-h-[44px]"
                      title="Lihat Detail"
                    >
                      <Edit3 className="w-4 h-4 text-white" />
                      <span>Lihat Detail</span>
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(item.id, item.nama_lokasi)}
                      disabled={isPending}
                      className="px-3 py-2 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center h-11 w-11 min-h-[44px] min-w-[44px]"
                      title="Hapus Usulan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === KONTROL PAGINASI === */}
        {isExpanded && totalItems > itemsPerPage && (
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
            <button
              disabled={activePage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
            >
              Prev
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Halaman {activePage} dari {totalPages}
            </span>
            <button
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        )}
    </div>
  )
})

export default function UsulanLokasiPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [isLoading, setIsLoading] = useState(true)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [deletedCount, setDeletedCount] = useState<number>(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [downloadingDocName, setDownloadingDocName] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [userBranchId, setUserBranchId] = useState<number | undefined>(undefined)

  // Filter Popover States
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedKepemilikan, setSelectedKepemilikan] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filterRef = useRef<HTMLDivElement>(null)

  // Close filter popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search: update searchQuery 300ms after searchInput changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const activeFilterCount =
    (selectedStatus ? 1 : 0) +
    (selectedKepemilikan ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0)

  const handleResetFilters = () => {
    setSelectedStatus('')
    setSelectedKepemilikan('')
    setStartDate('')
    setEndDate('')
  }

  const handleDownload = useCallback(async (url: string, filename: string) => {
    if (!url) return
    setDownloadingDocName(filename)
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl

      let actualFilename = filename
      try {
        const urlObj = new URL(url)
        const pathname = urlObj.pathname
        const ext = pathname.split('.').pop()
        if (ext && ext.length <= 4 && !filename.toLowerCase().endsWith('.' + ext.toLowerCase())) {
          actualFilename = `${filename}.${ext}`
        }
      } catch (e) {
        // fallback
      }

      a.download = actualFilename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Gagal mendownload file:', error)
      alert('Gagal mengunduh berkas. Silakan coba lagi.')
    } finally {
      setDownloadingDocName(null)
    }
  }, [])

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const res = await exportUlokSubmissionsCSV('admin_cabang', userBranchId)
      if (res.success && res.csvData && res.filename) {
        const blob = new Blob([res.csvData], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', res.filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        alert('Gagal mengekspor CSV: ' + (res.error || 'Terjadi kesalahan'))
      }
    } catch (error: any) {
      console.error('Gagal mengekspor CSV:', error)
      alert('Gagal mengekspor CSV. Silakan coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; namaLokasi: string } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')

  const [namaLokasi, setNamaLokasi] = useState('')
  const [statusBadan, setStatusBadan] = useState('')
  const [namaPemegang, setNamaPemegang] = useState('')

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const toggleGroup = useCallback((groupTitle: string) => {
    setExpandedGroup((prev) => (prev === groupTitle ? null : groupTitle))
    setCurrentPage(1)
  }, [])

  const fetchSubmissions = async () => {
    setIsLoading(true)
    try {
      const res = await getUlokSubmissions()
      if (res.success && res.data) {
        setSubmissions(res.data)
      } else {
        if (res.error && res.error.includes('Unauthorized')) {
          router.push('/')
        } else {
          alert('Gagal memuat daftar usulan: ' + res.error)
        }
      }

      const countRes = await getDeletedUlokCount()
      if (countRes.success && countRes.count !== undefined) {
        setDeletedCount(countRes.count)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    router.refresh()
    fetchSubmissions()

    async function loadBranchId() {
      const branchId = await getCurrentUserBranchId()
      if (branchId) {
        setUserBranchId(Number(branchId))
      }
    }
    loadBranchId()
  }, [router])

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!namaLokasi || !statusBadan || !namaPemegang) return

    startTransition(async () => {
      const res = await createUlokSubmission({
        nama_lokasi: namaLokasi,
        jenis_badan_hukum: statusBadan,
        nama_pemegang_hak: namaPemegang,
      })

      if (res.success && res.data) {
        setIsModalOpen(false)
        setSuccessMessage(`ULOK '${res.data.nama_lokasi || namaLokasi}' berhasil dibuat!`)
        setShowSuccessModal(true)

        const targetRoute = getFormRoute(res.data.jenis_badan_hukum)
        const targetId = res.data.id

        setNamaLokasi('')
        setStatusBadan('')
        setNamaPemegang('')

        setTimeout(() => {
          setShowSuccessModal(false)
          router.push(`${targetRoute}?id=${targetId}`)
        }, 1500)
      } else {
        alert('Error: ' + res.error)
      }
    })
  }

  const handleDeleteLocation = useCallback((id: string, namaLokasi: string) => {
    setDeleteTarget({ id, namaLokasi })
  }, [])

  const executeDelete = async () => {
    if (!deleteTarget) return
    const idToDelete = deleteTarget.id
    const namaToDelete = deleteTarget.namaLokasi

    startTransition(async () => {
      const res = await softDeleteUlok(idToDelete)
      if (res.success) {
        setSuccessMessage(`ULOK '${namaToDelete}' berhasil dipindahkan ke tempat sampah`)
        setShowSuccessModal(true)
        fetchSubmissions()
        setDeleteTarget(null)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 1500)
      } else {
        alert('Gagal memindahkan ke tempat sampah: ' + res.error)
      }
    })
  }

  // Combined Filter logic (Search Query, Status, Kepemilikan, Date Range) — memoized
  const filteredSubmissions = useMemo(
    () =>
      submissions.filter((item) => {
        // Search Query filter
        const searchLower = searchQuery.toLowerCase()
        const dateStr = item.created_at
          ? new Date(item.created_at)
              .toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
              .toLowerCase()
          : ''
        const kepemilikanStr = `${item.jenis_badan_hukum || ''} ${item.nama_pemegang_hak || ''}`.toLowerCase()
        const namaLokasiStr = (item.nama_lokasi || '').toLowerCase()

        const matchesSearch =
          !searchQuery ||
          namaLokasiStr.includes(searchLower) ||
          kepemilikanStr.includes(searchLower) ||
          dateStr.includes(searchLower)

        if (!matchesSearch) return false

        // Status Filter
        if (selectedStatus && item.status !== selectedStatus) {
          return false
        }

        // Kepemilikan Filter
        if (selectedKepemilikan && item.jenis_badan_hukum !== selectedKepemilikan) {
          return false
        }

        // Date Range Filter
        if (startDate || endDate) {
          const itemDate = new Date(item.created_at)
          itemDate.setHours(0, 0, 0, 0)

          if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            if (itemDate < start) return false
          }

          if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            if (itemDate > end) return false
          }
        }

        return true
      }),
    [submissions, searchQuery, selectedStatus, selectedKepemilikan, startDate, endDate]
  )

  // renderTableGroup has been moved to the <TableGroup /> component above.

  if (isLoading) {
    return (
      <div className="w-full overflow-x-hidden space-y-4 md:space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
        {/* === HEADER SECTION SKELETON === */}
        <div className="mb-6">
          <div className="h-7 w-2/3 md:w-64 bg-slate-300 dark:bg-slate-700 rounded mb-2 animate-pulse"></div>
          <div className="h-3 w-[90%] md:w-80 bg-slate-200 dark:bg-slate-800 rounded mb-6 animate-pulse"></div>
        </div>

        {/* === ACTION BAR SKELETON === */}
        <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-3 mb-6">
          {/* Search/Filter Input */}
          <div className="h-11 md:h-10 w-full md:w-72 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          {/* Group on Mobile */}
          <div className="flex w-full md:w-auto gap-2">
            {/* Filter button */}
            <div className="h-11 md:h-10 flex-1 md:w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            {/* Trash Can button */}
            <div className="h-11 w-11 md:h-10 md:w-10 shrink-0 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            {/* Export button */}
            <div className="h-11 md:h-10 flex-1 md:w-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          </div>
          {/* Add Location button */}
          <div className="h-11 md:h-10 w-full md:w-40 bg-slate-300 dark:bg-slate-700 rounded-xl animate-pulse"></div>
        </div>

        {/* === ACCORDION & TABLE LIST SKELETON === */}
        <div className="space-y-6">
          {[1, 2, 3].map((groupIndex) => (
            <div key={groupIndex} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden mb-6">
              {/* Group Header */}
              <div className="h-14 w-full bg-slate-300 dark:bg-slate-800 animate-pulse flex items-center px-4 md:px-5 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-slate-400/50 dark:bg-slate-700/50 rounded-full animate-pulse"></div>
                  <div className="w-5 h-5 bg-slate-400/50 dark:bg-slate-700/50 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-slate-400/50 dark:bg-slate-700/50 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-20 bg-slate-400/50 dark:bg-slate-700/50 rounded-full animate-pulse"></div>
              </div>

              {/* === DESKTOP TABLE VIEW SKELETON === */}
              <div className="hidden md:block overflow-x-auto">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[1, 2, 3, 4].map((rowIndex) => (
                    <div
                      key={rowIndex}
                      className="h-12 w-full bg-slate-100 dark:bg-slate-800 animate-pulse border-b border-gray-100 dark:border-gray-800"
                    ></div>
                  ))}
                </div>
              </div>

              {/* === MOBILE CARD VIEW SKELETON === */}
              <div className="block md:hidden p-4">
                {[1, 2, 3, 4].map((rowIndex) => (
                  <div
                    key={rowIndex}
                    className="h-32 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse mb-3"
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden space-y-4 md:space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      {/* === HEADER SECTION === */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          Daftar Usulan Lokasi (ULOK)
        </h1>
        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pantau status usulan lokasi (ULOK) cabang Anda.
        </p>
      </div>

      {/* === ACTION BAR SECTION === */}
      <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3">

        {/* Mobile Row 1: Search + Filter + Export */}
        <div className="relative flex items-center gap-2 md:contents">

          {/* Search Input */}
          <div className="relative flex-1 md:order-1 md:w-auto md:min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Daftar Lokasi..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200 shadow-sm h-11 md:h-10"
            />
          </div>

          {/* Combined Filter Popover Button */}
          <div className="shrink-0 md:relative md:order-2 md:w-48" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`relative w-11 h-11 md:w-full md:h-10 border rounded-xl bg-white dark:bg-gray-900 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-95 ${
                activeFilterCount > 0
                  ? 'border-[#142B4D] text-[#142B4D] dark:border-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden md:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 md:relative md:top-0 md:right-0"></span>
              )}
            </button>

            {/* Filter Popover Dropdown */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-5 z-40 space-y-4 animate-[fadeIn_0.15s_ease-out]">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#142B4D] dark:text-blue-400" /> Filter Usulan Lokasi
                  </h4>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                    Status Assessor
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                  >
                    <option value="">Semua Status</option>
                    <option value="Draft">ULOK Baru / Belum Direview</option>
                    <option value="In Review">Sedang Direview</option>
                    <option value="Revisi">Butuh Revisi</option>
                    <option value="Approved">Disetujui</option>
                    <option value="Rejected">Ditolak</option>
                  </select>
                </div>

                {/* Kepemilikan Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                    Status Kepemilikan (Badan Hukum)
                  </label>
                  <select
                    value={selectedKepemilikan}
                    onChange={(e) => setSelectedKepemilikan(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                  >
                    <option value="">Semua Kepemilikan</option>
                    <optgroup label="Perorangan">
                      <option value="Perorangan">Perorangan</option>
                      <option value="Waris">Waris</option>
                      <option value="Hibah">Hibah</option>
                      <option value="Kuasa">Kuasa</option>
                    </optgroup>
                    <optgroup label="Badan Hukum">
                      <option value="PT">PT</option>
                      <option value="Yayasan">Yayasan</option>
                      <option value="Koperasi">Koperasi</option>
                    </optgroup>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                    Rentang Tanggal Dibuat
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-gray-400 block mb-0.5">Dari</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-800 p-2 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block mb-0.5">Sampai</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-800 p-2 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full py-2 bg-[#142B4D] hover:bg-[#1a3863] text-white font-bold text-xs rounded-xl shadow transition-all active:scale-[0.98]"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="w-11 h-11 md:w-48 md:h-10 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-blue-950 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shrink-0 shadow-sm disabled:opacity-50 disabled:scale-100 md:order-3"
            title="Ekspor ke CSV"
          >
            {isExporting ? (
              <svg
                className="animate-spin h-4 w-4 text-blue-900 dark:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden md:inline text-xs font-bold whitespace-nowrap">Export CSV</span>
          </button>
        </div>

        {/* Mobile Row 2: Tambah Lokasi Baru + Recycle Bin */}
        <div className="flex items-center gap-2 md:contents">

          {/* Tambah Lokasi Baru Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:order-5 md:flex-none md:w-48 bg-[#142B4D] hover:bg-[#1a3863] dark:bg-[#142B4D] dark:hover:bg-[#1a3863] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md flex items-center gap-2 h-11 md:h-10 justify-center shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Lokasi</span>
          </button>

          {/* Trash Can Button */}
          <button
            onClick={() => router.push('/admin/cabang/usulan-lokasi/recyclebin')}
            className="relative w-11 h-11 md:w-10 md:h-10 md:order-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-red-650 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center shrink-0 shadow-sm"
            title="Tempat Sampah (Recycle Bin)"
          >
            <Trash2 className="w-5 h-5" />
            {deletedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center px-1 shadow-sm">
                {deletedCount > 15 ? '15+' : deletedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* === TABLE CONTENT === */}
      <div className="space-y-6">
        <TableGroup
          title="ULOK Baru"
          allowedStatuses={['Draft']}
          colorStyles="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60"
          filteredSubmissions={filteredSubmissions}
          expandedGroup={expandedGroup}
          currentPage={currentPage}
          expandedRowId={expandedRowId}
          downloadingDocName={downloadingDocName}
          isPending={isPending}
          toggleGroup={toggleGroup}
          setExpandedRowId={setExpandedRowId}
          setCurrentPage={setCurrentPage}
          handleDeleteLocation={handleDeleteLocation}
          handleDownload={handleDownload}
          router={router}
        />
        <TableGroup
          title="Sedang Direview"
          allowedStatuses={['In Review']}
          colorStyles="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60"
          filteredSubmissions={filteredSubmissions}
          expandedGroup={expandedGroup}
          currentPage={currentPage}
          expandedRowId={expandedRowId}
          downloadingDocName={downloadingDocName}
          isPending={isPending}
          toggleGroup={toggleGroup}
          setExpandedRowId={setExpandedRowId}
          setCurrentPage={setCurrentPage}
          handleDeleteLocation={handleDeleteLocation}
          handleDownload={handleDownload}
          router={router}
        />
        <TableGroup
          title="Perlu Revisi"
          allowedStatuses={['Revisi']}
          colorStyles="bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60"
          filteredSubmissions={filteredSubmissions}
          expandedGroup={expandedGroup}
          currentPage={currentPage}
          expandedRowId={expandedRowId}
          downloadingDocName={downloadingDocName}
          isPending={isPending}
          toggleGroup={toggleGroup}
          setExpandedRowId={setExpandedRowId}
          setCurrentPage={setCurrentPage}
          handleDeleteLocation={handleDeleteLocation}
          handleDownload={handleDownload}
          router={router}
        />
        <TableGroup
          title="Disetujui / Ditolak"
          allowedStatuses={['Approved', 'Rejected']}
          colorStyles="bg-green-50 text-green-700 border border-green-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60"
          filteredSubmissions={filteredSubmissions}
          expandedGroup={expandedGroup}
          currentPage={currentPage}
          expandedRowId={expandedRowId}
          downloadingDocName={downloadingDocName}
          isPending={isPending}
          toggleGroup={toggleGroup}
          setExpandedRowId={setExpandedRowId}
          setCurrentPage={setCurrentPage}
          handleDeleteLocation={handleDeleteLocation}
          handleDownload={handleDownload}
          router={router}
        />
      </div>

      {/* === MODAL: KONFIRMASI HAPUS === */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              Apakah Anda yakin ingin menghapus usulan lokasi "{deleteTarget.namaLokasi}"?
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
              >
                No
              </button>
              <button
                onClick={executeDelete}
                disabled={isPending}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 font-bold px-4 py-2 text-sm transition-all flex items-center gap-1.5"
              >
                {isPending ? (
                  <span className="flex items-center gap-1">
                    <svg
                      className="animate-spin h-4 w-4 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Yes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: SUKSES === */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* === MODAL: FORM ULOK === */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out] p-4">
          <div className="w-full max-w-80 space-y-2 animate-[scaleUp_0.2s_ease-out]">
            {/* === HEADER MODAL === */}
            <div className="bg-[#142B4D] text-white p-4 font-bold flex items-center gap-2 rounded-xl shadow-md">
              <Building2 className="w-5 h-5 text-white shrink-0" />
              <span>Tambah Lokasi</span>
            </div>

            {/* === FORM INPUT === */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
              <form id="form-ulok" onSubmit={handleCreateLocation} className="p-6 space-y-2">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Nama Lokasi
                  </label>
                  <input
                    type="text"
                    value={namaLokasi}
                    onChange={(e) => setNamaLokasi(e.target.value)}
                    placeholder="Contoh: Alfamidi Jababeka 2"
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Status Kepemilikan
                  </label>
                  <select
                    value={statusBadan}
                    onChange={(e) => setStatusBadan(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200"
                    required
                  >
                    <option value="" className="bg-white dark:bg-gray-900">
                      Pilih Opsi Kepemilikan
                    </option>
                    <optgroup label="Kelompok Perorangan" className="bg-white dark:bg-gray-900 font-semibold">
                      <option value="Perorangan">Perorangan</option>
                      <option value="Waris">Waris / Ahli Waris</option>
                      <option value="Hibah">Hibah</option>
                      <option value="Kuasa">Kuasa / Penerima Kuasa</option>
                    </optgroup>
                    <optgroup label="Kelompok Badan Hukum" className="bg-white dark:bg-gray-900 font-semibold">
                      <option value="PT">PT (Perseroan Terbatas)</option>
                      <option value="Yayasan">Yayasan</option>
                      <option value="Koperasi">Koperasi</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Nama Pemegang Hak
                  </label>
                  <input
                    type="text"
                    value={namaPemegang}
                    onChange={(e) => setNamaPemegang(e.target.value)}
                    placeholder="Nama pemilik asli sertifikat"
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200"
                    required
                  />
                </div>
              </form>
            </div>

            {/* === FOOTER: AKSI === */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 flex items-center gap-1 p-1">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
              >
                Batal
              </button>
              <button
                type="submit"
                form="form-ulok"
                className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-[#142B4D] hover:bg-[#1a3863] transition-all duration-200 active:scale-95 shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
