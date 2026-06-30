'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getPengelompokanData, UlokGroupItem, PengelompokanResult } from '@/actions/pengelompokan'
import { Download } from 'lucide-react'

export default function PengelompokanDashboard() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // State
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<PengelompokanResult>({
    antreanAktif: [],
    patutDilihat: [],
    perluRevisi: [],
    selesai: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'antreanAktif' | 'patutDilihat' | 'perluRevisi' | 'selesai'>('antreanAktif')
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedBadanHukum, setSelectedBadanHukum] = useState<string>('all')
  const [showFilterPopover, setShowFilterPopover] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  const [downloadingDocName, setDownloadingDocName] = useState<string | null>(null)

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

  // Helper routing function
  const handleViewDetail = (id: string, jenisBadanHukum: string) => {
    const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa']
    const route = kelompokPerorangan.includes(jenisBadanHukum)
      ? '/admin/assessor/penilaian/ulok-perorangan'
      : '/admin/assessor/penilaian/ulok-badanhukum'

    startTransition(() => {
      router.push(`${route}?id=${id}`)
    })
  }

  // Get active tab data
  const getActiveTabData = (): UlokGroupItem[] => {
    switch (activeTab) {
      case 'antreanAktif':
        return data.antreanAktif
      case 'patutDilihat':
        return data.patutDilihat
      case 'perluRevisi':
        return data.perluRevisi
      case 'selesai':
        // Specifically for selesai, sort by SAW final score descending
        return [...data.selesai].sort((a, b) => (b.saw?.final_score || 0) - (a.saw?.final_score || 0))
      default:
        return []
    }
  }

  // Extract unique branch names from the dataset dynamically
  const allBranches = Array.from(
    new Set(
      [
        ...data.antreanAktif,
        ...data.patutDilihat,
        ...data.perluRevisi,
        ...data.selesai
      ]
        .map((item) => item.profiles?.branches?.nama_cabang)
        .filter(Boolean) as string[]
    )
  ).sort()

  const badanHukumOptions = ['PT', 'Koperasi', 'Yayasan', 'Perorangan', 'Kuasa', 'Waris', 'Hibah']

  // Helper to filter proposal items by all active filters
  const applyAllFilters = (item: UlokGroupItem) => {
    // 1. Search Query filter
    const q = searchQuery.toLowerCase()
    let matchesSearch = true
    if (q) {
      const namaLokasi = (item.nama_lokasi || '').toLowerCase()
      const namaPemilik = (item.nama_pemegang_hak || '').toLowerCase()
      const asalCabang = (item.profiles?.branches?.nama_cabang || '').toLowerCase()
      const jenisBadanHukum = (item.jenis_badan_hukum || '').toLowerCase()

      matchesSearch = (
        namaLokasi.includes(q) ||
        namaPemilik.includes(q) ||
        asalCabang.includes(q) ||
        jenisBadanHukum.includes(q)
      )
    }

    // 2. Branch filter
    const matchesBranch = selectedBranch === 'all' || item.profiles?.branches?.nama_cabang === selectedBranch

    // 3. Badan Hukum filter
    const matchesBadanHukum = selectedBadanHukum === 'all' || item.jenis_badan_hukum === selectedBadanHukum

    return matchesSearch && matchesBranch && matchesBadanHukum
  }

  // Filter items in active tab based on active filters
  const filteredData = getActiveTabData().filter(applyAllFilters)

  // Get dynamic count of filtered items per tab in real-time
  const getFilteredCountForTab = (tabId: 'antreanAktif' | 'patutDilihat' | 'perluRevisi' | 'selesai'): number => {
    let list: UlokGroupItem[] = []
    switch (tabId) {
      case 'antreanAktif':
        list = data.antreanAktif
        break
      case 'patutDilihat':
        list = data.patutDilihat
        break
      case 'perluRevisi':
        list = data.perluRevisi
        break
      case 'selesai':
        list = data.selesai
        break
    }
    return list.filter(applyAllFilters).length
  }

  // Pagination calculations
  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const displayedItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const activeFilterCount = (selectedBranch !== 'all' ? 1 : 0) + (selectedBadanHukum !== 'all' ? 1 : 0)

  // Reset page on tab change
  const handleTabChange = (tab: 'antreanAktif' | 'patutDilihat' | 'perluRevisi' | 'selesai') => {
    setActiveTab(tab)
    setCurrentPage(1)
    setExpandedRowId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Pengelompokan Progress ULOK
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Evaluasi berkas usulan lokasi berdasarkan progress pengunggahan dokumen dan penilaian kelayakan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* --- COMBINED FILTER POPOVER --- */}
            <div className="relative">
              <button
                onClick={() => setShowFilterPopover(!showFilterPopover)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-95 cursor-pointer"
              >
                <img src="/icons/icon-filter.svg" alt="Filter" className="w-4 h-4 dark:invert" />
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
                      Filter Usulan Lokasi
                    </h4>

                    {/* Filter Cabang */}
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
                        {allBranches.map((br) => (
                          <option key={br} value={br}>
                            {br}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter Badan Hukum */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        Badan Hukum / Jalur
                      </label>
                      <select
                        value={selectedBadanHukum}
                        onChange={(e) => {
                          setSelectedBadanHukum(e.target.value)
                          setCurrentPage(1)
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="all">Semua Badan Hukum / Jalur</option>
                        {badanHukumOptions.map((bh) => (
                          <option key={bh} value={bh}>
                            {bh}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Actions */}
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

            <button
              onClick={fetchData}
              disabled={mounted ? loading : false}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-50 transition active:scale-95 cursor-pointer"
            >
              <img src="/icons/icon-refresh.svg" alt="Refresh" className="w-4 h-4 dark:invert" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* --- TABS SYSTEM --- */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex flex-wrap -mb-px gap-2" aria-label="Tabs">
            {/* TABS BUTTONS */}
            {[
              {
                id: 'antreanAktif',
                label: 'Antrean Aktif',
                subtitle: 'Sedang Proses Review',
                color: 'amber',
                count: getFilteredCountForTab('antreanAktif')
              },
              {
                id: 'patutDilihat',
                label: 'Patut Dilihat',
                subtitle: 'Rekomendasi Prioritas',
                color: 'purple',
                count: getFilteredCountForTab('patutDilihat')
              },
              {
                id: 'perluRevisi',
                label: 'Perlu Revisi',
                subtitle: 'Dikembalikan ke Cabang',
                color: 'rose',
                count: getFilteredCountForTab('perluRevisi')
              },
              {
                id: 'selesai',
                label: 'Selesai Dinilai',
                subtitle: 'Approved & Rejected',
                color: 'emerald',
                count: getFilteredCountForTab('selesai')
              }
            ].map((tab) => {
              const isActive = activeTab === tab.id
              const activeColorClass =
                tab.id === 'antreanAktif' ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-500' :
                  tab.id === 'patutDilihat' ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-500' :
                    tab.id === 'perluRevisi' ? 'border-rose-600 text-rose-600 dark:text-rose-400 dark:border-rose-500' :
                      'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-500'

              const countBadgeBgClass =
                tab.id === 'antreanAktif' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' :
                  tab.id === 'patutDilihat' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' :
                    tab.id === 'perluRevisi' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' :
                      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex-1 min-w-[200px] py-4 px-4 text-left border-b-2 font-medium text-sm transition-all focus:outline-none ${isActive
                    ? `${activeColorClass} bg-white dark:bg-gray-900/50 rounded-t-xl`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[15px]">{tab.label}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black select-none ${countBadgeBgClass}`}>
                      {tab.count}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-normal">{tab.subtitle}</p>
                </button>
              )
            })}
          </nav>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800/80 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <img src="/icons/icon_sharp-search.svg" alt="Search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 dark:invert" />
            <input
              type="text"
              placeholder="Cari berdasarkan lokasi, pemilik, cabang, dll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold self-center sm:self-auto">
            Menampilkan {totalItems === 0 ? '0' : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)}`} dari {totalItems} data
          </div>
        </div>

        {/* --- ERROR MESSAGE --- */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <div className="font-medium text-sm">{error}</div>
          </div>
        )}

        {/* --- MAIN CONTENT & TABLES --- */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center text-gray-400 italic flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-slate-800 dark:border-slate-800 dark:border-t-slate-200"></div>
                <span className="text-sm">Memuat data kelompok...</span>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">📁</span>
                <span className="text-sm font-semibold">Tidak ada usulan lokasi di kelompok ini.</span>
                <span className="text-xs text-gray-500">Gunakan kata kunci pencarian lain atau sinkronkan data.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                    <th className="p-4 pl-6">Nama ULOK</th>
                    <th className="p-4">Asal Cabang</th>
                    <th className="p-4">Badan Hukum / Jalur</th>
                    {activeTab === 'selesai' ? (
                      <th className="p-4 text-center font-bold text-slate-800 dark:text-white">Skor Rekomendasi SAW</th>
                    ) : (
                      <th className="p-4 w-1/3">Progress Upload Dokumen</th>
                    )}
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {displayedItems.map((item) => {
                    const branchName = item.profiles?.branches?.nama_cabang || 'Cabang Pusat'
                    const detailRouteLabel = isPending ? '⏳' : 'Detail 🔍'

                    // Custom style/labels for progress percentage
                    let progressColorClass = 'bg-blue-600'
                    if (item.persentase >= 100) {
                      progressColorClass = 'bg-emerald-500'
                    } else if (item.persentase >= 60) {
                      progressColorClass = 'bg-blue-600'
                    } else if (item.persentase >= 20) {
                      progressColorClass = 'bg-amber-500'
                    } else {
                      progressColorClass = 'bg-rose-500'
                    }

                    // Format Badge Status
                    let statusBadgeStyles = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                    if (item.status === 'Approved') {
                      statusBadgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                    } else if (item.status === 'Revisi') {
                      statusBadgeStyles = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50'
                    } else if (item.status === 'Rejected') {
                      statusBadgeStyles = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
                    } else if (item.status === 'In Review') {
                      statusBadgeStyles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
                    }

                    const isExpanded = expandedRowId === item.id

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          onClick={() => {
                            setExpandedRowId(isExpanded ? null : item.id)
                          }}
                          className={`cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40 select-none ${isExpanded ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''} transition-colors duration-200`}
                        >
                          {/* 1. Nama ULOK */}
                          <td className="p-4 pl-6">
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
                          </td>

                          {/* 2. Asal Cabang */}
                          <td className="p-4">
                            <span className="inline-block px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                              {branchName}
                            </span>
                          </td>

                          {/* 3. Badan Hukum / Jalur */}
                          <td className="p-4">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {item.jenis_badan_hukum}
                            </span>
                          </td>

                          {/* 4. Tab Specific Progress / SAW Columns */}
                          {activeTab === 'selesai' ? (
                            <td className="p-4 text-center">
                              {item.saw?.final_score !== undefined && item.saw?.final_score !== null ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="font-mono text-base font-extrabold text-purple-700 dark:text-purple-400">
                                    {item.saw.final_score.toFixed(3)}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    SPK SAW Rank Score
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Skor Belum Dihitung</span>
                              )}
                            </td>
                          ) : (
                            <td className="p-4">
                              <div className="space-y-1.5 max-w-[280px]">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                                    {item.numerator}/{item.denominator} Dokumen Terupload
                                  </span>
                                  <span className="text-amber-600 dark:text-amber-400 font-mono">
                                    {item.persentase.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${progressColorClass}`}
                                    style={{ width: `${item.persentase}%` }}
                                  ></div>
                                </div>
                                {activeTab === 'patutDilihat' && (
                                  <div className="mt-2 bg-gradient-to-br from-purple-50 to-slate-50 dark:from-purple-950/20 dark:to-slate-900/20 border border-purple-100 dark:border-purple-900/50 shadow-sm rounded-xl p-2.5 space-y-1">
                                    <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold text-[10px]">
                                      <span>✨</span>
                                      <span>{item.recommendation_reason || "Alas hak aman & harga sewa ramah anggaran"}</span>
                                    </div>
                                    <div className="text-[9px] font-medium text-purple-800 dark:text-purple-300">
                                      Sewa: {item.harga_sewa ? `Rp ${item.harga_sewa.toLocaleString('id-ID')}` : 'N/A'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          {/* 5. Status Badge */}
                          <td className="p-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadgeStyles}`}>
                              {item.status}
                            </span>
                          </td>

                          {/* 6. Aksi (Detail) */}
                          <td className="p-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetail(item.id, item.jenis_badan_hukum)
                              }}
                              disabled={isPending}
                              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-[#142B4D] hover:bg-[#1f4275] active:scale-95 disabled:opacity-50 transition rounded-xl shadow-sm inline-flex items-center justify-center gap-1.5"
                            >
                              <span>Detail</span>
                              <img src="/icons/icon_sharp-search.svg" alt="Detail" className="w-3.5 h-3.5 invert" />
                            </button>
                          </td>
                        </tr>

                        {/* Accordion Row Checklists */}
                        {isExpanded && (
                          <tr className="bg-gray-50/60 dark:bg-gray-900/30 transition-all duration-300">
                            <td colSpan={6} className="p-5 border-t border-gray-100 dark:border-gray-800">
                              <div className="bg-white dark:bg-gray-950 rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800/85 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-3">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                      📋 Status Checklist Dokumen ({item.persentase}% - {item.numerator}/{item.denominator} Terupload)
                                    </h4>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    Jalur: {item.jenis_badan_hukum}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {item.checklistStatus && item.checklistStatus.length > 0 ? (
                                    item.checklistStatus.map((doc, idx) => (
                                      <div
                                        key={idx}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${doc.is_uploaded
                                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/80 dark:border-emerald-900/30 hover:border-emerald-250 dark:hover:border-emerald-800'
                                          : 'bg-gray-50/40 dark:bg-gray-950/10 border-gray-150 dark:border-gray-900/40 hover:border-gray-250 dark:hover:border-gray-800'
                                          }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          {doc.is_uploaded ? (
                                            <span className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 text-xs font-bold bg-emerald-100/60 dark:bg-emerald-950/40 w-5 h-5 rounded-full flex items-center justify-center">
                                              ✓
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 dark:text-gray-605 flex-shrink-0 text-xs font-bold bg-gray-100 dark:bg-gray-900/60 w-5 h-5 rounded-full flex items-center justify-center">
                                              ✕
                                            </span>
                                          )}
                                          <span
                                            className={`text-xs font-semibold truncate ${doc.is_uploaded
                                              ? 'text-gray-800 dark:text-gray-205'
                                              : 'text-gray-400 dark:text-gray-500'
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
                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/50">
                                                Terunggah
                                              </span>
                                              {doc.file_url && (
                                                <div className="flex gap-1">
                                                  <a 
                                                    href={doc.file_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all flex items-center justify-center"
                                                    title="View File"
                                                  >
                                                    <img src="/icons/icon-view.svg" alt="View" className="w-3 h-3 object-contain dark:invert" />
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
                                                      <span className="w-3 h-3 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                                                    ) : (
                                                      <Download className="w-3 h-3" />
                                                    )}
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-450 border border-gray-200 dark:border-gray-800/80">
                                              Belum
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))
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
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* --- PAGINATION CONTROLS --- */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition"
              >
                Prev
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
