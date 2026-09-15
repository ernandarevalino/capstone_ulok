'use client'

import React, { useState } from 'react'
import {
  RefreshCw,
  ClipboardCheck,
  Search,
  Inbox,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react'

const DUMMY_QUEUES: any[] = [
  {
    id: '1',
    kode_toko: 'T-0452',
    nama_lokasi: 'Alfamidi Super Sudirman',
    cabang: 'Cabang Jakarta 1',
    kategori_usulan: 'Perpanjangan (Existing)',
    tanggal_pengajuan: '2026-09-10',
    masa_sewa_berakhir: '2027-02-15',
    status: 'In Review',
    skor_saw: '-',
  },
]

export default function PerpanjanganAssessorPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'semua' | 'antrean' | 'selesai'>('antrean')

  const filteredData = DUMMY_QUEUES.filter((item) => {
    const matchSearch =
      item.nama_lokasi.toLowerCase().includes(search.toLowerCase()) ||
      item.kode_toko.toLowerCase().includes(search.toLowerCase()) ||
      item.cabang.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-slate-950 transition-colors">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-md shrink-0">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Antrean Perpanjangan Toko
                  </h1>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">
                    Assessor
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Review dan berikan penilaian SAW khusus untuk perpanjangan toko existing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 md:px-10 md:py-8 space-y-6">
        {/* INFORMATIONAL BANNER */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-blue-900 dark:text-blue-200">
            <span className="font-bold">Informasi Modul Perpanjangan:</span> Usulan perpanjangan toko existing diprioritaskan berdasarkan kriteria khusus (sisa waktu sewa, revenue historis, & evaluasi kelayakan ulang). Badges <span className="font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">Perpanjangan (Existing)</span> membedakan pengajuan ini dengan usulan lokasi toko baru.
          </div>
        </div>

        {/* SEARCH & TABS BAR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-sm justify-between items-center">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('antrean')}
              className={`flex-1 sm:flex-initial text-xs font-bold px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'antrean'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Antrean Masuk ({DUMMY_QUEUES.length})
            </button>
            <button
              onClick={() => setActiveTab('selesai')}
              className={`flex-1 sm:flex-initial text-xs font-bold px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'selesai'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Telah Dinilai (0)
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode/nama toko..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* TABLE OR EMPTY STATE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-amber-500" />
              Daftar Usulan Perpanjangan
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60">
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Kode Toko</th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Nama Lokasi & Cabang</th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Kategori</th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Sisa Masa Sewa</th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeTab === 'selesai' || filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                          <Inbox className="w-7 h-7" />
                        </div>
                        <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                          Belum ada antrean perpanjangan saat ini.
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                          Usulan perpanjangan toko dari Admin Cabang akan secara otomatis muncul di halaman ini untuk diproses Penilaian SAW.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                          {item.kode_toko}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{item.nama_lokasi}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.cabang}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <Sparkles className="w-3 h-3" />
                          {item.kategori_usulan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {item.masa_sewa_berakhir}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => alert(`Fitur Penilaian SAW Perpanjangan untuk ${item.nama_lokasi} (${item.kode_toko}) sedang dalam pengembangan.`)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                        >
                          Penilaian SAW
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
