'use client'

import React, { useState, useEffect, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Search,
  Filter,
  RotateCcw,
  Trash2,
  AlertTriangle,
  FileText,
  Folder,
  Building,
  Loader2,
  Clock,
  Database,
  RefreshCw
} from 'lucide-react'
import {
  getSuperAdminBackupItems,
  restoreToCabangRecycleBin,
  hardDeleteSuperAdminItem,
  BackupItem
} from '@/actions/recyclebin'
import { getAllBranchesAction } from '@/actions/superadmin'

export default function SuperAdminRecycleBinPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // States
  const [items, setItems] = useState<BackupItem[]>([])
  const [branches, setBranches] = useState<{ id: number; nama_cabang: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'ulok' | 'document'>('all')
  const [branchFilter, setBranchFilter] = useState<string>('all')

  // Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    actionType: 'restore' | 'delete'
    targetItem?: BackupItem
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'restore'
  })

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean
    message: string
  }>({
    isOpen: false,
    message: ''
  })

  // Load branches and backup items
  const loadInitialData = async () => {
    setLoading(true)
    try {
      const resBranches = await getAllBranchesAction()
      if (resBranches.success && resBranches.data) {
        setBranches(resBranches.data)
      }

      const resBackup = await getSuperAdminBackupItems({
        branchId: branchFilter,
        type: typeFilter,
        search: searchQuery
      })

      if (resBackup.success && resBackup.data) {
        setItems(resBackup.data)
      } else {
        console.error('Gagal mengambil data backup:', resBackup.error)
      }
    } catch (err) {
      console.error('Error memuat data Super Admin Recycle Bin:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [branchFilter, typeFilter]) // Reload on dynamic filter changes

  // Trigger search execution
  const handleSearch = () => {
    setLoading(true)
    getSuperAdminBackupItems({
      branchId: branchFilter,
      type: typeFilter,
      search: searchQuery
    }).then((res) => {
      if (res.success && res.data) {
        setItems(res.data)
      }
      setLoading(false)
    })
  }

  // Handle enter key on search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Date formatter
  const formatPurgedAt = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return '-'
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const pad = (num: number) => String(num).padStart(2, '0')

      const day = date.getDate()
      const month = months[date.getMonth()]
      const year = date.getFullYear()
      const hours = pad(date.getHours())
      const minutes = pad(date.getMinutes())

      return `${day} ${month} ${year}, ${hours}:${minutes} WIB`
    } catch {
      return '-'
    }
  }

  // Action Triggers
  const triggerRestore = (item: BackupItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Pulihkan Item ke Cabang',
      message: `Apakah Anda yakin ingin memulihkan ${item.type === 'ulok' ? 'usulan' : 'dokumen'} "${item.name}" kembali ke Recycle Bin Cabang ${item.branchName}?`,
      actionType: 'restore',
      targetItem: item
    })
  }

  const triggerDelete = (item: BackupItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Permanen dari Sistem',
      message: `Apakah Anda yakin ingin menghapus "${item.name}" secara permanen? Berkas fisik akan dihapus selamanya dari Supabase Storage dan seluruh relasi data di basis data akan dibersihkan. Tindakan ini TIDAK dapat dibatalkan.`,
      actionType: 'delete',
      targetItem: item
    })
  }

  // Execute confirmation action
  const executeConfirmAction = () => {
    const { actionType, targetItem } = confirmModal
    if (!targetItem) return

    setConfirmModal((prev) => ({ ...prev, isOpen: false }))

    startTransition(async () => {
      if (actionType === 'restore') {
        const res = await restoreToCabangRecycleBin(targetItem.id, targetItem.type)
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: `Berhasil memulihkan "${targetItem.name}" ke Recycle Bin Cabang.`
          })
          loadInitialData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 2000)
        } else {
          alert('Gagal memulihkan item: ' + res.error)
        }
      } else if (actionType === 'delete') {
        const res = await hardDeleteSuperAdminItem(targetItem.id, targetItem.type)
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: `Berhasil menghapus permanen "${targetItem.name}" dari sistem.`
          })
          loadInitialData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 2000)
        } else {
          alert('Gagal menghapus item: ' + res.error)
        }
      }
    })
  }

  // Countdown badge styling
  const getCountdownBadge = (days: number) => {
    if (days <= 10) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/30 text-[#D91E2E] dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-center gap-1 w-fit">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Sisa {days} Hari
        </span>
      )
    } else if (days <= 20) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/30 text-[#F28705] dark:text-orange-400 border border-orange-200 dark:border-orange-900/40 flex items-center gap-1 w-fit">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Sisa {days} Hari
        </span>
      )
    } else {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-1 w-fit">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Sisa {days} Hari
        </span>
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-[#0D0D0D] p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* BACK LINK */}
        <button
          onClick={() => router.push('/admin/super-admin')}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-[#3365A6] dark:hover:text-blue-400 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Kembali ke Dashboard
        </button>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight flex items-center gap-3">
              <Database className="w-8 h-8 text-[#3365A6] dark:text-blue-500" />
              Recycle Bin - Level 2 Backup
            </h1>
            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-3xl leading-relaxed">
              Global Backup Recovery System. Halaman ini menyimpan seluruh berkas usulan lokasi dan dokumen yang telah dihapus permanen oleh Admin Cabang. Anda dapat memulihkannya kembali ke Cabang atau menghapusnya secara fisik selamanya.
            </p>
          </div>

          <button
            onClick={() => loadInitialData()}
            disabled={loading || isPending}
            className="self-start md:self-auto bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* INFO BANNER */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-[#F28705] shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-amber-800 dark:text-amber-400 leading-relaxed font-semibold">
            Perhatian: Seluruh item di dalam Level 2 Backup Recycle Bin ini akan dibersihkan secara otomatis selamanya oleh sistem setelah sisa hari countdown habis (30 hari sejak dihapus oleh cabang).
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 p-4 flex flex-col lg:flex-row items-center gap-4">

          {/* Search */}
          <div className="relative flex items-center w-full lg:flex-1">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama item, cabang, induk, atau penghapus... (Tekan Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-[#F2F2F2] dark:bg-gray-950 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-[#3365A6] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#3365A6]/10 w-full transition-all shadow-xs"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 bg-[#3365A6] hover:bg-[#254d80] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Cari
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-[#3365A6] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#3365A6]/10 w-full lg:w-48 transition-all shadow-xs"
            >
              <option value="all">Semua Tipe</option>
              <option value="ulok">Usulan Lokasi (ULOK)</option>
              <option value="document">Dokumen / File</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
            <Building className="w-4 h-4 text-gray-400" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-[#3365A6] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#3365A6]/10 w-full lg:w-56 transition-all shadow-xs"
            >
              <option value="all">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id.toString()}>
                  {b.nama_cabang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">

          {loading ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 text-[#3365A6] dark:text-blue-500 animate-spin" />
              <span className="text-sm font-bold">Membuat sambungan & menyelaraskan data backup...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-20 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-850">
                <Database className="w-12 h-12 text-gray-300 dark:text-gray-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">Level 2 Backup Kosong</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Tidak ada data yang didelete oleh cabang saat ini atau semua item cadangan yang cocok dengan kriteria filter Anda telah dibersihkan.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F2F2F2] dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 font-extrabold text-xs border-b border-gray-150 dark:border-gray-800">
                    <th className="p-4 pl-6">Nama Item</th>
                    <th className="p-4">Tipe / Sumber</th>
                    <th className="p-4">Cabang Asal</th>
                    <th className="p-4">Dihapus Oleh</th>
                    <th className="p-4">Tanggal Masuk Backup</th>
                    <th className="p-4">Sisa Waktu Auto-Purge</th>
                    <th className="p-4 text-center pr-6 w-36">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {items.map((item) => (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all select-none"
                    >
                      {/* Name with icon */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          {item.type === 'ulok' ? (
                            <div className="p-2 bg-amber-50 dark:bg-amber-950/25 border border-amber-100 dark:border-amber-900/40 rounded-xl text-amber-500 flex-shrink-0">
                              <Folder className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[#3365A6] flex-shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-sm md:max-w-md lg:max-w-lg">
                            <span className="font-bold text-gray-700 dark:text-gray-200 text-sm truncate block" title={item.name}>
                              {item.name}
                            </span>
                            {item.type === 'document' && (
                              <span className="text-[10px] text-gray-400 block mt-0.5 truncate">
                                Induk: {item.parentName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {item.type === 'ulok' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40">
                            Usulan Lokasi
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40">
                            Dokumen / File
                          </span>
                        )}
                      </td>

                      {/* Origin branch */}
                      <td className="p-4">
                        <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                          {item.branchName}
                        </span>
                      </td>

                      {/* Deleted by */}
                      <td className="p-4 text-gray-600 dark:text-gray-300 text-sm font-medium">
                        {item.deletedBy}
                      </td>

                      {/* Date deleted */}
                      <td className="p-4 text-gray-500 dark:text-gray-400 text-xs font-medium">
                        {formatPurgedAt(item.purgedByCabangAt)}
                      </td>

                      {/* Countdown */}
                      <td className="p-4">
                        {getCountdownBadge(item.remainingDays)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center pr-6">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => triggerRestore(item)}
                            disabled={isPending}
                            className="p-2 text-[#3365A6] hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg active:scale-95 transition shrink-0 border border-gray-150 dark:border-gray-800"
                            title="Pulihkan ke Recycle Bin Cabang"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerDelete(item)}
                            disabled={isPending}
                            className="p-2 text-[#D91E2E] hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg active:scale-95 transition shrink-0 border border-gray-150 dark:border-gray-800"
                            title="Hapus Permanen dari Sistem"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && confirmModal.targetItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-850 w-full max-w-md text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${confirmModal.actionType === 'restore'
              ? 'bg-blue-50 dark:bg-blue-950/20 text-[#3365A6] dark:text-blue-500'
              : 'bg-red-50 dark:bg-red-950/20 text-[#D91E2E] dark:text-red-500'
              }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-850 dark:text-gray-100 font-extrabold text-lg">{confirmModal.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed font-semibold">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-bold transition active:scale-95 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={executeConfirmAction}
                disabled={isPending}
                className={`flex-1 text-white py-2.5 rounded-xl text-sm font-bold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer ${confirmModal.actionType === 'restore'
                  ? 'bg-[#3365A6] hover:bg-blue-700'
                  : 'bg-[#D91E2E] hover:bg-red-750'
                  }`}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL / NOTIFICATION */}
      {successModal.isOpen && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-800 z-50 animate-[fadeIn_0.2s_ease-out] max-w-md">
          <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full">
            <span className="text-sm font-bold flex items-center justify-center w-4 h-4">✓</span>
          </div>
          <span className="text-sm font-semibold">{successModal.message}</span>
        </div>
      )}
    </div>
  )
}
