'use client'

import React, { useState } from 'react'
import {
  RefreshCw,
  Store,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Download,
  ChevronRight,
  Calendar,
  Building2,
} from 'lucide-react'

const DUMMY_STORES = [
  {
    id: '1',
    kode_toko: 'T-0452',
    nama_lokasi: 'Alfamidi Super Sudirman',
    alamat: 'Jl. Jend. Sudirman No. 14, Jakarta Pusat',
    masa_sewa_berakhir: '2027-02-15',
    sisa_waktu: '5 Bulan',
    status_sewa: 'Segera Habis',
    kategori: 'Alfamidi Super',
  },
  {
    id: '2',
    kode_toko: 'T-0891',
    nama_lokasi: 'Alfamidi Express Thamrin',
    alamat: 'Jl. MH Thamrin No. 8, Jakarta Pusat',
    masa_sewa_berakhir: '2027-04-10',
    sisa_waktu: '7 Bulan',
    status_sewa: 'Perlu Ditinjau',
    kategori: 'Alfamidi Express',
  },
  {
    id: '3',
    kode_toko: 'T-1204',
    nama_lokasi: 'Alfamidi Senayan City',
    alamat: 'Jl. Asia Afrika Lot 19, Senayan, Jakarta Selatan',
    masa_sewa_berakhir: '2027-07-20',
    sisa_waktu: '10 Bulan',
    status_sewa: 'Dalam Pantauan',
    kategori: 'Alfamidi Super',
  },
  {
    id: '4',
    kode_toko: 'T-0337',
    nama_lokasi: 'Alfamidi Fatmawati',
    alamat: 'Jl. RS Fatmawati No. 25, Jakarta Selatan',
    masa_sewa_berakhir: '2027-01-05',
    sisa_waktu: '3 Bulan',
    status_sewa: 'Mendesak',
    kategori: 'Alfamidi',
  },
]

type StatusKey = 'Mendesak' | 'Segera Habis' | 'Perlu Ditinjau' | 'Dalam Pantauan'

const STATUS_CONFIG: Record<StatusKey, { color: string; bg: string }> = {
  Mendesak: {
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800',
  },
  'Segera Habis': {
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800',
  },
  'Perlu Ditinjau': {
    color: 'text-yellow-700 dark:text-yellow-500',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800',
  },
  'Dalam Pantauan': {
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800',
  },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-4 translate-x-4 ${accent}`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{label}</p>
    </div>
  )
}

export default function PerpanjanganCabangPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua')

  const filtered = DUMMY_STORES.filter((s) => {
    const matchSearch =
      s.nama_lokasi.toLowerCase().includes(search.toLowerCase()) ||
      s.kode_toko.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'Semua' || s.status_sewa === filterStatus
    return matchSearch && matchStatus
  })

  const statuses = ['Semua', 'Mendesak', 'Segera Habis', 'Perlu Ditinjau', 'Dalam Pantauan']

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-slate-950 transition-colors">
      {/* PAGE HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#142B4D] flex items-center justify-center shadow-md shrink-0">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Perpanjangan Toko Existing
                  </h1>
                  <span className="text-[10px] font-bold bg-[#F28705]/20 text-[#F28705] px-2 py-0.5 rounded-full border border-[#F28705]/30 uppercase tracking-wider">
                    IPD/Midiloc
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pantau toko yang masa sewanya akan segera habis dan proses perpanjangannya.
                </p>
              </div>
            </div>
            <button
              onClick={() => alert('Fitur ekspor sedang dalam pengembangan.')}
              className="inline-flex items-center gap-2 bg-[#142B4D] hover:bg-[#1a3a6b] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
            >
              <Download className="w-4 h-4" />
              Ekspor CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 md:px-10 md:py-8 space-y-6">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Store className="w-5 h-5 text-white" />}
            label="Total Toko Existing"
            value={DUMMY_STORES.length}
            accent="bg-[#142B4D]"
          />
          <SummaryCard
            icon={<AlertTriangle className="w-5 h-5 text-white" />}
            label="Status Mendesak"
            value={DUMMY_STORES.filter((s) => s.status_sewa === 'Mendesak').length}
            accent="bg-[#D91E2E]"
          />
          <SummaryCard
            icon={<Clock className="w-5 h-5 text-white" />}
            label="Segera Habis"
            value={DUMMY_STORES.filter((s) => s.status_sewa === 'Segera Habis').length}
            accent="bg-[#F28705]"
          />
          <SummaryCard
            icon={<CheckCircle2 className="w-5 h-5 text-white" />}
            label="Dalam Pantauan"
            value={DUMMY_STORES.filter((s) => s.status_sewa === 'Dalam Pantauan').length}
            accent="bg-emerald-600"
          />
        </div>

        {/* FILTER BAR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode toko atau nama lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B4D]/30 focus:border-[#142B4D] transition"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  filterStatus === s
                    ? 'bg-[#142B4D] text-white border-[#142B4D]'
                    : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#142B4D] hover:text-[#142B4D] dark:hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#142B4D] dark:text-slate-400" />
              Daftar Toko Existing
              <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                {filtered.length} toko
              </span>
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">
              Sumber: IPD/Midiloc Integration
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60">
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Kode Toko</th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Nama Lokasi</th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Kategori</th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Masa Sewa Berakhir</span>
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Sisa Waktu</th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Store className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">
                          Tidak ada toko yang sesuai filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((store) => {
                    const statusCfg = STATUS_CONFIG[store.status_sewa as StatusKey] ?? STATUS_CONFIG['Dalam Pantauan']
                    return (
                      <tr key={store.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                            {store.kode_toko}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{store.nama_lokasi}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-56">{store.alamat}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs text-slate-600 dark:text-slate-400">{store.kategori}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{formatDate(store.masa_sewa_berakhir)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{store.sisa_waktu}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                            {store.status_sewa}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => alert(`Fitur Proses Perpanjangan untuk ${store.nama_lokasi} (${store.kode_toko}) sedang dalam pengembangan.`)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#142B4D] hover:bg-[#1a3a6b] text-white px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Proses Perpanjangan
                            <ChevronRight className="w-3 h-3 opacity-60" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Menampilkan <span className="font-semibold text-slate-600 dark:text-slate-300">{filtered.length}</span> dari{' '}
              <span className="font-semibold text-slate-600 dark:text-slate-300">{DUMMY_STORES.length}</span> toko
            </p>
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">
              Data dummy — integrasi IPD/Midiloc aktif pada fase berikutnya
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
