'use client'

import React, { useEffect, useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getClusteringData, ClusteringResult } from '@/actions/clustering'
import { transitionDraftToInReview } from '@/actions/assessor'
import { exportUlokSubmissionsCSV } from '@/actions/export'
import { 
  Trophy, Medal, AlertCircle, MapPin, ChevronDown, ChevronUp, 
  Star, Award, Sparkles, Download, Clock, Zap, AlertTriangle, 
  Layers, CheckSquare, RefreshCw, Filter, Search, FileText
} from 'lucide-react'

const checkIncomplete = (item: any) => !item.harga_sewa || item.c1_score <= 1 || !item.first_in_review_at;

export default function UnifiedClusteringPeringkatPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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
  
  // Tab State: 'c3' (Fast-Track), 'c2' (Progress), 'c1' (Review), 'c4' (Stagnan), 'peringkat' (SAW Leaderboard)
  const [activeTab, setActiveTab] = useState<'c3' | 'c2' | 'c1' | 'c4' | 'peringkat'>('c3')

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedBadanHukum, setSelectedBadanHukum] = useState<string>('all')
  const [showFilterPopover, setShowFilterPopover] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [downloadingDocName, setDownloadingDocName] = useState<string | null>(null)

  // Accordion & Podium States
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [openPodiumCardId, setOpenPodiumCardId] = useState<string | null>(null)

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
    peringkat: data.leaderboard.length
  }), [filteredC3, filteredC2, filteredC1, filteredC4, data.leaderboard])

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

  // SAW Leaderboard pagination & podium
  const top3Data = useMemo(() => data.leaderboard.slice(0, 3), [data.leaderboard])
  const remainingData = useMemo(() => data.leaderboard.slice(3), [data.leaderboard])
  const totalPeringkatPages = Math.ceil(remainingData.length / itemsPerPage) || 1
  const displayedRemainingData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return remainingData.slice(start, start + itemsPerPage)
  }, [remainingData, currentPage])

  const togglePodiumCard = useCallback((id: string) => {
    setOpenPodiumCardId(prev => (prev === id ? null : id))
  }, [])

  const handleTabChange = (tab: 'c3' | 'c2' | 'c1' | 'c4' | 'peringkat') => {
    setActiveTab(tab)
    setCurrentPage(1)
    setExpandedRowId(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 animate-pulse">
            Menyusun Matriks Clustering & Leaderboard SAW...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 flex items-center justify-center transition-colors">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-md text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Gagal Memuat Data Dashboard</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{error}</p>
          <button 
            onClick={loadData} 
            className="w-full bg-blue-950 dark:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition active:scale-95 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* === DASHBOARD TITLE & ACTIONS === */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-400 dark:bg-amber-500 text-blue-950 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3 fill-current" /> Clustering & SPK SAW
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Dashboard Clustering & Peringkat ULOK
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
              Matriks evaluasi (Kelengkapan Dokumen vs Durasi Pengumpulan) dan Leaderboard SPK SAW Nasional.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Filter Popover Button */}
            {activeTab !== 'peringkat' && (
              <div className="relative">
                <button
                  onClick={() => setShowFilterPopover(!showFilterPopover)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-95 cursor-pointer"
                >
                  <Filter className="w-4 h-4 text-slate-650 dark:text-slate-400" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 text-[10px] font-black text-white select-none">
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
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-xl z-50 space-y-4 animate-fadeIn">
                      <h4 className="text-sm font-bold text-gray-950 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-850">
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
                          className="w-full px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                          className="w-full px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                          className="flex-1 py-1.5 text-xs font-bold text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-xl disabled:opacity-40 transition cursor-pointer"
                        >
                          Reset Filter
                        </button>
                        <button
                          onClick={() => setShowFilterPopover(false)}
                          className="flex-1 py-1.5 text-xs font-bold text-center text-gray-700 dark:text-gray-250 bg-gray-100 dark:bg-gray-850 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition active:scale-95 cursor-pointer disabled:scale-100"
              title="Ekspor Data ke CSV"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-slate-800 dark:border-slate-200 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-4 h-4 text-slate-650 dark:text-slate-400" />
              )}
              <span>Export CSV</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-slate-650 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* === 5 TABS NAVIGATION SYSTEM === */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex flex-wrap -mb-px gap-2" aria-label="Tabs">
            {[
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
                subtitle: 'Lengkap & Lama (≥80%, >7 Hari)',
                badgeText: 'Prioritas Review',
                count: tabCounts.c1,
                activeColor: 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-500',
                countBadgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60'
              },
              {
                id: 'c4',
                label: 'Cluster 4',
                subtitle: 'Belum Lengkap & Lama (<80%, >7 Hari)',
                badgeText: 'Stagnan',
                count: tabCounts.c4,
                activeColor: 'border-rose-600 text-rose-600 dark:text-rose-400 dark:border-rose-500',
                countBadgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60'
              },
              {
                id: 'peringkat',
                label: 'Peringkat SAW',
                subtitle: 'Leaderboard SAW Nasional',
                badgeText: 'Top Rank',
                count: tabCounts.peringkat,
                icon: <Trophy className="w-4 h-4" />,
                activeColor: 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-500',
                countBadgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/60'
              }
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex-1 min-w-[210px] py-3.5 px-4 text-left border-b-2 font-medium text-sm transition-all focus:outline-none cursor-pointer ${
                    isActive
                      ? `${tab.activeColor} bg-white dark:bg-gray-900/60 rounded-t-2xl shadow-xs`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {tab.icon}
                      <span className="font-bold text-[14px]">{tab.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black select-none ${tab.countBadgeBg}`}>
                      {tab.count}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-normal line-clamp-1">{tab.subtitle}</p>
                </button>
              )
            })}
          </nav>
        </div>

        {/* === IF TAB IS CLUSTER (C1, C2, C3, C4) === */}
        {activeTab !== 'peringkat' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800/80 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan lokasi, pemilik, cabang, dll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold self-center sm:self-auto">
                Menampilkan {totalItems === 0 ? '0' : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)}`} dari {totalItems} usulan lokasi
              </div>
            </div>

            {/* Cluster Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">
              <div className="overflow-x-auto">
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
                      <tr className="bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
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
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {displayedItems.map((item: any) => {
                        const branchName = item.profiles?.branches?.nama_cabang || 'Cabang Pusat'
                        const isExpanded = expandedRowId === item.id
                        const durasiDays = item.durasi_hari || 0

                        let progressColorClass = 'bg-blue-600'
                        if (item.persentase >= 80) {
                          progressColorClass = 'bg-emerald-500'
                        } else if (item.persentase >= 50) {
                          progressColorClass = 'bg-blue-600'
                        } else if (item.persentase >= 20) {
                          progressColorClass = 'bg-amber-500'
                        } else {
                          progressColorClass = 'bg-rose-500'
                        }

                        let statusBadgeStyles = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
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
                              className={`cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40 select-none transition-colors duration-200 ${
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
                                <span className="inline-block px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md border border-slate-200/50 dark:border-slate-700/50">
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
                                    <span className="text-amber-600 dark:text-amber-400 font-mono">
                                      {(item.persentase || 0).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
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
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
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
                                  className="p-2 hover:scale-110 active:scale-95 disabled:opacity-50 transition inline-flex items-center justify-center"
                                  title="Lihat Detail"
                                >
                                  <FileText className="w-5 h-5 text-blue-900 dark:text-blue-400" />
                                </button>
                              </td>
                            </tr>

                            {/* Accordion Row for Checklist Details */}
                            {isExpanded && (
                              <tr className="bg-gray-50/60 dark:bg-gray-900/30 transition-all duration-300">
                                <td colSpan={8} className="p-5 border-t border-gray-100 dark:border-gray-800">
                                  <div className="bg-white dark:bg-gray-950 rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800/85 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-3 flex-wrap gap-2">
                                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                        📋 Status Checklist Dokumen ({item.persentase}% - {item.numerator}/{item.denominator} Terupload)
                                      </h4>
                                      <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
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
                                                : 'bg-gray-50/40 dark:bg-gray-950/10 border-gray-150 dark:border-gray-900/40'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                              {doc.is_uploaded ? (
                                                <span className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 text-xs font-bold bg-emerald-100/60 dark:bg-emerald-950/40 w-5 h-5 rounded-full flex items-center justify-center">
                                                  ✓
                                                </span>
                                              ) : (
                                                <span className="text-gray-400 dark:text-gray-600 flex-shrink-0 text-xs font-bold bg-gray-100 dark:bg-gray-900/60 w-5 h-5 rounded-full flex items-center justify-center">
                                                  ✕
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
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/40 select-none">
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
                                                        className="p-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                                                        title="Download File"
                                                      >
                                                        {downloadingDocName === doc.nama_dokumen ? (
                                                          <span className="w-3 h-3 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                                                        ) : (
                                                          <Download className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                                                        )}
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800/80">
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
                            ? 'bg-blue-950 text-white dark:bg-slate-800 dark:text-blue-300 border border-blue-950 dark:border-slate-700 shadow-xs'
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

        {/* === IF TAB IS PERINGKAT (SAW LEADERBOARD) === */}
        {activeTab === 'peringkat' && (
          <div className="space-y-8 animate-fadeIn">
            {/* HERO BANNER */}
            <div className="bg-linear-to-r from-blue-950 via-slate-950 to-blue-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border border-blue-900/40">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Award className="w-48 h-48" />
              </div>
              <div className="space-y-2.5 z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 dark:bg-amber-500 text-blue-950 font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3 fill-current" /> SPK SAW Nasional
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight">Leaderboard Nasional Kelayakan Usulan Lokasi</h1>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Hasil analisis komparatif seluruh cabang Usulan Lokasi di Indonesia berdasarkan pembobotan *Simple Additive Weighting*. Kriteria utama penilaian mencakup Persentase Kelengkapan Dokumen (45%), Durasi Review Legal (35%), dan Harga Sewa per 5 Tahun (20%).
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center z-10 w-full md:w-auto shrink-0">
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Total Usulan Nasional</p>
                <p className="text-3xl font-black text-amber-400">{data.leaderboard.length}</p>
              </div>
            </div>

            {data.leaderboard.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800/60 p-12 text-center shadow-sm text-gray-500">
                <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Belum ada usulan lokasi nasional yang terhitung.</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Harap tunggu pengisian data atau sinkronisasi berkas ULOK dari sistem cabang.</p>
              </div>
            ) : (
              <>
                {/* PODIUM TOP 3 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4">
                  {/* JUARA 2 */}
                  {top3Data[1] && (
                    <div 
                      onClick={() => togglePodiumCard(top3Data[1].id)}
                      className={`order-2 md:order-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative flex flex-col justify-between group h-52.5 ${openPodiumCardId === top3Data[1].id ? 'ring-2 ring-blue-500/40' : ''}`}
                    >
                      <div className="absolute top-4 right-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 p-2 rounded-xl">
                        <Medal className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="space-y-1.5 mt-2">
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nasional Peringkat 2</span>
                        <h3 className="font-black text-base text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {top3Data[1].nama_lokasi}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-900 dark:text-blue-500" /> {top3Data[1].profiles?.branches?.nama_cabang || 'Cabang'}
                        </p>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-800/80 pt-3 flex justify-between items-center">
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Skor SAW</p>
                          <p className="text-xl font-black text-slate-700 dark:text-slate-300">
                            {top3Data[1].final_score?.toFixed(4) || '0.0000'}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                          Detail {openPodiumCardId === top3Data[1].id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* JUARA 1 */}
                  {top3Data[0] && (
                    <div 
                      onClick={() => togglePodiumCard(top3Data[0].id)}
                      className={`order-1 md:order-2 bg-linear-to-b from-amber-50/40 to-white dark:from-amber-950/10 dark:to-gray-900 border-2 border-amber-400 dark:border-amber-500/60 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative flex flex-col justify-between group h-60 md:-translate-y-2 ${openPodiumCardId === top3Data[0].id ? 'ring-4 ring-amber-400/20' : ''}`}
                    >
                      <div className="absolute top-5 right-5 bg-amber-400 dark:bg-amber-500 text-amber-950 p-2.5 rounded-xl shadow-sm animate-bounce">
                        <Trophy className="w-5 h-5 fill-current" />
                      </div>
                      <div className="space-y-1.5 mt-1">
                        <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider inline-block">
                          Rekomendasi Utama Nasional
                        </span>
                        <h3 className="font-black text-lg text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors pt-1">
                          {top3Data[0].nama_lokasi}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" /> {top3Data[0].profiles?.branches?.nama_cabang || 'Cabang'}
                        </p>
                      </div>
                      <div className="border-t border-amber-100 dark:border-gray-800 pt-3 flex justify-between items-center">
                        <div>
                          <p className="text-[9px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-wider">Skor Tertinggi</p>
                          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                            {top3Data[0].final_score?.toFixed(4) || '0.0000'}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                          Detail {openPodiumCardId === top3Data[0].id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* JUARA 3 */}
                  {top3Data[2] && (
                    <div 
                      onClick={() => togglePodiumCard(top3Data[2].id)}
                      className={`order-3 md:order-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative flex flex-col justify-between group h-52.5 ${openPodiumCardId === top3Data[2].id ? 'ring-2 ring-blue-500/40' : ''}`}
                    >
                      <div className="absolute top-4 right-4 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 p-2 rounded-xl">
                        <Medal className="w-5 h-5 text-amber-700 dark:text-amber-600" />
                      </div>
                      <div className="space-y-1.5 mt-2">
                        <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-600 uppercase tracking-wider">Nasional Peringkat 3</span>
                        <h3 className="font-black text-base text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {top3Data[2].nama_lokasi}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-900 dark:text-blue-500" /> {top3Data[2].profiles?.branches?.nama_cabang || 'Cabang'}
                        </p>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-800/80 pt-3 flex justify-between items-center">
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Skor SAW</p>
                          <p className="text-xl font-black text-slate-700 dark:text-slate-300">
                            {top3Data[2].final_score?.toFixed(4) || '0.0000'}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                          Detail {openPodiumCardId === top3Data[2].id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* DETAIL ACCORDION TOP 3 */}
                {top3Data.map((item) => {
                  if (openPodiumCardId !== item.id) return null
                  const isIncomplete = checkIncomplete(item)
                  return (
                    <div key={`podium-detail-${item.id}`} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-5 space-y-4 animate-fadeIn shadow-inner">
                      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                        <Star className="w-4 h-4 text-amber-500 fill-current" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Detail Analisis Perhitungan: {item.nama_lokasi}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
                          <span className="text-[10px] text-gray-400 uppercase font-black block">C1 (Persentase Kelengkapan Dokumen)</span>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1 block">
                            Skor: <strong className="text-gray-900 dark:text-white text-sm font-black">{item.c1_score || 1}</strong> / 5
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
                          <span className="text-[10px] text-gray-400 uppercase font-black block">C2 (Durasi Review Legal)</span>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1 block">
                            Skor: <strong className="text-gray-900 dark:text-white text-sm font-black">{item.c2_score || 1}</strong> / 5
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
                          <span className="text-[10px] text-gray-400 uppercase font-black block">C3 (Harga Sewa per 5 Tahun)</span>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1 block">
                            Skor: <strong className="text-gray-900 dark:text-white text-sm font-black">{item.c3_score || 1}</strong> / 5
                          </span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${isIncomplete ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 text-amber-900 dark:text-amber-300' : 'bg-blue-50/30 border-blue-100 dark:bg-slate-950/40 dark:border-gray-800 text-gray-800 dark:text-gray-300'}`}>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" /> Hasil Analisis Keputusan SPK:
                          </h4>
                          <p className="text-xs font-medium leading-relaxed italic">
                            "{item.saw_analysis_notes || 'Belum ada catatan analisis tersemat untuk lokasi ini.'}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* DAFTAR PERINGKAT LANJUTAN */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pl-1 pt-4">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Daftar Peringkat Nasional Lainnya
                    </h3>
                    <span className="text-xs font-medium text-gray-400">
                      {remainingData.length} Lokasi Terdaftar
                    </span>
                  </div>

                  {remainingData.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800/60 p-8 text-center text-gray-400 dark:text-gray-500 italic text-xs">
                      Tidak ada data peringkat lanjutan nasional saat ini.
                    </div>
                  ) : (
                    displayedRemainingData.map((item, index) => {
                      const isOpen = openPodiumCardId === item.id
                      const actualRank = index + 4 + (currentPage - 1) * itemsPerPage
                      const isIncomplete = checkIncomplete(item)

                      return (
                        <div 
                          key={item.id}
                          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800/80 shadow-xs overflow-hidden transition-all duration-200"
                        >
                          <div 
                            onClick={() => togglePodiumCard(item.id)}
                            className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-all"
                          >
                            <div className="flex items-center gap-3.5 w-full sm:w-auto">
                              <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                {actualRank}
                              </div>
                              
                              <div className="space-y-0.5 min-w-0">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate flex items-center gap-2">
                                  {item.nama_lokasi}
                                  {isIncomplete && (
                                    <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                                      Skor Berjalan
                                    </span>
                                  )}
                                </h3>
                                
                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                                  <span className="flex items-center gap-1 font-bold text-blue-900 dark:text-blue-400">
                                    <MapPin className="w-3 h-3" /> {item.profiles?.branches?.nama_cabang || 'Cabang'}
                                  </span>
                                  <span>•</span>
                                  <span>Oleh: {item.profiles?.full_name || 'Admin'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-none pt-2.5 sm:pt-0 border-gray-100 dark:border-gray-800">
                              <div className="text-left sm:text-right">
                                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Skor SAW</p>
                                <p className="text-sm font-black text-gray-800 dark:text-gray-200">
                                  {item.final_score?.toFixed(4) || '0.0000'}
                                </p>
                              </div>
                              <div className="text-gray-400 dark:text-gray-500">
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                          {isOpen && (
                            <div className="bg-gray-50/50 dark:bg-gray-950/30 border-t border-gray-100 dark:border-gray-800 p-4 space-y-4 animate-fadeIn">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-800/80">
                                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">C1 (Persentase Kelengkapan Dokumen)</span>
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5 block">
                                    Skor: <strong className="text-gray-900 dark:text-white font-black">{item.c1_score || 1}</strong> / 5
                                  </span>
                                </div>
                                <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-800/80">
                                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">C2 (Durasi Review Legal)</span>
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5 block">
                                    Skor: <strong className="text-gray-900 dark:text-white font-black">{item.c2_score || 1}</strong> / 5
                                  </span>
                                </div>
                                <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-800/80">
                                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">C3 (Harga Sewa per 5 Tahun)</span>
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5 block">
                                    Skor: <strong className="text-gray-900 dark:text-white font-black">{item.c3_score || 1}</strong> / 5
                                  </span>
                                </div>
                              </div>
                              
                              <div className={`p-3.5 rounded-xl border text-xs ${isIncomplete ? 'bg-amber-50/40 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/60 text-amber-900 dark:text-amber-400' : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'}`}>
                                <p className="font-bold uppercase text-[9px] tracking-wider text-gray-400 mb-0.5">Analisis Pengambilan Keputusan:</p>
                                <p className="font-medium italic leading-relaxed">"{item.saw_analysis_notes || 'Belum ada catatan khusus.'}"</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* PAGINATION UNTUK PERINGKAT */}
                {totalPeringkatPages > 1 && (
                  <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-xl shadow-xs transition-colors">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      Prev
                    </button>
                    
                    <div className="hidden sm:flex items-center gap-1.5">
                      {Array.from({ length: totalPeringkatPages }, (_, idx) => {
                        const pageNum = idx + 1
                        return (
                          <button
                            key={`peringkat-page-${pageNum}`}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7.5 h-7.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              currentPage === pageNum
                                ? 'bg-blue-950 text-white dark:bg-slate-800 dark:text-blue-300 border border-blue-950 dark:border-slate-700 shadow-xs'
                                : 'border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <span className="sm:hidden text-xs font-semibold text-gray-500">
                      Halaman {currentPage} / {totalPeringkatPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPeringkatPages))}
                      disabled={currentPage === totalPeringkatPages}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}