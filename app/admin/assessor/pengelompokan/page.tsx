'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getPengelompokanData, UlokGroupItem, PengelompokanResult } from '@/actions/pengelompokan'

export default function PengelompokanDashboard() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // State
  const [data, setData] = useState<PengelompokanResult>({
    kelompok1: [],
    kelompok2: [],
    kelompok3: [],
    kelompok4: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'kelompok1' | 'kelompok2' | 'kelompok3' | 'kelompok4'>('kelompok2')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchData()
  }, [])

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
      case 'kelompok1':
        return data.kelompok1
      case 'kelompok2':
        return data.kelompok2
      case 'kelompok3':
        return data.kelompok3
      case 'kelompok4':
        // Specifically for Kelompok 4, sort by SAW final score descending
        return [...data.kelompok4].sort((a, b) => (b.saw?.final_score || 0) - (a.saw?.final_score || 0))
      default:
        return []
    }
  }

  // Filter items in active tab based on search query
  const filteredData = getActiveTabData().filter((item) => {
    const q = searchQuery.toLowerCase()
    if (!q) return true
    
    const namaLokasi = (item.nama_lokasi || '').toLowerCase()
    const namaPemilik = (item.nama_pemegang_hak || '').toLowerCase()
    const asalCabang = (item.profiles?.branches?.nama_cabang || '').toLowerCase()
    const jenisBadanHukum = (item.jenis_badan_hukum || '').toLowerCase()
    
    return (
      namaLokasi.includes(q) ||
      namaPemilik.includes(q) ||
      asalCabang.includes(q) ||
      jenisBadanHukum.includes(q)
    )
  })

  // Pagination calculations
  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const displayedItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Reset page on tab change
  const handleTabChange = (tab: 'kelompok1' | 'kelompok2' | 'kelompok3' | 'kelompok4') => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Dashboard Pengelompokan Progress ULOK
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Evaluasi berkas usulan lokasi berdasarkan progress pengunggahan dokumen dan penilaian kelayakan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-50 transition active:scale-95"
            >
              🔄 Refresh
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
                id: 'kelompok1',
                label: 'Belum Diproses',
                subtitle: 'Progress Rendah (<20%)',
                color: 'blue',
                count: data.kelompok1.length
              },
              {
                id: 'kelompok2',
                label: 'Antrean Aktif',
                subtitle: 'Sedang Proses Upload',
                color: 'amber',
                count: data.kelompok2.length
              },
              {
                id: 'kelompok3',
                label: 'Perlu Revisi',
                subtitle: 'Dikembalikan ke Cabang',
                color: 'rose',
                count: data.kelompok3.length
              },
              {
                id: 'kelompok4',
                label: 'Selesai Dinilai',
                subtitle: 'Approved & 100% Dokumen',
                color: 'emerald',
                count: data.kelompok4.length
              }
            ].map((tab) => {
              const isActive = activeTab === tab.id
              const activeColorClass = 
                tab.id === 'kelompok1' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500' :
                tab.id === 'kelompok2' ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-500' :
                tab.id === 'kelompok3' ? 'border-rose-600 text-rose-600 dark:text-rose-400 dark:border-rose-500' :
                'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-500'

              const countBadgeBgClass = 
                tab.id === 'kelompok1' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' :
                tab.id === 'kelompok2' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' :
                tab.id === 'kelompok3' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' :
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex-1 min-w-[200px] py-4 px-4 text-left border-b-2 font-medium text-sm transition-all focus:outline-none ${
                    isActive
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
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan lokasi, pemilik, cabang, dll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
                    {activeTab === 'kelompok2' ? (
                      <th className="p-4 w-1/3">Progress Upload Dokumen</th>
                    ) : activeTab === 'kelompok4' ? (
                      <th className="p-4 text-center font-bold text-slate-800 dark:text-white">Skor Rekomendasi SAW</th>
                    ) : (
                      <th className="p-4">Progress Dokumen</th>
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

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        {/* 1. Nama ULOK */}
                        <td className="p-4 pl-6">
                          <div className="font-bold text-gray-950 dark:text-white text-[14px]">
                            {item.nama_lokasi}
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
                        {activeTab === 'kelompok2' ? (
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
                            </div>
                          </td>
                        ) : activeTab === 'kelompok4' ? (
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                {item.numerator}/{item.denominator} Dokumen
                              </span>
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                {item.persentase.toFixed(0)}%
                              </span>
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
                            onClick={() => handleViewDetail(item.id, item.jenis_badan_hukum)}
                            disabled={isPending}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-[#142B4D] hover:bg-[#1f4275] active:scale-95 disabled:opacity-50 transition rounded-xl shadow-sm inline-flex items-center justify-center gap-1.5"
                          >
                            <span>Detail</span>
                            <span>🔍</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* --- PAGINATION CONTROLS --- */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-850/50 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
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
