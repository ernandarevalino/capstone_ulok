'use client'

import React, { useEffect, useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getPengelompokanData, UlokGroupItem, PengelompokanResult } from '@/actions/pengelompokan'
import { exportUlokSubmissionsCSV } from '@/actions/export'
import {
  Download,
  FilePlus,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckSquare,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileSearch,
  X,
  Check,
  AlertCircle,
  ClipboardList,
  Inbox,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

type TabId = 'baruMasuk' | 'antreanAktif' | 'patutDilihat' | 'perluRevisi' | 'selesai'

const BADAN_HUKUM_OPTIONS = ['PT', 'Koperasi', 'Yayasan', 'Perorangan', 'Kuasa', 'Waris', 'Hibah']
const ITEMS_PER_PAGE = 10

const TABS: {
  id: TabId
  label: string
  subtitle: string
  icon: React.ElementType
}[] = [
  { id: 'patutDilihat', label: 'Patut Dilihat', subtitle: 'Rekomendasi Prioritas', icon: Sparkles },
  { id: 'baruMasuk', label: 'Baru Masuk', subtitle: 'Usulan Baru (Draft)', icon: FilePlus },
  { id: 'antreanAktif', label: 'Antrean Aktif', subtitle: 'Sedang Proses Review', icon: Clock },
  { id: 'perluRevisi', label: 'Perlu Revisi', subtitle: 'Dikembalikan ke Cabang', icon: AlertTriangle },
  { id: 'selesai', label: 'Selesai Dinilai', subtitle: 'Approved & Rejected', icon: CheckSquare },
]

// ---------------------------------------------------------------------------
// Small formatting / style helpers
// ---------------------------------------------------------------------------

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value: string) {
  const date = new Date(value)
  const datePart = formatDate(value)
  const timePart = date
    .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
    .replace(/\./g, ':')
  return `${datePart}, ${timePart} WIB`
}

function getProgressColorClass(persentase: number) {
  if (persentase >= 100) return 'bg-emerald-500'
  if (persentase >= 60) return 'bg-blue-600'
  if (persentase >= 20) return 'bg-amber-500'
  return 'bg-rose-500'
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'Approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
    case 'Revisi':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50'
    case 'Rejected':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
    case 'In Review':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
    case 'Draft':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  }
}

