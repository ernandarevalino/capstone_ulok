'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { getClusteringData, ClusteringResult } from '@/actions/clustering'
import {
  AlertCircle, Clock, AlertTriangle, RotateCcw,
  Layers, RefreshCw, Filter, Search,
  LayoutDashboard, TrendingUp, ClipboardCheck,
  ClipboardList, Check, X, CheckCircle2, Activity, XCircle,
  Eye, FileText
} from 'lucide-react'
import ChartFullscreenWrapper from '@/app/admin/assessor/clustering/ChartFullscreenWrapper'

// Code-split scatter chart component (client-only)
const ClusterScatterChart = dynamic(() => import('@/app/admin/assessor/clustering/ClusterScatterChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[480px] w-full bg-slate-100 dark:bg-gray-800 animate-pulse rounded-xl" />
  )
})

// === TAB SYSTEM TYPES & COLOR PALETTE ===
type TabId = 'dashboard' | 'c3' | 'c2' | 'c1' | 'c4'

const TAB_COLOR_PALETTE: Record<TabId, { border: string; text: string; bg: string; badge: string; dot: string }> = {
  dashboard: {
    border: 'border-[#142B4D] dark:border-blue-500',
    text: 'text-[#142B4D] dark:text-blue-400',
    bg: 'bg-blue-50/60 dark:bg-blue-950/20',
    badge: 'bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-slate-300 border border-slate-200 dark:border-gray-700',
    dot: 'bg-[#142B4D]'
  },
  c3: {
    border: 'border-emerald-500 dark:border-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60',
    dot: 'bg-emerald-500'
  },
  c2: {
    border: 'border-blue-500 dark:border-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50/60 dark:bg-blue-950/20',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60',
    dot: 'bg-blue-500'
  },
  c1: {
    border: 'border-amber-500 dark:border-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50/60 dark:bg-amber-950/20',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60',
    dot: 'bg-amber-500'
  },
  c4: {
    border: 'border-rose-500 dark:border-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50/60 dark:bg-rose-950/20',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60',
    dot: 'bg-rose-500'
  },
}

const INACTIVE_TAB_COLORS = {
  border: 'border-gray-200 dark:border-gray-800',
  text: 'text-gray-500 dark:text-gray-400',
  bg: 'bg-white dark:bg-gray-900',
  dot: 'bg-gray-300 dark:bg-gray-700'
}

function getTabColorClasses(id: TabId, active: boolean) {
  if (!active) {
    return { ...INACTIVE_TAB_COLORS, badge: TAB_COLOR_PALETTE[id].badge }
  }
  return TAB_COLOR_PALETTE[id]
}

const BADAN_HUKUM_OPTIONS = ['PT', 'Koperasi', 'Yayasan', 'Perorangan', 'Kuasa', 'Waris', 'Hibah']

