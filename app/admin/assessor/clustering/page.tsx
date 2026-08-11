'use client'

import React, { useEffect, useState, useTransition, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getClusteringData, ClusteringResult } from '@/actions/clustering'
import { transitionDraftToInReview } from '@/actions/assessor'
import { exportUlokSubmissionsCSV } from '@/actions/export'
import {
  Trophy, Medal, AlertCircle, MapPin, ChevronDown, ChevronUp,
  Star, Award, Sparkles, Download, Clock, Zap, AlertTriangle,
  Layers, CheckSquare, RefreshCw, Filter, Search, FileText,
  LayoutDashboard, TrendingUp, BarChart3, ClipboardCheck
} from 'lucide-react'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine
} from 'recharts'

export default function ClusteringDashboardPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isMounted, setIsMounted] = useState(false)

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [quadrantHover, setQuadrantHover] = useState<{
    label: string
    subtitle: string
    x: number
    y: number
  } | null>(null)

  const quadrantInfo = {
    c3: { label: 'Cluster 1', subtitle: 'Lengkap & Cepat (≥80%, ≤7 Hari)' },
    c2: { label: 'Cluster 2', subtitle: 'Belum Lengkap & Cepat (<80%, ≤7 Hari)' },
    c1: { label: 'Cluster 3', subtitle: 'Lengkap & Lambat (≥80%, >7 Hari)' },
    c4: { label: 'Cluster 4', subtitle: 'Belum Lengkap & Lambat (<80%, >7 Hari)' }
  }

  const handleQuadrantHover = (key: keyof typeof quadrantInfo) => (e: any) => {
    const rect = chartContainerRef.current?.getBoundingClientRect()
    if (!rect) return
    setQuadrantHover({
      ...quadrantInfo[key],
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleQuadrantLeave = () => setQuadrantHover(null)

  // State
  const [data, setData] = useState<ClusteringResult>({
    c1: [],
    c2: [],
    c3: [],
    c4: [],
    leaderboard: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tab State: 'dashboard', 'c3' (Cluster 1), 'c2' (Cluster 2), 'c1' (Cluster 3), 'c4' (Cluster 4)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'c3' | 'c2' | 'c1' | 'c4'>('dashboard')

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedBadanHukum, setSelectedBadanHukum] = useState<string>('all')
  const [showFilterPopover, setShowFilterPopover] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [downloadingDocName, setDownloadingDocName] = useState<string | null>(null)

  // Accordion State
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getClusteringData()
      if (res.success && res.data) {
        setData(res.data)
      } else {
        setError(res.error || 'Gagal memuat data matriks clustering')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data clustering')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    loadData()
  }, [])

  // File download handler
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
        // fallback
      }

      a.download = actualFilename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Gagal mendownload file:", error)
      alert("Gagal mengunduh berkas. Silakan coba lagi.")
    } finally {
      setDownloadingDocName(null)
    }
  }

  // Export CSV Handler
  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const res = await exportUlokSubmissionsCSV('assessor')
      if (res.success && res.csvData && res.filename) {
        const blob = new Blob([res.csvData], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", res.filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        alert("Gagal mengekspor CSV: " + (res.error || 'Terjadi kesalahan'))
      }
    } catch (error: any) {
      console.error("Gagal mengekspor CSV:", error)
      alert("Gagal mengekspor CSV. Silakan coba lagi.")
    } finally {
      setIsExporting(false)
    }
  }

  // Detail View Navigation
  const handleViewDetail = (id: string, jenisBadanHukum: string, status: string) => {
    const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa']
    const route = kelompokPerorangan.includes(jenisBadanHukum)
      ? '/admin/assessor/penilaian/ulok-perorangan'
      : '/admin/assessor/penilaian/ulok-badanhukum'

    startTransition(async () => {
      if (status === 'Draft') {
        const res = await transitionDraftToInReview(id)
        if (!res.success) {
          alert(res.error || 'Gagal memperbarui status usulan')
          return
        }
      }
      router.push(`${route}?id=${id}`)
    })
  }

  // Filter Helper
  const queryLower = useMemo(() => searchQuery.toLowerCase(), [searchQuery])

  const applyAllFilters = useCallback((item: any) => {
    let matchesSearch = true
    if (queryLower) {
      const namaLokasi = (item.nama_lokasi || '').toLowerCase()
      const namaPemilik = (item.nama_pemegang_hak || '').toLowerCase()
      const asalCabang = (item.profiles?.branches?.nama_cabang || '').toLowerCase()
      const jenisBadanHukum = (item.jenis_badan_hukum || '').toLowerCase()

      matchesSearch = (
        namaLokasi.includes(queryLower) ||
        namaPemilik.includes(queryLower) ||
        asalCabang.includes(queryLower) ||
        jenisBadanHukum.includes(queryLower)
      )
    }

    const matchesBranch = selectedBranch === 'all' || item.profiles?.branches?.nama_cabang === selectedBranch
    const matchesBadanHukum = selectedBadanHukum === 'all' || item.jenis_badan_hukum === selectedBadanHukum

    return matchesSearch && matchesBranch && matchesBadanHukum
  }, [queryLower, selectedBranch, selectedBadanHukum])

  // Filtered lists for each cluster
  const filteredC3 = useMemo(() => data.c3.filter(applyAllFilters), [data.c3, applyAllFilters])
  const filteredC2 = useMemo(() => data.c2.filter(applyAllFilters), [data.c2, applyAllFilters])
  const filteredC1 = useMemo(() => data.c1.filter(applyAllFilters), [data.c1, applyAllFilters])
  const filteredC4 = useMemo(() => data.c4.filter(applyAllFilters), [data.c4, applyAllFilters])

  const tabCounts = useMemo(() => ({
    c3: filteredC3.length,
    c2: filteredC2.length,
    c1: filteredC1.length,
    c4: filteredC4.length,
  }), [filteredC3, filteredC2, filteredC1, filteredC4])

  // Get active cluster list
  const activeClusterData = useMemo(() => {
    switch (activeTab) {
      case 'c3': return filteredC3
      case 'c2': return filteredC2
      case 'c1': return filteredC1
      case 'c4': return filteredC4
      default: return []
    }
  }, [activeTab, filteredC3, filteredC2, filteredC1, filteredC4])

  // Extract unique branch list
  const allBranches = useMemo(() => {
    const combined = [...data.c1, ...data.c2, ...data.c3, ...data.c4]
    return Array.from(
      new Set(
        combined.map((item) => item.profiles?.branches?.nama_cabang).filter(Boolean) as string[]
      )
    ).sort()
  }, [data])

  const badanHukumOptions = ['PT', 'Koperasi', 'Yayasan', 'Perorangan', 'Kuasa', 'Waris', 'Hibah']
  const activeFilterCount = (selectedBranch !== 'all' ? 1 : 0) + (selectedBadanHukum !== 'all' ? 1 : 0)

  // Pagination for cluster table
  const totalItems = activeClusterData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const displayedItems = activeClusterData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleTabChange = (tab: 'dashboard' | 'c3' | 'c2' | 'c1' | 'c4') => {
    setActiveTab(tab)
    setCurrentPage(1)
    setExpandedRowId(null)
  }

  // Dashboard calculations
  const totalUsulan = data.c1.length + data.c2.length + data.c3.length + data.c4.length
  const avgCompleteness = useMemo(() => {
    if (totalUsulan === 0) return 0
    const sum = [...data.c1, ...data.c2, ...data.c3, ...data.c4].reduce((sum, item) => sum + (item.persentase || 0), 0)
    return sum / totalUsulan
  }, [data, totalUsulan])

  const avgDuration = useMemo(() => {
    if (totalUsulan === 0) return 0
    const sum = [...data.c1, ...data.c2, ...data.c3, ...data.c4].reduce((sum, item) => sum + (item.durasi_hari || 0), 0)
    return sum / totalUsulan
  }, [data, totalUsulan])

  const maxX = useMemo(() => {
    const combined = [...data.c1, ...data.c2, ...data.c3, ...data.c4]
    const maxVal = combined.reduce((max, item) => Math.max(max, item.durasi_hari || 0), 0)
    return Math.max(14, maxVal + 4)
  }, [data])

  // Custom Scatter Tooltip
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-white dark:bg-zinc-900 p-4 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl space-y-2 text-xs max-w-xs transition-colors duration-200">
          <div className="font-bold text-gray-900 dark:text-gray-100 text-[13px]">{item.nama_lokasi}</div>
          <div className="text-[10px] text-gray-400">a.n {item.nama_pemegang_hak || '-'}</div>
          <hr className="border-gray-100 dark:border-zinc-800" />
          <div className="space-y-1 text-gray-600 dark:text-gray-300">
            <p><span className="text-gray-400">Cabang:</span> <strong className="font-bold text-gray-700 dark:text-gray-200">{item.profiles?.branches?.nama_cabang || '-'}</strong></p>
            <p><span className="text-gray-400">Kelengkapan:</span> <strong className="font-bold text-[#F28705]">{item.persentase?.toFixed(1)}%</strong> ({item.numerator}/{item.denominator} Dokumen)</p>
            <p><span className="text-gray-400">Durasi:</span> <strong className="font-bold text-gray-700 dark:text-gray-200">{item.durasi_hari} Hari</strong></p>
            <p><span className="text-gray-400">Status:</span> <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200">{item.status}</span></p>
          </div>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D0D] flex items-center justify-center transition-colors">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#3365A6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 animate-pulse">
            Menyusun Matriks Clustering ULOK...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D0D] p-6 flex items-center justify-center transition-colors">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm max-w-md text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-[#D91E2E] mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-150">Gagal Memuat Data Clustering</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={loadData}
            className="w-full bg-[#3365A6] text-white font-bold py-2.5 rounded-xl text-xs transition active:scale-95 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D0D] p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* === DASHBOARD TITLE & ACTIONS === */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Dashboard Clustering ULOK
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
              Analisis kuadran usulan lokasi berdasarkan persentase kelengkapan berkas dan durasi pengumpulan.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Filter Popover Button */}
            {activeTab !== 'dashboard' && (
              <div className="relative">
                <button
                  onClick={() => setShowFilterPopover(!showFilterPopover)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-850 transition active:scale-95 cursor-pointer"
                >
                  <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3365A6] text-[10px] font-black text-white select-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {showFilterPopover && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setShowFilterPopover(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xl z-50 space-y-4 animate-fadeIn">
                      <h4 className="text-sm font-bold text-gray-950 dark:text-white pb-2 border-b border-gray-100 dark:border-zinc-850">
                        Filter Cluster ULOK
                      </h4>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          Asal Cabang
                        </label>
                        <select
                          value={selectedBranch}
                          onChange={(e) => {
                            setSelectedBranch(e.target.value)
                            setCurrentPage(1)
                          }}
                          className="w-full px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="all">Semua Cabang</option>
                          {allBranches.map((br: any) => (
                            <option key={br} value={br}>
                              {br}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          Jenis Badan Hukum
                        </label>
                        <select
                          value={selectedBadanHukum}
                          onChange={(e) => {
                            setSelectedBadanHukum(e.target.value)
                            setCurrentPage(1)
                          }}
                          className="w-full px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="all">Semua Jenis</option>
                          {badanHukumOptions.map((bh) => (
                            <option key={bh} value={bh}>
                              {bh}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedBranch('all')
                            setSelectedBadanHukum('all')
                            setCurrentPage(1)
                            setShowFilterPopover(false)
                          }}
                          disabled={activeFilterCount === 0}
                          className="flex-1 py-1.5 text-xs font-bold text-center text-[#D91E2E] bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-xl disabled:opacity-40 transition cursor-pointer"
                        >
                          Reset Filter
                        </button>
                        <button
                          onClick={() => setShowFilterPopover(false)}
                          className="flex-1 py-1.5 text-xs font-bold text-center text-gray-700 dark:text-gray-300 bg-gray-105 dark:bg-zinc-850 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-850 disabled:opacity-50 transition active:scale-95 cursor-pointer disabled:scale-100"
              title="Ekspor Data ke CSV"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-slate-800 dark:border-slate-200 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              )}
              <span>Export CSV</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-850 disabled:opacity-50 transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-slate-650 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* === TABS NAVIGATION SYSTEM === */}
        <div className="border-b border-gray-200 dark:border-zinc-800">
          <nav className="flex flex-wrap -mb-px gap-2" aria-label="Tabs">
            {[
              {
                id: 'dashboard',
                label: 'Dashboard',
                subtitle: 'Visualisasi Matriks & Ringkasan',
                badgeText: 'Overview',
                count: totalUsulan,
                icon: <LayoutDashboard className="w-4 h-4" />,
                activeColor: 'border-[#3365A6] text-[#3365A6] dark:text-blue-400 dark:border-blue-500',
                countBadgeBg: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 border border-slate-200 dark:border-zinc-700'
              },
              {
                id: 'c3',
                label: 'Cluster 1',
                subtitle: 'Lengkap & Cepat (≥80%, ≤7 Hari)',
                badgeText: 'Ideal',
                count: tabCounts.c3,
                activeColor: 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-500',
                countBadgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60'
              },
              {
                id: 'c2',
                label: 'Cluster 2',
                subtitle: 'Belum Lengkap & Cepat (<80%, ≤7 Hari)',
                badgeText: 'Aktif',
                count: tabCounts.c2,
                activeColor: 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500',
                countBadgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60'
              },
              {
                id: 'c1',
                label: 'Cluster 3',
                subtitle: 'Lengkap & Lambat (≥80%, >7 Hari)',
                badgeText: 'Prioritas Review',
                count: tabCounts.c1,
                activeColor: 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-500',
                countBadgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60'
              },
              {
                id: 'c4',
                label: 'Cluster 4',
                subtitle: 'Belum Lengkap & Lambat (<80%, >7 Hari)',
                badgeText: 'Stagnan',
                count: tabCounts.c4,
                activeColor: 'border-rose-600 text-rose-600 dark:text-rose-400 dark:border-rose-500',
                countBadgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60'
              }
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex-1 min-w-[210px] py-3.5 px-4 text-left border-b-2 font-medium text-sm transition-all focus:outline-none cursor-pointer ${isActive
                    ? `${tab.activeColor} bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xs`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-305 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {tab.icon}
                      <span className="font-bold text-[16px]">{tab.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black select-none ${tab.countBadgeBg}`}>
                      {tab.count}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-0.5 font-normal line-clamp-1">{tab.subtitle}</p>
                </button>
              )
            })}
          </nav>
        </div>

        {/* === TAB CONTENT === */}

        {/* 1. DASHBOARD OVERVIEW TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Scatter Plot Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#3365A6]" />
                    Kelompok Dokumen Berdasarkan Kelengkapan & Durasi
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Visualisasi sebaran usulan lokasi nasional di dalam matriks 4 kuadran. Hover dot usulan untuk detail.
                  </p>
                </div>

                <div className="w-full mt-6 relative" ref={chartContainerRef}>
                  {isMounted ? (
                    <ResponsiveContainer width="100%" height={380}>
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" className="hidden dark:block" />

                        <XAxis
                          type="number"
                          dataKey="durasi_hari"
                          name="Durasi"
                          unit=" Hari"
                          domain={[0, maxX]}
                          stroke="#94A3B8"
                          fontSize={11}
                          fontWeight={600}
                        />
                        <YAxis
                          type="number"
                          dataKey="persentase"
                          name="Kelengkapan"
                          unit="%"
                          domain={[0, 100]}
                          stroke="#94A3B8"
                          fontSize={11}
                          fontWeight={600}
                        />

                        {/* Shading Areas for Quadrants */}
                        <ReferenceArea
                          x1={0} x2={7} y1={80} y2={100}
                          fill="rgba(16, 185, 129, 0.08)"
                          stroke="none"
                          onMouseEnter={handleQuadrantHover('c3')}
                          onMouseMove={handleQuadrantHover('c3')}
                          onMouseLeave={handleQuadrantLeave}
                          cursor="pointer"
                        />
                        <ReferenceArea
                          x1={0} x2={7} y1={0} y2={80}
                          fill="rgba(59, 130, 246, 0.08)"
                          stroke="none"
                          onMouseEnter={handleQuadrantHover('c2')}
                          onMouseMove={handleQuadrantHover('c2')}
                          onMouseLeave={handleQuadrantLeave}
                          cursor="pointer"
                        />
                        <ReferenceArea
                          x1={7} x2={maxX} y1={80} y2={100}
                          fill="rgba(245, 158, 11, 0.08)"
                          stroke="none"
                          onMouseEnter={handleQuadrantHover('c1')}
                          onMouseMove={handleQuadrantHover('c1')}
                          onMouseLeave={handleQuadrantLeave}
                          cursor="pointer"
                        />
                        <ReferenceArea
                          x1={7} x2={maxX} y1={0} y2={80}
                          fill="rgba(239, 68, 68, 0.08)"
                          stroke="none"
                          onMouseEnter={handleQuadrantHover('c4')}
                          onMouseMove={handleQuadrantHover('c4')}
                          onMouseLeave={handleQuadrantLeave}
                          cursor="pointer"
                        />

                        {/* Quad Dividers */}
                        <ReferenceLine x={7} stroke="#94A3B8" strokeDasharray="3 3" />
                        <ReferenceLine y={80} stroke="#94A3B8" strokeDasharray="3 3" />

                        <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                        <Scatter name="Cluster 1 (Ideal)" data={data.c3} fill="#10B981" line={false} />
                        <Scatter name="Cluster 2 (Aktif)" data={data.c2} fill="#3B82F6" line={false} />
                        <Scatter name="Cluster 3 (Review)" data={data.c1} fill="#F28705" line={false} />
                        <Scatter name="Cluster 4 (Stagnan)" data={data.c4} fill="#D91E2E" line={false} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[380px] w-full bg-slate-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
                  )}

                  {/* Quadrant Hover Tooltip */}
                  {quadrantHover && (
                    <div
                      className="absolute z-20 pointer-events-none bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg px-3 py-2 text-xs"
                      style={{
                        left: quadrantHover.x + 12,
                        top: quadrantHover.y + 12
                      }}
                    >
                      <p className="font-bold text-gray-900 dark:text-white">{quadrantHover.label}</p>
                      <p className="text-gray-500 dark:text-gray-400 mt-0.5">{quadrantHover.subtitle}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Rincian */}
              <div className="space-y-6 col-span-1">
                {/* Ringkasan Cepat */}
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 border-b border-gray-105 dark:border-zinc-800 pb-2.5">
                    <TrendingUp className="w-4.5 h-4.5 text-[#3365A6]" /> Ringkasan Cepat
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-850 flex items-center gap-3">
                      <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-lg">
                        <ClipboardCheck className="w-5 h-5 text-[#3365A6]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Usulan</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{totalUsulan} Usulan</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-850 flex items-center gap-3">
                      <div className="bg-amber-50 dark:bg-amber-955/20 p-2.5 rounded-lg">
                        <Layers className="w-5 h-5 text-[#F28705]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rata-rata Kelengkapan</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">
                          {totalUsulan === 0 ? '0.0%' : `${avgCompleteness.toFixed(1)}%`}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-850 flex items-center gap-3">
                      <div className="bg-rose-50 dark:bg-rose-955/20 p-2.5 rounded-lg">
                        <Clock className="w-5 h-5 text-[#D91E2E]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rata-rata Durasi Pengumpulan</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">
                          {totalUsulan === 0 ? '0 Hari' : `${avgDuration.toFixed(1)} Hari`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distribusi per Cluster */}
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 border-b border-gray-105 dark:border-zinc-800 pb-2.5">
                    <Layers className="w-4.5 h-4.5 text-[#3365A6]" /> Distribusi per Cluster
                  </h3>

                  <div className="space-y-3.5">
                    {/* C1 (Ideal) */}
                    <div
                      onClick={() => handleTabChange('c3')}
                      className="space-y-1.5 cursor-pointer group"
                    >
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Cluster 1 (Ideal)</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{data.c3.length} ({totalUsulan === 0 ? 0 : Math.round(data.c3.length / totalUsulan * 100)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden group-hover:opacity-80 transition-opacity">
                        <div
                          className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                          style={{ width: `${totalUsulan === 0 ? 0 : (data.c3.length / totalUsulan * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* C2 (Aktif) */}
                    <div
                      onClick={() => handleTabChange('c2')}
                      className="space-y-1.5 cursor-pointer group"
                    >
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Cluster 2 (Aktif)</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{data.c2.length} ({totalUsulan === 0 ? 0 : Math.round(data.c2.length / totalUsulan * 100)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden group-hover:opacity-80 transition-opacity">
                        <div
                          className="h-full bg-[#3B82F6] rounded-full transition-all duration-500"
                          style={{ width: `${totalUsulan === 0 ? 0 : (data.c2.length / totalUsulan * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* C3 (Review) */}
                    <div
                      onClick={() => handleTabChange('c1')}
                      className="space-y-1.5 cursor-pointer group"
                    >
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Cluster 3 (Review)</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{data.c1.length} ({totalUsulan === 0 ? 0 : Math.round(data.c1.length / totalUsulan * 100)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden group-hover:opacity-80 transition-opacity">
                        <div
                          className="h-full bg-[#F28705] rounded-full transition-all duration-500"
                          style={{ width: `${totalUsulan === 0 ? 0 : (data.c1.length / totalUsulan * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* C4 (Stagnan) */}
                    <div
                      onClick={() => handleTabChange('c4')}
                      className="space-y-1.5 cursor-pointer group"
                    >
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Cluster 4 (Stagnan)</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">{data.c4.length} ({totalUsulan === 0 ? 0 : Math.round(data.c4.length / totalUsulan * 100)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden group-hover:opacity-80 transition-opacity">
                        <div
                          className="h-full bg-[#D91E2E] rounded-full transition-all duration-500"
                          style={{ width: `${totalUsulan === 0 ? 0 : (data.c4.length / totalUsulan * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Quadrant Interpretations */}
            <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-2xl border border-gray-150 dark:border-zinc-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Interpretasi Matriks Kuadran</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Definisi pengelompokan (clustering) berdasarkan kelengkapan berkas wajib dan durasi proses.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-955/10 space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-450 select-none">
                    Cluster 1 (Ideal)
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                    Persentase berkas kelengkapan <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">≥ 80%</strong> dan durasi pembuatan usulan <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">≤ 7 hari</strong>. Status siap proses / direkomendasikan.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-950/40 bg-blue-50/20 dark:bg-blue-955/10 space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-450 select-none">
                    Cluster 2 (Aktif)
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                    Persentase kelengkapan <strong className="text-blue-700 dark:text-blue-450 font-extrabold">&lt; 80%</strong> dan durasi pembuatan usulan <strong className="text-blue-700 dark:text-blue-450 font-extrabold">≤ 7 hari</strong>. Status proses aktif pengisian dari cabang.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-950/40 bg-amber-50/20 dark:bg-amber-955/10 space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-450 select-none">
                    Cluster 3 (Review)
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                    Persentase kelengkapan berkas <strong className="text-amber-700 dark:text-amber-500 font-extrabold">≥ 80%</strong> dan durasi usulan telah berjalan <strong className="text-amber-700 dark:text-amber-500 font-extrabold">&gt; 7 hari</strong>. Prioritas review segera oleh Assessor.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-955/10 space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-455 select-none">
                    Cluster 4 (Stagnan)
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                    Kelengkapan berkas wajib <strong className="text-rose-700 dark:text-rose-450 font-extrabold">&lt; 80%</strong> dan durasi pembuatan usulan telah melewati <strong className="text-rose-700 dark:text-rose-450 font-extrabold">&gt; 7 hari</strong>. Bottleneck, perlu intervensi khusus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TABLE GRID FOR ACTIVE CLUSTERS (C1-C4) */}
        {activeTab !== 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-150 dark:border-zinc-800/80 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan lokasi, pemilik, cabang, dll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold self-center sm:self-auto">
                Menampilkan {totalItems === 0 ? '0' : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)}`} dari {totalItems} usulan lokasi
              </div>
            </div>

            {/* Cluster Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/80 overflow-hidden">
              <div className="overflow-x-auto">
                {displayedItems.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                    <Layers className="w-10 h-10 text-gray-300 dark:text-zinc-700" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Tidak ada data usulan lokasi pada cluster ini.
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Gunakan filter atau kata kunci lain untuk menemukan data.
                    </span>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-zinc-800/30 text-gray-550 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800">
                        <th className="p-4 pl-6">Nama ULOK</th>
                        <th className="p-4">Asal Cabang</th>
                        <th className="p-4">Jenis</th>
                        <th className="p-4">Tanggal Dibuat</th>
                        <th className="p-4 w-48">Kelengkapan Dokumen</th>
                        <th className="p-4 text-center">Durasi Pengumpulan</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {displayedItems.map((item: any) => {
                        const branchName = item.profiles?.branches?.nama_cabang || 'Cabang Pusat'
                        const isExpanded = expandedRowId === item.id
                        const durasiDays = item.durasi_hari || 0

                        let progressColorClass = 'bg-[#3365A6]'
                        if (item.persentase >= 80) {
                          progressColorClass = 'bg-[#10B981]'
                        } else if (item.persentase >= 50) {
                          progressColorClass = 'bg-[#3365A6]'
                        } else if (item.persentase >= 20) {
                          progressColorClass = 'bg-[#F28705]'
                        } else {
                          progressColorClass = 'bg-[#D91E2E]'
                        }

                        let statusBadgeStyles = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-850 dark:text-gray-300 dark:border-zinc-800'
                        if (item.status === 'Approved') {
                          statusBadgeStyles = 'bg-emerald-50 text-emerald-750 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                        } else if (item.status === 'Revisi') {
                          statusBadgeStyles = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50'
                        } else if (item.status === 'Rejected') {
                          statusBadgeStyles = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
                        } else if (item.status === 'In Review') {
                          statusBadgeStyles = 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
                        } else if (item.status === 'Draft') {
                          statusBadgeStyles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50'
                        }

                        return (
                          <React.Fragment key={item.id}>
                            <tr
                              onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                              className={`cursor-pointer hover:bg-gray-50/80 dark:hover:bg-zinc-850/30 select-none transition-colors duration-200 ${isExpanded ? 'bg-gray-50/50 dark:bg-zinc-900/20' : ''
                                }`}
                            >
                              {/* Nama ULOK */}
                              <td className="p-4 pl-6">
                                <div className="font-bold text-gray-950 dark:text-white text-sm">
                                  {item.nama_lokasi}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-0.5">
                                  a.n {item.nama_pemegang_hak || '-'}
                                </div>
                              </td>

                              {/* Asal Cabang */}
                              <td className="p-4">
                                <span className="inline-block px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 rounded-md border border-slate-205 dark:border-zinc-700/50">
                                  {branchName}
                                </span>
                              </td>

                              {/* Jenis */}
                              <td className="p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {item.jenis_badan_hukum}
                              </td>

                              {/* Tanggal Dibuat */}
                              <td className="p-4 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                {new Date(item.created_at).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>

                              {/* Progress Dokumen */}
                              <td className="p-4">
                                <div className="space-y-1.5 w-full">
                                  <div className="flex justify-between items-center text-[11px] font-semibold">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                                      {item.numerator ?? 0}/{item.denominator ?? 0} Dokumen
                                    </span>
                                    <span className="text-[#F28705] font-mono">
                                      {(item.persentase || 0).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-250 dark:bg-zinc-800 rounded-full h-2 overflow-hidden shadow-inner">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${progressColorClass}`}
                                      style={{ width: `${item.persentase || 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>

                              {/* Durasi Pengumpulan (Badge Fast/Slow) */}
                              <td className="p-4 text-center">
                                {durasiDays <= 7 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                                    Cepat ({durasiDays} Hari)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-705 dark:bg-amber-955/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                                    Lama ({durasiDays} Hari)
                                  </span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="p-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadgeStyles}`}>
                                  {item.status}
                                </span>
                              </td>

                              {/* Aksi Button */}
                              <td className="p-4 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewDetail(item.id, item.jenis_badan_hukum, item.status)
                                  }}
                                  disabled={isPending}
                                  className="p-2 hover:scale-110 active:scale-95 disabled:opacity-50 transition inline-flex items-center justify-center cursor-pointer"
                                  title="Lihat Detail"
                                >
                                  <FileText className="w-5 h-5 text-[#3365A6]" />
                                </button>
                              </td>
                            </tr>

                            {/* Accordion Row for Checklist Details */}
                            {isExpanded && (
                              <tr className="bg-gray-50/60 dark:bg-[#0D0D0D] transition-all duration-300">
                                <td colSpan={8} className="p-5 border-t border-gray-100 dark:border-zinc-800">
                                  <div className="bg-white dark:bg-zinc-950 rounded-2xl p-5 border border-gray-200/60 dark:border-zinc-800/85 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-850 pb-3 flex-wrap gap-2">
                                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                        📋 Status Checklist Dokumen ({item.persentase}% - {item.numerator}/{item.denominator} Terupload)
                                      </h4>
                                      <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-zinc-700">
                                        Durasi Pengumpulan: <strong className="font-bold">{durasiDays} Hari</strong>
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {item.checklistStatus && item.checklistStatus.length > 0 ? (
                                        item.checklistStatus.map((doc: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${doc.is_uploaded
                                              ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/80 dark:border-emerald-900/30'
                                              : 'bg-gray-50/40 dark:bg-zinc-950/10 border-gray-150 dark:border-zinc-900/40'
                                              }`}
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                              {doc.is_uploaded ? (
                                                <span className="text-emerald-500 dark:text-emerald-450 flex-shrink-0 text-xs font-bold bg-emerald-100/60 dark:bg-emerald-950/40 w-5 h-5 rounded-full flex items-center justify-center">
                                                  ✓
                                                </span>
                                              ) : (
                                                <span className="text-gray-400 dark:text-gray-600 flex-shrink-0 text-xs font-bold bg-gray-105 dark:bg-zinc-900/60 w-5 h-5 rounded-full flex items-center justify-center">
                                                  ✕
                                                </span>
                                              )}
                                              <span
                                                className={`text-xs font-semibold truncate ${doc.is_uploaded ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                                                  }`}
                                                title={doc.nama_dokumen}
                                              >
                                                {doc.nama_dokumen}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                              {doc.is_negotiable && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-955/30 text-[#F28705] border border-amber-205 dark:border-amber-900/40 select-none">
                                                  Opsional
                                                </span>
                                              )}

                                              {doc.is_uploaded ? (
                                                <div className="flex items-center gap-1.5 ml-2">
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/50">
                                                    Terunggah
                                                  </span>
                                                  {doc.file_url && (
                                                    <div className="flex gap-1">
                                                      <button
                                                        type="button"
                                                        disabled={downloadingDocName === doc.nama_dokumen}
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          handleDownload(doc.file_url!, doc.nama_dokumen)
                                                        }}
                                                        className="p-1 rounded bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                                                        title="Download File"
                                                      >
                                                        {downloadingDocName === doc.nama_dokumen ? (
                                                          <span className="w-3 h-3 border-2 border-[#3365A6] border-t-transparent rounded-full animate-spin"></span>
                                                        ) : (
                                                          <Download className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                                                        )}
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-100 dark:bg-zinc-900/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-zinc-800/80">
                                                  Belum
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="col-span-full py-4 text-center text-xs text-gray-400 italic">
                                          Tidak ada data checklist wajib untuk usulan ini.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Cluster Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-4 py-3 rounded-xl shadow-xs transition-colors">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-850 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Prev
                </button>

                <div className="hidden sm:flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, idx) => {
                    const pageNum = idx + 1
                    return (
                      <button
                        key={`cluster-page-${pageNum}`}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7.5 h-7.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${currentPage === pageNum
                          ? 'bg-[#3365A6] text-white dark:bg-[#3365A6] dark:text-blue-100 border border-[#3365A6] dark:border-zinc-700 shadow-xs font-black'
                          : 'border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-850'
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <span className="sm:hidden text-xs font-semibold text-gray-500">
                  Halaman {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-850 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