function getTabColorClasses(id: TabId, active: boolean) {
  const palette: Record<TabId, { border: string; text: string; bg: string; badge: string }> = {
    baruMasuk: {
      border: 'border-blue-600 dark:border-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    },
    antreanAktif: {
      border: 'border-amber-600 dark:border-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    },
    patutDilihat: {
      border: 'border-purple-600 dark:border-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
    },
    perluRevisi: {
      border: 'border-rose-600 dark:border-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    },
    selesai: {
      border: 'border-emerald-600 dark:border-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
  }
  return palette[id]
}

// ---------------------------------------------------------------------------
// Skeleton components (replace all loading spinners)
// ---------------------------------------------------------------------------

function TableRowSkeleton({ showScoreColumn }: { showScoreColumn: boolean }) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-[pulse_1.5s_ease-in-out_infinite]">
      {/* Nama ULOK */}
      <td className="p-4 pl-6">
        <div className="flex gap-2 items-start">
          <div className="w-3.5 h-3.5 mt-1 bg-slate-200 dark:bg-slate-700 rounded-sm" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </td>
      {/* Cabang */}
      <td className="p-4">
        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-md" />
      </td>
      {/* Jenis */}
      <td className="p-4">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      </td>
      {/* Tgl Dibuat */}
      <td className="p-4">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      </td>
      {/* Last Review */}
      <td className="p-4">
        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
      </td>
      {/* Progress / Score */}
      <td className={showScoreColumn ? 'p-4 text-center' : 'p-4 w-52'}>
        {showScoreColumn ? (
          <div className="space-y-1 flex flex-col items-center">
            <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-2 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ) : (
          <div className="space-y-2 w-full max-w-[180px]">
            <div className="flex justify-between">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        )}
      </td>
      {/* Status */}
      <td className="p-4 text-center">
        <div className="h-6 w-20 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full" />
      </td>
      {/* Aksi */}
      <td className="p-4 text-center">
        <div className="h-8 w-8 mx-auto bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </td>
    </tr>
  )
}

function CardSkeleton() {
  return (
    <div className="p-4 w-full bg-white dark:bg-gray-900 animate-[pulse_1.5s_ease-in-out_infinite]">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="flex gap-2 mt-3">
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" />
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="flex justify-between mt-3">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="space-y-2 mt-4">
        <div className="flex justify-between">
          <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="mt-4 flex justify-end">
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Checklist panel (shared by desktop accordion row + mobile card expansion)
// ---------------------------------------------------------------------------

function ChecklistList({
  item,
  downloadingDocName,
  onDownload,
}: {
  item: any
  downloadingDocName: string | null
  onDownload: (url: string, filename: string) => void
}) {
  if (!item.checklistStatus || item.checklistStatus.length === 0) {
    return (
      <div className="col-span-full py-4 text-center text-xs text-gray-400 italic">
        Tidak ada data checklist wajib untuk badan hukum ini.
      </div>
    )
  }

  return (
    <>
      {item.checklistStatus.map((doc: any, idx: number) => {
        const isUploaded = doc.is_uploaded
        const isVerified = !!doc.is_verified

        let rowClass = ''
        let IconComponent = X
        let iconWrapClass = ''
        let textClass = ''
        let badgeText = ''
        let badgeClass = ''

        if (!isUploaded) {
          rowClass =
            'bg-gray-50/40 dark:bg-gray-950/10 border-gray-150 dark:border-gray-900/40 hover:border-gray-250 dark:hover:border-gray-800'
          IconComponent = X
          iconWrapClass =
            'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-900/60'
          textClass = 'text-gray-400 dark:text-gray-500'
          badgeText = 'BELUM TERUNGGAH'
          badgeClass =
            'bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-450 border border-gray-200 dark:border-gray-800/80'
        } else if (!isVerified) {
          rowClass =
            'bg-amber-50/30 dark:bg-amber-950/10 border-amber-100/80 dark:border-amber-900/30 hover:border-amber-250 dark:hover:border-amber-800'
          IconComponent = AlertTriangle
          iconWrapClass = 'text-amber-500 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40'
          textClass = 'text-gray-800 dark:text-gray-205'
          badgeText = 'BELUM SESUAI'
          badgeClass =
            'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
        } else {
          rowClass =
            'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/80 dark:border-emerald-900/30 hover:border-emerald-250 dark:hover:border-emerald-800'
          IconComponent = Check
          iconWrapClass = 'text-emerald-500 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40'
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
              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${iconWrapClass}`}>
                <IconComponent className="w-3 h-3" strokeWidth={3} />
              </span>
              <span className={`text-xs font-semibold truncate ${textClass}`} title={doc.nama_dokumen}>
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
                      title="Lihat Berkas"
                    >
                      <Eye className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      disabled={downloadingDocName === doc.nama_dokumen}
                      onClick={(e) => {
                        e.stopPropagation()
                        onDownload(doc.file_url!, doc.nama_dokumen)
                      }}
                      className="p-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center disabled:opacity-50"
                      title="Unduh Berkas"
                    >
                      {downloadingDocName === doc.nama_dokumen ? (
                        <Loader2 className="w-3 h-3 animate-spin text-blue-900 dark:text-blue-500" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

function ChecklistPanel({
  item,
  downloadingDocName,
  onDownload,
}: {
  item: any
  downloadingDocName: string | null
  onDownload: (url: string, filename: string) => void
}) {
  return (
    <div className="bg-white dark:bg-gray-950 rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800/85 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h4 className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
            <ClipboardList className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            Status Checklist Dokumen ({item.persentase}% - {item.numerator}/{item.denominator} Terupload)
          </h4>
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Terakhir direview oleh:{' '}
            <strong className="font-semibold text-slate-800 dark:text-slate-100">
              {item.reviewer_name || '-'}
            </strong>
          </span>
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Jenis: {item.jenis_badan_hukum}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ChecklistList item={item} downloadingDocName={downloadingDocName} onDownload={onDownload} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Progress / status cells shared by desktop table + mobile card
// ---------------------------------------------------------------------------

function ProgressCell({ item, activeTab }: { item: any; activeTab: TabId }) {
  if (activeTab === 'selesai') {
    return item.saw?.final_score !== undefined && item.saw?.final_score !== null ? (
      <div className="inline-flex flex-col items-center">
        <span className="font-mono text-base font-extrabold text-purple-700 dark:text-purple-400">
          {item.saw.final_score.toFixed(3)}
        </span>
        <span className="text-[10px] text-gray-400 font-medium">SPK SAW Rank Score</span>
      </div>
    ) : (
      <span className="text-xs text-gray-400 italic">Skor Belum Dihitung</span>
    )
  }

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-center text-[11px] font-semibold gap-1">
        <span className="text-gray-500 dark:text-gray-400 font-medium text-[11px]">
          {item.numerator}/{item.denominator} Dokumen Terupload
        </span>
        <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px]">
          {item.persentase.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressColorClass(item.persentase)}`}
          style={{ width: `${item.persentase}%` }}
        />
      </div>
      {activeTab === 'patutDilihat' && (
        <div className="mt-2 bg-gradient-to-br from-purple-50 to-slate-50 dark:from-purple-950/20 dark:to-slate-900/20 border border-purple-100 dark:border-purple-900/50 shadow-sm rounded-xl p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold text-[10px]">
            <Sparkles className="w-3 h-3" />
            <span>{item.recommendation_reason || 'Alas hak aman & harga sewa ramah anggaran'}</span>
          </div>
          <div className="text-[9px] font-medium text-purple-800 dark:text-purple-300">
            Sewa: {item.harga_sewa ? `Rp ${item.harga_sewa.toLocaleString('id-ID')}` : 'N/A'}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PengelompokanDashboard() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // State
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<PengelompokanResult>({
    baruMasuk: [],
    antreanAktif: [],
    patutDilihat: [],
    perluRevisi: [],
    selesai: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('patutDilihat')
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedBadanHukum, setSelectedBadanHukum] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showFilterPopover, setShowFilterPopover] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [downloadingDocName, setDownloadingDocName] = useState<string | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  const handleDownload = async (url: string, filename: string) => {
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
        // fallback: keep original filename
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
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const res = await exportUlokSubmissionsCSV('assessor')
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

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const res = await getPengelompokanData()
      if (res.success && res.data) {
        setData(res.data)
      } else {
        setError(res.error || 'Terjadi kesalahan saat memuat data.')
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pengelompokan.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (id: string, jenisBadanHukum: string) => {
    const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa']
    const route = kelompokPerorangan.includes(jenisBadanHukum)
      ? '/admin/assessor/penilaian/ulok-perorangan'
      : '/admin/assessor/penilaian/ulok-badanhukum'

    router.push(`${route}?id=${id}`)
  }

  const queryLower = useMemo(() => searchQuery.toLowerCase(), [searchQuery])

  const applyAllFilters = useCallback(
    (item: UlokGroupItem) => {
      let matchesSearch = true
      if (queryLower) {
        const namaLokasi = (item.nama_lokasi || '').toLowerCase()
        const namaPemilik = (item.nama_pemegang_hak || '').toLowerCase()
        const asalCabang = (item.profiles?.branches?.nama_cabang || '').toLowerCase()
        const jenisBadanHukum = (item.jenis_badan_hukum || '').toLowerCase()

        matchesSearch =
          namaLokasi.includes(queryLower) ||
          namaPemilik.includes(queryLower) ||
          asalCabang.includes(queryLower) ||
          jenisBadanHukum.includes(queryLower)
      }

      const matchesBranch = selectedBranch === 'all' || item.profiles?.branches?.nama_cabang === selectedBranch
      const matchesBadanHukum = selectedBadanHukum === 'all' || item.jenis_badan_hukum === selectedBadanHukum

      let matchDate = true
      if (startDate || endDate) {
        if (!item.last_reviewed_at) {
          matchDate = false
        } else {
          const reviewDate = new Date(item.last_reviewed_at)
          reviewDate.setHours(0, 0, 0, 0)

          if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            if (reviewDate < start) matchDate = false
          }
          if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            if (reviewDate > end) matchDate = false
          }
        }
      }

      return matchesSearch && matchesBranch && matchesBadanHukum && matchDate
    },
    [queryLower, selectedBranch, selectedBadanHukum, startDate, endDate]
  )

  const filteredBaruMasuk = useMemo(() => data.baruMasuk.filter(applyAllFilters), [data.baruMasuk, applyAllFilters])
  const filteredAntreanAktif = useMemo(
    () => data.antreanAktif.filter(applyAllFilters),
    [data.antreanAktif, applyAllFilters]
  )
  const filteredPatutDilihat = useMemo(
    () => data.patutDilihat.filter(applyAllFilters),
    [data.patutDilihat, applyAllFilters]
  )
  const filteredPerluRevisi = useMemo(
    () => data.perluRevisi.filter(applyAllFilters),
    [data.perluRevisi, applyAllFilters]
  )
  const filteredSelesai = useMemo(() => {
    const list = data.selesai.filter(applyAllFilters)
    return [...list].sort((a, b) => (b.saw?.final_score || 0) - (a.saw?.final_score || 0))
  }, [data.selesai, applyAllFilters])

  const filteredData = useMemo(() => {
    switch (activeTab) {
      case 'baruMasuk':
        return filteredBaruMasuk
      case 'antreanAktif':
        return filteredAntreanAktif
      case 'patutDilihat':
        return filteredPatutDilihat
      case 'perluRevisi':
        return filteredPerluRevisi
      case 'selesai':
        return filteredSelesai
      default:
        return []
    }
  }, [activeTab, filteredBaruMasuk, filteredAntreanAktif, filteredPatutDilihat, filteredPerluRevisi, filteredSelesai])

  const tabCounts = useMemo(
    () => ({
      baruMasuk: filteredBaruMasuk.length,
      antreanAktif: filteredAntreanAktif.length,
      patutDilihat: filteredPatutDilihat.length,
      perluRevisi: filteredPerluRevisi.length,
      selesai: filteredSelesai.length,
    }),
    [filteredBaruMasuk, filteredAntreanAktif, filteredPatutDilihat, filteredPerluRevisi, filteredSelesai]
  )

  const allBranches = useMemo(() => {
    return Array.from(
      new Set(
        [...data.baruMasuk, ...data.antreanAktif, ...data.patutDilihat, ...data.perluRevisi, ...data.selesai]
          .map((item) => item.profiles?.branches?.nama_cabang)
          .filter(Boolean) as string[]
      )
    ).sort()
  }, [data])

  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1
  const displayedItems = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const activeFilterCount = [
    selectedBranch !== 'all' ? selectedBranch : null,
    selectedBadanHukum !== 'all' ? selectedBadanHukum : null,
    startDate,
    endDate,
  ].filter(Boolean).length

  const handleResetFilters = () => {
    setSelectedBranch('all')
    setSelectedBadanHukum('all')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setExpandedRowId(null)
  }

  const activeTabConfig = TABS.find((t) => t.id === activeTab)!
  const ActiveTabIcon = activeTabConfig.icon
  const showScoreColumn = activeTab === 'selesai'

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      <div className="space-y-6">
        
        {/* --- HEADER--- */}
        {loading ? (
          <>
            {/* Title Skeleton */}
            <div className="space-y-2 mb-6 animate-pulse">
              <div className="h-7 md:h-8 w-56 md:w-72 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-3.5 md:h-4 w-64 md:w-96 max-w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
            {/* Action Bar Skeleton */}
            <div className="mb-4 flex flex-row items-center gap-2 animate-pulse">
              <div className="h-11 sm:h-10 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-11 w-11 sm:h-10 sm:w-24 shrink-0 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-11 w-11 sm:h-10 sm:w-24 shrink-0 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-11 w-11 sm:h-10 sm:w-28 shrink-0 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                Progress ULOK
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
                Evaluasi berkas usulan lokasi berdasarkan progress pengunggahan dokumen dan penilaian kelayakan.
              </p>
            </div>

            {/* --- SEARCH + ACTIONS --- */}
            <div className="mb-4 flex flex-row items-center gap-2 relative z-50">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari lokasi, pemilik, cabang..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-11 sm:h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-2.5 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#142B4D] dark:focus:ring-blue-500 transition"
            />
          </div>

          {/* Filter */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className={`relative flex h-11 w-11 sm:h-10 sm:w-auto items-center justify-center gap-2 rounded-xl border transition-all active:scale-95 shadow-sm sm:px-4 ${
                activeFilterCount > 0
                  ? 'border-[#142B4D] bg-blue-50/50 text-[#142B4D] dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
              title="Filter Data"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-semibold">Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 md:relative md:top-0 md:right-0"></span>
              )}
            </button>

            {showFilterPopover && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowFilterPopover(false)} />
                <div className="absolute -right-13 mt-2 w-74 -mr-13 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-5 z-50 space-y-4 animate-[fadeIn_0.15s_ease-out]">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-950 dark:text-white">
                      <Filter className="w-4 h-4 text-[#142B4D] dark:text-blue-400" /> Filter Usulan
                    </h4>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={handleResetFilters}
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Asal Cabang</label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => {
                        setSelectedBranch(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142B4D] dark:focus:ring-blue-500"
                    >
                      <option value="all">Semua Cabang</option>
                      {allBranches.map((br) => (
                        <option key={br} value={br}>{br}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Jenis Badan Hukum</label>
                    <select
                      value={selectedBadanHukum}
                      onChange={(e) => {
                        setSelectedBadanHukum(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142B4D] dark:focus:ring-blue-500"
                    >
                      <option value="all">Semua Jenis</option>
                      {BADAN_HUKUM_OPTIONS.map((bh) => (
                        <option key={bh} value={bh}>{bh}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Terakhir Direview (Last Review)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">Dari</span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value)
                            setCurrentPage(1)
                          }}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#142B4D] dark:focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">Sampai</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value)
                            setCurrentPage(1)
                          }}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#142B4D] dark:focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setShowFilterPopover(false)}
                      className="w-full py-2 bg-[#142B4D] hover:bg-[#1a3863] text-white font-bold text-xs rounded-xl shadow transition-all active:scale-[0.98]"
                    >
                      Terapkan Filter
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            title="Ekspor Data ke CSV"
            className="flex h-11 w-11 shrink-0 sm:h-10 sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 disabled:scale-100 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 sm:px-4"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-600 dark:text-slate-300" />
            ) : (
              <Download className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            )}
            <span className="hidden sm:inline text-sm font-semibold">Export</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={mounted ? loading : false}
            title="Muat Ulang Data"
            className="flex h-11 w-11 shrink-0 sm:h-10 sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 sm:px-4"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${loading && mounted ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-sm font-semibold">Refresh</span>
          </button>
        </div>
      </>
    )}

    {/* --- TABS --- */}
        <div className="mb-5 mt-6 -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex gap-2 sm:flex-wrap">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[180px] sm:w-auto sm:flex-1 sm:min-w-[170px] rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 animate-[pulse_1.5s_ease-in-out_infinite]"
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="w-20 h-4 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="w-7 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="w-28 h-2.5 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))
            ) : (
              TABS.map((tab) => {
                const isActive = activeTab === tab.id
                const colors = getTabColorClasses(tab.id, isActive)
                const TabIcon = tab.icon
                const count = tabCounts[tab.id]

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex-shrink-0 w-[180px] sm:w-auto sm:flex-1 sm:min-w-[170px] rounded-xl border px-4 py-3 text-left transition-all focus:outline-none ${
                      isActive
                        ? `${colors.border} ${colors.bg} border-2 shadow-sm`
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className={`flex items-center gap-1.5 ${isActive ? colors.text : 'text-gray-500 dark:text-gray-400'}`}>
                        <TabIcon className="w-4 h-13" />
                        <span className={`font-bold text-[13px] ${isActive ? colors.text : 'text-gray-700 dark:text-gray-200'}`}>
                          {tab.label}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black select-none ${colors.badge}`}>
                        {count}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-gray-400 -mt-3 mb-3 font-normal truncate">{tab.subtitle}</p>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* --- ERROR --- */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="font-medium text-sm">{error}</div>
          </div>
        )}

        {/* --- CONTENT CARD --- */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-900 shadow-sm">
          {/* Header bar */}
          {loading ? (
            <div className="flex items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/50 px-4 py-3 sm:px-6 border-b border-gray-100 dark:border-gray-800 animate-pulse w-full">
              <div className="flex items-center gap-3">
                <div className="w-5 h-6 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-40 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 bg-[#142B4D] dark:bg-slate-900 px-4 py-3 sm:px-6 text-white w-full">
              <div className="flex items-center gap-3 min-w-0">
                <ActiveTabIcon className="w-5 h-10 shrink-0" />
                <span className="shrink-0 text-white/80 font-bold">List Usulan -</span>
                <span className="truncate text-sm sm:text-base font-bold">
                  {activeTabConfig.label}
                </span>
              </div>
              <span className="flex-shrink-0 text-[14px] font-semibold text-slate-300">
                {totalItems} usulan
              </span>
            </div>
          )}

          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="py-16 px-4 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <Inbox className="w-8 h-8" />
                <span className="text-sm font-semibold">Tidak ada usulan lokasi di kelompok ini.</span>
                <span className="text-xs text-gray-500">Gunakan kata kunci pencarian lain atau sinkronkan data.</span>
              </div>
            ) : (
              displayedItems.map((item: any) => {
                const branchName = item.profiles?.branches?.nama_cabang || 'Cabang Pusat'
                const isExpanded = expandedRowId === item.id

                return (
                  <div key={item.id} className="p-4">
                    <button
                      onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-gray-950 dark:text-white text-sm">
                              {item.nama_lokasi}
                            </span>
                            {item.is_smart_recommended === true && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 select-none">
                                HIGH POTENTIAL
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">a.n {item.nama_pemegang_hak || '-'}</div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-block px-2 py-0.5 text-[10.5px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                          {branchName}
                        </span>
                        <span className="text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                          {item.jenis_badan_hukum}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10.5px] text-gray-400">
                        <span>Dibuat: {formatDate(item.created_at)}</span>
                        <span>{item.last_reviewed_at ? formatDateTime(item.last_reviewed_at) : 'Belum direview'}</span>
                      </div>

                      <div className="mt-3">
                        <ProgressCell item={item} activeTab={activeTab} />
                      </div>
                    </button>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetail(item.id, item.jenis_badan_hukum)
                        }}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 disabled:opacity-50 transition"
                      >
                        <FileSearch className="w-3.5 h-3.5" />
                        Detail
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3">
                        <ChecklistPanel item={item} downloadingDocName={downloadingDocName} onDownload={handleDownload} />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className={loading ? "animate-pulse" : ""}>
                <tr className="bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <th className="p-4 pl-6">
                    {loading ? (
                      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                    ) : (
                      "Nama ULOK"
                    )}
                  </th>
                  <th className="p-4">
                    {loading ? (
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    ) : (
                      "Asal Cabang"
                    )}
                  </th>
                  <th className="p-4">
                    {loading ? (
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    ) : (
                      "Jenis"
                    )}
                  </th>
                  <th className="p-4">
                    {loading ? (
                      <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                    ) : (
                      "Tanggal Dibuat"
                    )}
                  </th>
                  <th className="p-4">
                    {loading ? (
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    ) : (
                      "Last Review"
                    )}
                  </th>
                  {showScoreColumn ? (
                    <th className="p-4 text-center font-bold text-slate-800 dark:text-white">
                      {loading ? (
                        <div className="h-3 w-32 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
                      ) : (
                        "Skor Rekomendasi SAW"
                      )}
                    </th>
                  ) : (
                    <th className="p-4 w-52 text-left">
                      {loading ? (
                        <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                      ) : (
                        "Progress Upload Dokumen"
                      )}
                    </th>
                  )}
                  <th className="p-4 text-center">
                    {loading ? (
                      <div className="h-3 w-16 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
                    ) : (
                      "Status"
                    )}
                  </th>
                  <th className="p-4 text-center w-28">
                    {loading ? (
                      <div className="h-3 w-12 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
                    ) : (
                      "Aksi"
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} showScoreColumn={showScoreColumn} />
                  ))
                ) : displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Inbox className="w-8 h-8" />
                        <span className="text-sm font-semibold">Tidak ada usulan lokasi di kelompok ini.</span>
                        <span className="text-xs text-gray-500">
                          Gunakan kata kunci pencarian lain atau sinkronkan data.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((item: any) => {
                    const branchName = item.profiles?.branches?.nama_cabang || 'Cabang Pusat'
                    const isExpanded = expandedRowId === item.id

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                          className={`cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40 select-none ${
                            isExpanded ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''
                          } transition-colors duration-200`}
                        >
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-2">
                              <ChevronDown
                                className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-bold text-gray-950 dark:text-white text-[14px]">
                                    {item.nama_lokasi}
                                  </span>
                                  {item.is_smart_recommended === true && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 select-none">
                                      HIGH POTENTIAL
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-0.5">
                                  a.n {item.nama_pemegang_hak || '-'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="inline-block px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                              {branchName}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {item.jenis_badan_hukum}
                            </span>
                          </td>

                          <td className="p-4 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {formatDate(item.created_at)}
                          </td>

                          <td className="p-4 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {item.last_reviewed_at ? formatDateTime(item.last_reviewed_at) : '-'}
                          </td>

                          <td className={showScoreColumn ? 'p-4 text-center' : 'p-4 w-52'}>
                            <div className={showScoreColumn ? '' : 'w-full max-w-[180px]'}>
                              <ProgressCell item={item} activeTab={activeTab} />
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadgeClass(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetail(item.id, item.jenis_badan_hukum)
                              }}
                              disabled={isPending}
                              title="Lihat Detail"
                              className="p-2 hover:scale-110 active:scale-95 disabled:opacity-50 transition inline-flex items-center justify-center text-slate-600 dark:text-slate-300"
                            >
                              <FileSearch className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-gray-50/60 dark:bg-gray-900/30 transition-all duration-300">
                            <td colSpan={8} className="p-5 border-t border-gray-100 dark:border-gray-800">
                              <ChecklistPanel
                                item={item}
                                downloadingDocName={downloadingDocName}
                                onDownload={handleDownload}
                              />
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

          {/* --- PAGINATION --- */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition text-xs font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition text-xs font-semibold"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}