// === SKELETON LOADER ===
function DashboardSkeleton() {
  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="w-full space-y-6 animate-pulse">
        {/* HEADER */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-2.5 min-w-0">
              <div className="h-7 sm:h-8 w-48 sm:w-64 bg-slate-200 dark:bg-gray-800 rounded-lg" />
              <div className="h-3.5 w-full max-w-xs sm:max-w-md bg-slate-200 dark:bg-gray-800 rounded-md" />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="h-10 w-24 bg-slate-200 dark:bg-gray-800 rounded-xl" />
              <div className="h-10 w-24 bg-slate-200 dark:bg-gray-800 rounded-xl" />
            </div>
          </div>
        </div>

        {/* TABS SKELETON */}
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex gap-2 sm:flex-wrap">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-[180px] sm:w-auto sm:flex-1 sm:min-w-[170px] h-[92px] bg-slate-200 dark:bg-gray-800 rounded-xl"
              />
            ))}
          </div>
        </div>

        {/* MAIN CONTENT SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
            <div className="space-y-2">
              <div className="h-5 w-64 max-w-full bg-slate-200 dark:bg-gray-800 rounded-md" />
              <div className="h-3.5 w-full max-w-md bg-slate-200 dark:bg-gray-800 rounded-md" />
            </div>
            <div className="h-[300px] sm:h-[420px] lg:h-[480px] w-full bg-slate-100 dark:bg-gray-800 rounded-xl" />
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="h-4 w-32 bg-slate-200 dark:bg-gray-800 rounded-md" />
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-16 w-full bg-slate-100 dark:bg-gray-800 rounded-xl" />
              ))}
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="h-4 w-40 bg-slate-200 dark:bg-gray-800 rounded-md" />
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="h-3 w-full bg-slate-100 dark:bg-gray-800 rounded" />
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-gray-800 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM SKELETON */}
        <div className="bg-white dark:bg-gray-900 p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-52 bg-slate-200 dark:bg-gray-800 rounded-md" />
            <div className="h-3 w-72 max-w-full bg-slate-200 dark:bg-gray-800 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 bg-slate-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminClusteringPage() {
  // Data state
  const [data, setData] = useState<ClusteringResult>({
    c1: [],
    c2: [],
    c3: [],
    c4: [],
    leaderboard: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  // Search & Filter states
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedBadanHukum, setSelectedBadanHukum] = useState<string>('all')
  const [showFilterPopover, setShowFilterPopover] = useState(false)

  // Accordion state for document checklist details
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Data Fetching
  const loadData = useCallback(async () => {
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
      setHasLoadedOnce(true)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  // Chart click or table action handler: Super Admin toggles row expansion to view document listing
  const handleToggleRow = useCallback((id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id))
  }, [])

  // Filter logic
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

  // Active cluster list
  const activeClusterData = useMemo(() => {
    switch (activeTab) {
      case 'c3': return filteredC3
      case 'c2': return filteredC2
      case 'c1': return filteredC1
      case 'c4': return filteredC4
      default: return []
    }
  }, [activeTab, filteredC3, filteredC2, filteredC1, filteredC4])

  const allItems = useMemo(
    () => [...data.c1, ...data.c2, ...data.c3, ...data.c4],
    [data]
  )

  const allBranches = useMemo(() => {
    return Array.from(
      new Set(
        allItems.map((item) => item.profiles?.branches?.nama_cabang).filter(Boolean) as string[]
      )
    ).sort()
  }, [allItems])

  const activeFilterCount = (selectedBranch !== 'all' ? 1 : 0) + (selectedBadanHukum !== 'all' ? 1 : 0)

  // Pagination for cluster table
  const totalItems = activeClusterData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const displayedItems = activeClusterData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setExpandedRowId(null)
  }, [])

  // Summary statistics
  const totalUsulan = allItems.length

  const { avgCompleteness, avgDuration, maxX } = useMemo(() => {
    if (totalUsulan === 0) return { avgCompleteness: 0, avgDuration: 0, maxX: 14 }
    let sumPersentase = 0
    let sumDurasi = 0
    let maxDurasi = 0
    for (const item of allItems) {
      sumPersentase += item.persentase || 0
      sumDurasi += item.durasi_hari || 0
      if ((item.durasi_hari || 0) > maxDurasi) maxDurasi = item.durasi_hari || 0
    }
    const cleanMaxX = maxDurasi <= 21 ? 21 : Math.ceil((maxDurasi + 5) / 10) * 10

    return {
      avgCompleteness: sumPersentase / totalUsulan,
      avgDuration: sumDurasi / totalUsulan,
      maxX: Math.max(14, cleanMaxX)
    }
  }, [allItems, totalUsulan])

  // Tabs definitions
  const tabs: { id: TabId; label: string; subtitle: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      subtitle: 'Visualisasi Matriks & Ringkasan',
      icon: <LayoutDashboard className="w-5 h-5" />,
      count: totalUsulan
    },
    {
      id: 'c3',
      label: 'Cluster 1',
      subtitle: 'Lengkap & Cepat (≥80%, ≤7 Hari)',
      icon: <CheckCircle2 className="w-5 h-5" />,
      count: tabCounts.c3
    },
    {
      id: 'c2',
      label: 'Cluster 2',
      subtitle: 'Belum Lengkap & Cepat (<80%, ≤7 Hari)',
      icon: <Activity className="w-5 h-5" />,
      count: tabCounts.c2
    },
    {
      id: 'c1',
      label: 'Cluster 3',
      subtitle: 'Lengkap & Lambat (≥80%, >7 Hari)',
      icon: <AlertTriangle className="w-5 h-5" />,
      count: tabCounts.c1
    },
    {
      id: 'c4',
      label: 'Cluster 4',
      subtitle: 'Belum Lengkap & Lambat (<80%, >7 Hari)',
      icon: <XCircle className="w-5 h-5" />,
      count: tabCounts.c4
    }
  ]

  // Initial load skeleton
  if (isLoading && !hasLoadedOnce) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center transition-colors">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-md text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-[#D91E2E] mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Gagal Memuat Data Clustering</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={loadData}
            className="w-full bg-[#142B4D] hover:bg-[#1a3863] text-white font-bold py-2.5 rounded-xl text-xs transition active:scale-95 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  const activeTabConfig = tabs.find((t) => t.id === activeTab)

  return (
    <div className="w-full space-y-4 sm:space-y-6 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      <div className="w-full space-y-6">

        {/* === HEADER & TOP ACTION BAR === */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Clustering ULOK
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Analisis usulan lokasi berdasarkan persentase kelengkapan berkas dan durasi pengumpulan.
            </p>
          </div>

          {/* Search, Filter & Refresh Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            {/* Search Input */}
            <div className="relative flex-1 w-full min-w-0">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan lokasi, pemilik, cabang..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4D] dark:focus:ring-blue-500 transition-all shadow-sm h-11 md:h-10 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Actions: Filter & Refresh */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              {/* Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterPopover(!showFilterPopover)}
                  className={`relative h-11 sm:h-10 px-4 py-2.5 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer ${
                    activeFilterCount > 0
                      ? 'border-[#142B4D] text-[#142B4D] dark:border-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  title="Filter Cluster ULOK"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>

                  {activeFilterCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 md:relative md:top-0 md:right-0" />
                  )}
                </button>

                {/* Filter Popover */}
                {showFilterPopover && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setShowFilterPopover(false)}
                    />

                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-5 z-50 space-y-4 animate-[fadeIn_0.15s_ease-out]">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
                          <Filter className="w-4 h-4 text-[#142B4D] dark:text-blue-400" />
                          Filter Cluster ULOK
                        </h4>

                        {activeFilterCount > 0 && (
                          <button
                            onClick={() => {
                              setSelectedBranch('all')
                              setSelectedBadanHukum('all')
                              setCurrentPage(1)
                            }}
                            className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                          </button>
                        )}
                      </div>

                      {/* Asal Cabang Filter */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                          Asal Cabang
                        </label>
                        <select
                          value={selectedBranch}
                          onChange={(e) => {
                            setSelectedBranch(e.target.value)
                            setCurrentPage(1)
                          }}
                          className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                        >
                          <option value="all">Semua Cabang</option>
                          {allBranches.map((br: any) => (
                            <option key={br} value={br}>
                              {br}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Jenis Badan Hukum Filter */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                          Jenis Badan Hukum
                        </label>
                        <select
                          value={selectedBadanHukum}
                          onChange={(e) => {
                            setSelectedBadanHukum(e.target.value)
                            setCurrentPage(1)
                          }}
                          className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                        >
                          <option value="all">Semua Jenis</option>
                          {BADAN_HUKUM_OPTIONS.map((bh) => (
                            <option key={bh} value={bh}>
                              {bh}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Apply Button */}
                      <div className="pt-2">
                        <button
                          onClick={() => setShowFilterPopover(false)}
                          className="w-full py-2 bg-[#142B4D] hover:bg-[#1a3863] text-white font-bold text-xs rounded-xl shadow transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Terapkan Filter
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadData}
                disabled={isLoading}
                title="Refresh Data"
                className="h-11 sm:h-10 px-4 shrink-0 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="mb-5 mt-4 overflow-x-auto pb-1 sm:overflow-visible">
          <div className="flex gap-2 sm:flex-wrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const colors = getTabColorClasses(tab.id, isActive)

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-shrink-0 w-[180px] sm:w-auto sm:flex-1 sm:min-w-[170px] rounded-xl border px-4 py-5 text-left transition-all focus:outline-none cursor-pointer ${
                    isActive
                      ? `${colors.border} ${colors.bg} border-2 shadow-sm`
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className={`flex items-center gap-1.5 ${isActive ? colors.text : 'text-gray-500 dark:text-gray-400'}`}>
                      {tab.icon}
                      <span className={`font-bold text-[13px] ${isActive ? colors.text : 'text-gray-700 dark:text-gray-200'}`}>
                        {tab.label}
                      </span>
                    </div>
                    {tab.count !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black select-none ${colors.badge}`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-gray-400 dark:text-gray-400 mt-2 font-normal truncate">
                    {tab.subtitle}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* === TAB CONTENT === */}
        <div className={isLoading && hasLoadedOnce ? 'opacity-60 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}>

          {/* 1. DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Scatter Plot Chart */}
                <ChartFullscreenWrapper
                  title="Kelompok Dokumen Berdasarkan Kelengkapan & Durasi"
                  subtitle="Visualisasi sebaran usulan lokasi nasional di dalam matriks 4 kuadran. Klik ikon di kanan atas untuk layar penuh."
                >
                  <ClusterScatterChart
                    boundaryX={7}
                    boundaryY={80}
                    c1={data.c1}
                    c2={data.c2}
                    c3={data.c3}
                    c4={data.c4}
                    maxX={maxX}
                    onViewDetail={handleToggleRow}
                  />
                </ChartFullscreenWrapper>

                {/* Sidebar Summary */}
                <div className="space-y-6 col-span-1">
                  {/* Ringkasan Cepat */}
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                      <TrendingUp className="w-4.5 h-4.5 text-[#142B4D] dark:text-blue-400" />
                      Ringkasan Cepat
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-3.5 bg-slate-50 dark:bg-gray-950/50 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                        <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-lg shrink-0">
                          <ClipboardCheck className="w-5 h-5 text-[#142B4D] dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Usulan</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white">{totalUsulan} Usulan</p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-gray-950/50 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg shrink-0">
                          <Layers className="w-5 h-5 text-[#F28705]" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rata-rata Kelengkapan</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white">
                            {totalUsulan === 0 ? '0.0%' : `${avgCompleteness.toFixed(1)}%`}
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-gray-950/50 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                        <div className="bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg shrink-0">
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
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                      <Layers className="w-4.5 h-4.5 text-[#142B4D] dark:text-blue-400" />
                      Distribusi per Cluster
                    </h3>

                    <div className="space-y-3.5">
                      {/* Cluster 1 */}
                      <div
                        onClick={() => handleTabChange('c3')}
                        className="space-y-1.5 cursor-pointer group"
                      >
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Cluster 1</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{data.c3.length} ({totalUsulan === 0 ? 0 : Math.round(data.c3.length / totalUsulan * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden group-hover:opacity-80 transition-opacity">
                          <div
                            className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                            style={{ width: `${totalUsulan === 0 ? 0 : (data.c3.length / totalUsulan * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Cluster 2 */}
                      <div
                        onClick={() => handleTabChange('c2')}
                        className="space-y-1.5 cursor-pointer group"
                      >
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Cluster 2</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">{data.c2.length} ({totalUsulan === 0 ? 0 : Math.round(data.c2.length / totalUsulan * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden group-hover:opacity-80 transition-opacity">
                          <div
                            className="h-full bg-[#3B82F6] rounded-full transition-all duration-500"
                            style={{ width: `${totalUsulan === 0 ? 0 : (data.c2.length / totalUsulan * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Cluster 3 */}
                      <div
                        onClick={() => handleTabChange('c1')}
                        className="space-y-1.5 cursor-pointer group"
                      >
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Cluster 3</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">{data.c1.length} ({totalUsulan === 0 ? 0 : Math.round(data.c1.length / totalUsulan * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden group-hover:opacity-80 transition-opacity">
                          <div
                            className="h-full bg-[#F28705] rounded-full transition-all duration-500"
                            style={{ width: `${totalUsulan === 0 ? 0 : (data.c1.length / totalUsulan * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Cluster 4 */}
                      <div
                        onClick={() => handleTabChange('c4')}
                        className="space-y-1.5 cursor-pointer group"
                      >
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-700 dark:text-gray-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Cluster 4</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">{data.c4.length} ({totalUsulan === 0 ? 0 : Math.round(data.c4.length / totalUsulan * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden group-hover:opacity-80 transition-opacity">
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
              <div className="bg-white dark:bg-gray-900 p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Interpretasi Matriks Kuadran</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Definisi pengelompokan (clustering) berdasarkan kelengkapan berkas wajib dan durasi proses.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 select-none">
                      Cluster 1 (Ideal)
                    </span>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
                      Persentase berkas kelengkapan <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">≥ 80%</strong> dan durasi pembuatan usulan <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">≤ 7 hari</strong>. Status siap proses / direkomendasikan.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/20 space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-400 select-none">
                      Cluster 2 (Aktif)
                    </span>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
                      Persentase kelengkapan <strong className="text-blue-700 dark:text-blue-400 font-extrabold">{"<"} 80%</strong> dan durasi pembuatan usulan <strong className="text-blue-700 dark:text-blue-400 font-extrabold">≤ 7 hari</strong>. Status proses aktif pengisian dari cabang.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/20 space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 select-none">
                      Cluster 3 (Review)
                    </span>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
                      Persentase kelengkapan berkas <strong className="text-amber-700 dark:text-amber-400 font-extrabold">≥ 80%</strong> dan durasi usulan telah berjalan <strong className="text-amber-700 dark:text-amber-400 font-extrabold">{">"} 7 hari</strong>. Prioritas review segera oleh Assessor.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/20 space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-400 select-none">
                      Cluster 4 (Stagnan)
                    </span>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
                      Kelengkapan berkas wajib <strong className="text-rose-700 dark:text-rose-400 font-extrabold">{"<"} 80%</strong> dan durasi pembuatan usulan telah melewati <strong className="text-rose-700 dark:text-rose-400 font-extrabold">{">"} 7 hari</strong>. Bottleneck, perlu intervensi khusus.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. TABLE GRID FOR ACTIVE CLUSTERS (C1-C4) */}
          {activeTab !== 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">

              {/* Cluster Table */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Header bar */}
                {isLoading && !hasLoadedOnce ? (
                  <div className="flex items-center justify-between gap-3 bg-slate-100 dark:bg-gray-800/50 px-4 py-3 sm:px-6 border-b border-gray-100 dark:border-gray-800 animate-pulse w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-6 bg-slate-200 dark:bg-gray-700 rounded" />
                      <div className="w-40 h-5 bg-slate-200 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="w-16 h-4 bg-slate-200 dark:bg-gray-700 rounded" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 bg-[#142B4D] dark:bg-slate-900 px-4 py-4 sm:px-6 text-white w-full">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0 p-1 bg-white/10 rounded-lg">
                        {activeTabConfig?.icon}
                      </span>
                      <span className="shrink-0 font-bold text-sm sm:text-base">
                        {activeTabConfig?.label}
                      </span>
                      <span className="text-white/50 shrink-0">-</span>
                      <span className="truncate text-xs sm:text-sm font-medium text-white/80">
                        {activeTabConfig?.subtitle}
                      </span>
                    </div>

                    <span className="flex-shrink-0 text-xs sm:text-sm font-semibold text-slate-300">
                      {totalItems} usulan
                    </span>
                  </div>
                )}

                {/* Mobile: card list */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                  {displayedItems.length === 0 ? (
                    <div className="py-16 px-4 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                      <Layers className="w-8 h-8"/>
                      <span className="text-sm font-semibold">Tidak ada usulan lokasi di kelompok ini.</span>
                      <span className="text-xs text-gray-500">Gunakan filter atau kata kunci lain.</span>
                    </div>
                  ) : (
                    displayedItems.map((item: any) => {
                      const branchName = item.profiles?.branches?.nama_cabang || 'Cabang Pusat'
                      const isExpanded = expandedRowId === item.id
                      const durasiDays = item.durasi_hari || 0

                      let progressColorClass = 'bg-[#142B4D]'
                      if (item.persentase >= 80) progressColorClass = 'bg-[#10B981]'
                      else if (item.persentase >= 50) progressColorClass = 'bg-[#3B82F6]'
                      else if (item.persentase >= 20) progressColorClass = 'bg-[#F28705]'
                      else progressColorClass = 'bg-[#D91E2E]'

                      let statusBadgeStyles = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                      if (item.status === 'Approved') statusBadgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                      else if (item.status === 'Revisi') statusBadgeStyles = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50'
                      else if (item.status === 'Rejected') statusBadgeStyles = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
                      else if (item.status === 'In Review') statusBadgeStyles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
                      else if (item.status === 'Draft') statusBadgeStyles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50'

                      return (
                        <div key={item.id} className="p-4">
                          <button onClick={() => setExpandedRowId(isExpanded ? null : item.id)} className="w-full text-left focus:outline-none cursor-pointer">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-bold text-gray-950 dark:text-white text-sm">
                                    {item.nama_lokasi}
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-400 mt-0.5">a.n {item.nama_pemegang_hak || '-'}</div>
                              </div>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="inline-block px-2 py-0.5 text-[10.5px] font-semibold bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-slate-200 rounded-md border border-slate-200/50 dark:border-gray-700/50">
                                {branchName}
                              </span>
                              <span className="text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                                {item.jenis_badan_hukum}
                              </span>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border ${statusBadgeStyles}`}>
                                {item.status}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[10.5px] text-gray-400">
                              <span>Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              <span>Durasi: {durasiDays} Hari</span>
                            </div>

                            <div className="mt-3 space-y-1.5 w-full">
                              <div className="flex justify-between items-center text-[11px] font-semibold gap-1">
                                <span className="text-gray-500 dark:text-gray-400 font-medium text-[11px]">
                                  {item.numerator ?? 0}/{item.denominator ?? 0} Dokumen Terupload
                                </span>
                                <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                                  {(item.persentase || 0).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
                                <div className={`h-full rounded-full transition-all duration-500 ${progressColorClass}`} style={{ width: `${item.persentase || 0}%` }} />
                              </div>
                            </div>
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Desktop: Table */}
                <div className="hidden md:block overflow-x-auto">
                  {displayedItems.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                      <Layers className="w-10 h-10 text-gray-300 dark:text-gray-700" />
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
                        <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                          <th className="p-4 pl-6">Nama ULOK</th>
                          <th className="p-4">Asal Cabang</th>
                          <th className="p-4">Jenis</th>
                          <th className="p-4">Tanggal Dibuat</th>
                          <th className="p-4 w-48">Kelengkapan Dokumen</th>
                          <th className="p-4 text-center">Durasi Pengumpulan</th>
                          <th className="p-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {displayedItems.map((item: any) => {
                          const branchName = item.profiles?.branches?.nama_cabang || 'Cabang Pusat'
                          const isExpanded = expandedRowId === item.id
                          const durasiDays = item.durasi_hari || 0

                          let progressColorClass = 'bg-[#142B4D]'
                          if (item.persentase >= 80) {
                            progressColorClass = 'bg-[#10B981]'
                          } else if (item.persentase >= 50) {
                            progressColorClass = 'bg-[#3B82F6]'
                          } else if (item.persentase >= 20) {
                            progressColorClass = 'bg-[#F28705]'
                          } else {
                            progressColorClass = 'bg-[#D91E2E]'
                          }

                          let statusBadgeStyles = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800'
                          if (item.status === 'Approved') {
                            statusBadgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                          } else if (item.status === 'Revisi') {
                            statusBadgeStyles = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50'
                          } else if (item.status === 'Rejected') {
                            statusBadgeStyles = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
                          } else if (item.status === 'In Review') {
                            statusBadgeStyles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
                          } else if (item.status === 'Draft') {
                            statusBadgeStyles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50'
                          }

                          return (
                            <React.Fragment key={item.id}>
                              <tr
                                onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                                className={`cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/30 select-none transition-colors duration-200 ${
                                  isExpanded ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''
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
                                  <span className="inline-block px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-slate-200 rounded-md border border-slate-200 dark:border-gray-700/50">
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
                                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${progressColorClass}`}
                                        style={{ width: `${item.persentase || 0}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                {/* Durasi Pengumpulan (Badge Fast/Slow) */}
                                <td className="p-4 text-center">
                                  {durasiDays <= 7 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                                      CEPAT ({durasiDays} HARI)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                                      LAMA ({durasiDays} HARI)
                                    </span>
                                  )}
                                </td>

                                {/* Status Badge */}
                                <td className="p-4 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadgeStyles}`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>

                              {/* Accordion Row for Checklist Details */}
                              {isExpanded && (
                                <tr className="bg-gray-50/60 dark:bg-gray-900/40 transition-all duration-300">
                                  <td colSpan={7} className="p-5 border-t border-gray-100 dark:border-gray-800">
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800 shadow-sm space-y-4">
                                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 flex-wrap gap-2">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                          <ClipboardList className="w-4 h-4 text-[#142B4D] dark:text-blue-400" />
                                          Status Checklist Dokumen ({item.persentase}% - {item.numerator}/{item.denominator} Terupload)
                                        </h4>
                                        <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-700">
                                          Durasi Pengumpulan: <strong className="font-bold">{durasiDays} Hari</strong>
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {item.checklistStatus && item.checklistStatus.length > 0 ? (
                                          item.checklistStatus.map((doc: any, idx: number) => (
                                            <div
                                              key={idx}
                                              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                                                doc.is_uploaded
                                                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/80 dark:border-emerald-900/30'
                                                  : 'bg-gray-50/40 dark:bg-gray-950/10 border-gray-150 dark:border-gray-800/40'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                {doc.is_uploaded ? (
                                                  <span className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 bg-emerald-100/60 dark:bg-emerald-950/40 w-5 h-5 rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3" strokeWidth={3} />
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-400 dark:text-gray-600 flex-shrink-0 bg-gray-100 dark:bg-gray-800/60 w-5 h-5 rounded-full flex items-center justify-center">
                                                    <X className="w-3 h-3" strokeWidth={3} />
                                                  </span>
                                                )}
                                                <span
                                                  className={`text-xs font-semibold truncate ${
                                                    doc.is_uploaded ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                                                  }`}
                                                  title={doc.nama_dokumen}
                                                >
                                                  {doc.nama_dokumen}
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                {doc.is_negotiable && (
                                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-900/30 text-[#F28705] border border-amber-200 dark:border-amber-900/40 select-none">
                                                    Opsional
                                                  </span>
                                                )}

                                                {doc.is_uploaded ? (
                                                  <div className="flex items-center gap-1.5 ml-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/50">
                                                      TERUNGGAH
                                                    </span>
                                                    {doc.file_url && (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          window.open(doc.file_url, '_blank', 'noopener,noreferrer')
                                                        }}
                                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center cursor-pointer"
                                                        title="Lihat Berkas"
                                                      >
                                                        <Eye className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                                      </button>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
                                                    BELUM
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-xl shadow-xs transition-colors">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
                          className={`w-7.5 h-7.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-[#142B4D] text-white dark:bg-[#142B4D] dark:text-blue-100 border border-[#142B4D] dark:border-gray-700 shadow-xs font-black'
                              : 'border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  )
}
