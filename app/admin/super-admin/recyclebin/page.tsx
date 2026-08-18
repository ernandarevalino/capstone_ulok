'use client'

import React, { useState, useEffect, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftCircle,
  Search,
  Filter,
  RotateCcw,
  Trash2,
  AlertTriangle,
  FileText,
  Folder,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  Clock,
  Database,
  Building,
  RefreshCw
} from 'lucide-react'

import {
  getSuperAdminBackupItems,
  restoreToCabangRecycleBin,
  hardDeleteSuperAdminItem,
  bulkRestoreToCabangRecycleBin,
  bulkHardDeleteSuperAdminItems,
  emptySuperAdminBackup,
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
  const [sourceFilter, setSourceFilter] = useState<'all' | 'ulok' | 'document'>('all')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<{ id: string; type: 'ulok' | 'document' }[]>([])

  // Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    actionType: 'empty' | 'delete_single' | 'delete_bulk' | 'restore_single' | 'restore_bulk'
    targetItem?: { id: string; type: 'ulok' | 'document'; name: string }
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'empty'
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
        type: sourceFilter
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
  }, [branchFilter, sourceFilter])

  // Filter items in memory
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.deletedBy.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSource =
        sourceFilter === 'all' ? true : item.type === sourceFilter

      const matchesBranch =
        branchFilter === 'all' ? true : item.branchId.toString() === branchFilter

      let matchesDate = true
      if (startDate || endDate) {
        const itemDate = new Date(item.purgedByCabangAt || item.deletedAt)
        if (startDate) {
          matchesDate = matchesDate && itemDate >= new Date(startDate)
        }
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          matchesDate = matchesDate && itemDate <= end
        }
      }

      return matchesSearch && matchesSource && matchesBranch && matchesDate
    })
  }, [items, searchQuery, sourceFilter, branchFilter, startDate, endDate])

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

  // Text truncator
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '-'
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
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

  // Select Handlers
  const handleSelectItem = (id: string, type: 'ulok' | 'document') => {
    setSelectedItems((prev) => {
      const exists = prev.some((x) => x.id === id && x.type === type)
      if (exists) {
        return prev.filter((x) => !(x.id === id && x.type === type))
      } else {
        return [...prev, { id, type }]
      }
    })
  }

  const handleSelectAll = () => {
    const allFilteredIds = filteredItems.map((x) => ({ id: x.id, type: x.type }))
    const areAllSelected = allFilteredIds.every((x) =>
      selectedItems.some((y) => y.id === x.id && y.type === x.type)
    )

    if (areAllSelected) {
      setSelectedItems((prev) =>
        prev.filter((x) => !allFilteredIds.some((y) => y.id === x.id && y.type === x.type))
      )
    } else {
      setSelectedItems((prev) => {
        const otherSelected = prev.filter(
          (x) => !allFilteredIds.some((y) => y.id === x.id && y.type === x.type)
        )
        return [...otherSelected, ...allFilteredIds]
      })
    }
  }

  // Action Triggers
  const triggerRestoreSingle = (id: string, type: 'ulok' | 'document', name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Pulihkan Item ke Cabang',
      message: `Apakah Anda yakin ingin memulihkan ${type === 'ulok' ? 'usulan' : 'dokumen'} "${name}" kembali ke Recycle Bin Cabang?`,
      actionType: 'restore_single',
      targetItem: { id, type, name }
    })
  }

  const triggerRestoreBulk = () => {
    if (selectedItems.length === 0) return
    setConfirmModal({
      isOpen: true,
      title: 'Pulihkan Item Terpilih',
      message: `Apakah Anda yakin ingin memulihkan ${selectedItems.length} item terpilih kembali ke Recycle Bin Cabang masing-masing?`,
      actionType: 'restore_bulk'
    })
  }

  const triggerDeleteSingle = (id: string, type: 'ulok' | 'document', name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Permanen dari Sistem',
      message: `Apakah Anda yakin ingin menghapus "${name}" secara permanen? Berkas fisik dan seluruh relasi data di basis data akan dibersihkan selamanya. Tindakan ini TIDAK dapat dibatalkan.`,
      actionType: 'delete_single',
      targetItem: { id, type, name }
    })
  }

  const triggerDeleteBulk = () => {
    if (selectedItems.length === 0) return
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Permanen Terpilih',
      message: `Apakah Anda yakin ingin menghapus ${selectedItems.length} item terpilih secara permanen dari sistem? Berkas fisik dan seluruh data terkait akan dihapus selamanya.`,
      actionType: 'delete_bulk'
    })
  }

  const triggerEmptyTrash = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kosongkan Level 2 Backup',
      message: 'Apakah Anda yakin ingin menghapus SELURUH item di Level 2 Backup Recycle Bin secara permanen dari sistem?',
      actionType: 'empty'
    })
  }

  // Confirm Action Execution
  const executeConfirmAction = () => {
    const { actionType, targetItem } = confirmModal
    setConfirmModal((prev) => ({ ...prev, isOpen: false }))

    startTransition(async () => {
      let res
      if (actionType === 'restore_single' && targetItem) {
        res = await restoreToCabangRecycleBin(targetItem.id, targetItem.type)
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: `Berhasil memulihkan "${targetItem.name}" ke Recycle Bin Cabang.`
          })
          setSelectedItems((prev) => prev.filter((x) => !(x.id === targetItem.id && x.type === targetItem.type)))
          loadInitialData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 2000)
        } else {
          alert('Gagal memulihkan item: ' + res.error)
        }
      } else if (actionType === 'restore_bulk') {
        res = await bulkRestoreToCabangRecycleBin(selectedItems)
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: `Berhasil memulihkan ${selectedItems.length} item ke Recycle Bin Cabang.`
          })
          setSelectedItems([])
          loadInitialData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 2000)
        } else {
          alert('Gagal memulihkan item terpilih: ' + res.error)
        }
      } else if (actionType === 'delete_single' && targetItem) {
        res = await hardDeleteSuperAdminItem(targetItem.id, targetItem.type)
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: `Berhasil menghapus permanen "${targetItem.name}" dari sistem.`
          })
          setSelectedItems((prev) => prev.filter((x) => !(x.id === targetItem.id && x.type === targetItem.type)))
          loadInitialData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 2000)
        } else {
          alert('Gagal menghapus item: ' + res.error)
        }
      } else if (actionType === 'delete_bulk') {
        res = await bulkHardDeleteSuperAdminItems(selectedItems)
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: `Berhasil menghapus ${selectedItems.length} item secara permanen dari sistem.`
          })
          setSelectedItems([])
          loadInitialData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 2000)
        } else {
          alert('Gagal menghapus item terpilih: ' + res.error)
        }
      } else if (actionType === 'empty') {
        res = await emptySuperAdminBackup()
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: 'Level 2 Backup Recycle Bin berhasil dikosongkan.'
          })
          setSelectedItems([])
          loadInitialData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 2000)
        } else {
          alert('Gagal mengosongkan tempat sampah: ' + res.error)
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* SKELETON HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="space-y-2">
              <div className="h-8 md:h-10 w-64 md:w-80 bg-slate-300 dark:bg-slate-700 rounded-xl animate-pulse"></div>
              <div className="h-4 w-3/4 md:w-[600px] bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* SKELETON ACTION BAR */}
          <div className="flex flex-row items-center gap-2 sm:gap-3">
            <div className="h-11 w-11 md:h-10 md:w-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse shrink-0"></div>
            <div className="h-11 md:h-10 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            <div className="h-11 md:h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse shrink-0"></div>
            <div className="h-11 md:h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse shrink-0"></div>
          </div>

          {/* SKELETON TABLE */}
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="h-14 w-full bg-[#142B4D] dark:bg-slate-900 animate-pulse"></div>
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER TOOLBAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight flex items-center gap-3">
              Level 2 Backup
            </h1>
            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-3xl leading-relaxed">
              Global Backup Recovery System. Halaman ini menyimpan seluruh berkas usulan lokasi dan dokumen yang telah dihapus permanen oleh Admin Cabang. Anda dapat memulihkannya kembali ke Cabang atau menghapusnya secara fisik selamanya.
            </p>
          </div>
        </div>

        {/* INFO BANNER */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-[#F28705] shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-amber-800 dark:text-amber-400 leading-relaxed font-semibold">
            Perhatian: Seluruh item di dalam Level 2 Backup Recycle Bin ini akan dibersihkan secara otomatis selamanya oleh sistem setelah sisa hari countdown habis (30 hari sejak dihapus oleh cabang).
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-row items-center gap-2 sm:gap-3">

          {/* Back Button */}
          <button
            onClick={() => router.push('/admin/super-admin')}
            className="flex items-center justify-center w-11 h-11 md:w-10 md:h-10 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-500 hover:text-[#142B4D] dark:hover:text-blue-400 transition-all hover:scale-105 shrink-0 shadow-sm cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeftCircle className="w-5 h-5" />
          </button>

          {/* Search Box */}
          <div className="relative flex-1 md:min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari item, cabang, induk ULOK, atau penghapus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4D] dark:focus:ring-blue-500 transition-all shadow-sm h-11 md:h-10"
            />
          </div>

          {/* Filter Button & Popover */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-3 md:px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-900 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm h-11 md:h-10 active:scale-95 cursor-pointer ${
                (sourceFilter !== 'all' || branchFilter !== 'all' || startDate || endDate)
                  ? 'border-[#142B4D] text-[#142B4D] dark:border-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden md:inline">Filter</span>
              {(sourceFilter !== 'all' || branchFilter !== 'all' || startDate || endDate) && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 md:relative md:top-0 md:right-0"></span>
              )}
            </button>

            {/* Filter Popover Dropdown */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-74 sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-5 z-40 space-y-4 animate-[fadeIn_0.15s_ease-out]">
                
                {/* Header & Reset */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#142B4D] dark:text-blue-400" /> Filter Level 2 Backup
                  </h4>
                  {(sourceFilter !== 'all' || branchFilter !== 'all' || startDate || endDate) && (
                    <button
                      onClick={() => { setSourceFilter('all'); setBranchFilter('all'); setStartDate(''); setEndDate(''); }}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>

                {/* Tipe Item Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                    Tipe Item
                  </label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value as any)}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                  >
                    <option value="all">Semua Tipe</option>
                    <option value="ulok">Usulan Lokasi (ULOK)</option>
                    <option value="document">Dokumen / File</option>
                  </select>
                </div>

                {/* Cabang Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                    Cabang Asal
                  </label>
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                  >
                    <option value="all">Semua Cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id.toString()}>
                        {b.nama_cabang}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                    Rentang Tanggal Masuk Backup
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

                {/* Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full py-2 bg-[#142B4D] hover:bg-[#1a3863] text-white font-bold text-xs rounded-xl shadow transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadInitialData()}
            disabled={loading || isPending}
            className="px-3 md:px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm h-11 md:h-10 active:scale-95 shrink-0 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>

        </div>

        {/* BULK ACTION TOOLBAR */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-3 sm:p-4 flex items-center justify-between animate-[fadeIn_0.2s_ease-out] border border-blue-100 dark:border-blue-900/30">
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-400">
              {selectedItems.length} Item Terpilih
            </span>

            <div className="flex gap-2">
              {/* Pulihkan */}
              <button
                onClick={triggerRestoreBulk}
                disabled={isPending}
                aria-label="Pulihkan Terpilih"
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white dark:bg-blue-600 dark:hover:bg-blue-500
                  px-3 py-2 sm:px-4 sm:py-2
                  rounded-xl text-xs font-bold transition active:scale-95
                  flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Pulihkan Terpilih</span>
              </button>

              {/* Hapus Permanen */}
              <button
                onClick={triggerDeleteBulk}
                disabled={isPending}
                aria-label="Hapus Permanen Terpilih"
                className="bg-[#D91E2E] hover:bg-red-750 text-white
                  px-3 py-2 sm:px-4 sm:py-2
                  rounded-xl text-xs font-bold transition active:scale-95
                  flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Hapus Permanen</span>
              </button>
            </div>
          </div>
        )}

        {/* DATA CONTAINER */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">
          
          {/* TABEL HEADER BAR */}
          <div className="bg-[#142B4D] dark:bg-slate-900 p-4 md:p-5 flex items-center justify-between gap-2 transition-colors">
            <h3 className="text-white font-bold text-sm md:text-base flex items-center gap-2">
              <Database className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              Recycle Bin - Level 2 Backup
            </h3>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] md:text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
                {filteredItems.length} <span className="hidden sm:inline">Items</span>
              </span>
              {items.length > 0 && (
                <button
                  onClick={triggerEmptyTrash}
                  disabled={isPending}
                  title="Kosongkan Tempat Sampah Backup"
                  className="bg-[#D91E2E] hover:bg-red-700 text-white text-[10px] md:text-xs px-2 sm:px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all h-6 md:h-7 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Kosongkan Backup</span>
                </button>
              )}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-20 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-850">
                <Database className="w-12 h-12 text-gray-300 dark:text-gray-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">Level 2 Backup Kosong</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
                  {searchQuery || sourceFilter !== 'all' || branchFilter !== 'all'
                    ? 'Tidak ada item backup yang cocok dengan filter pencarian Anda.'
                    : 'Tidak ada data yang dihapus oleh cabang saat ini atau seluruh item backup telah dibersihkan.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              
              {/* DESKTOP TABLE */}
              <table className="hidden md:table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F2F2F2] dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 font-extrabold text-xs border-b border-gray-150 dark:border-gray-800">
                    <th className="p-4 w-12 text-center pl-6">
                      <button
                        onClick={handleSelectAll}
                        className="text-gray-400 hover:text-[#142B4D] dark:hover:text-blue-400 transition cursor-pointer"
                      >
                        {filteredItems.every((x) => selectedItems.some((y) => y.id === x.id && y.type === x.type)) ? (
                          <CheckSquare className="w-4 h-4 text-[#142B4D] dark:text-blue-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-4">Nama Item</th>
                    <th className="p-4">Tipe / Sumber</th>
                    <th className="p-4">Cabang Asal</th>
                    <th className="p-4">Dihapus Oleh</th>
                    <th className="p-4">Tanggal Masuk Backup</th>
                    <th className="p-4">Sisa Waktu Auto-Purge</th>
                    <th className="p-4 text-center pr-6 w-36">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItems.some((x) => x.id === item.id && x.type === item.type)
                    return (
                      <tr
                        key={`${item.type}-${item.id}`}
                        className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all select-none ${
                          isSelected ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                        }`}
                      >
                        {/* Checkbox selector */}
                        <td className="p-4 text-center pl-6">
                          <button
                            onClick={() => handleSelectItem(item.id, item.type)}
                            className="text-gray-400 hover:text-[#142B4D] dark:hover:text-blue-400 transition cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#142B4D] dark:text-blue-500" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Name with icon */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {item.type === 'ulok' ? (
                              <div className="p-2 bg-amber-50 dark:bg-amber-950/25 border border-amber-100 dark:border-amber-900/40 rounded-xl text-[#F28705] shrink-0">
                                <Folder className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="p-2 bg-blue-50 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[#142B4D] dark:text-blue-400 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0 max-w-xs lg:max-w-md">
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
                        <td className="p-4 text-sm font-semibold">
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
                              onClick={() => triggerRestoreSingle(item.id, item.type, item.name)}
                              disabled={isPending}
                              className="p-2 text-[#142B4D] hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg active:scale-95 transition shrink-0 border border-gray-150 dark:border-gray-800 cursor-pointer"
                              title="Pulihkan ke Recycle Bin Cabang"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => triggerDeleteSingle(item.id, item.type, item.name)}
                              disabled={isPending}
                              className="p-2 text-[#D91E2E] hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg active:scale-95 transition shrink-0 border border-gray-150 dark:border-gray-800 cursor-pointer"
                              title="Hapus Permanen dari Sistem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* MOBILE CARD VIEW */}
              <div className="md:hidden flex flex-col gap-4 p-4 bg-gray-50/50 dark:bg-gray-950/30">

                {/* MOBILE SELECT ALL */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSelectAll}
                    disabled={filteredItems.length === 0}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#142B4D] dark:hover:text-blue-400 transition active:scale-95 cursor-pointer"
                  >
                    {filteredItems.length > 0 &&
                    filteredItems.every((x) =>
                      selectedItems.some((y) => y.id === x.id && y.type === x.type)
                    ) ? (
                      <CheckSquare className="w-5 h-5 text-[#142B4D] dark:text-blue-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}

                    <span>
                      {filteredItems.length > 0 &&
                      filteredItems.every((x) =>
                        selectedItems.some((y) => y.id === x.id && y.type === x.type)
                      )
                        ? 'Batal Pilih Semua'
                        : 'Pilih Semua'}
                    </span>
                  </button>

                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    {selectedItems.length > 0
                      ? `${selectedItems.length} dipilih`
                      : `${filteredItems.length} item`}
                  </span>
                </div>

                {filteredItems.map((item) => {
                  const isSelected = selectedItems.some((x) => x.id === item.id && x.type === item.type)

                  return (
                    <div
                      key={`mobile-${item.type}-${item.id}`}
                      className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 shadow-sm transition-all relative ${
                        isSelected
                          ? 'border-[#142B4D] dark:border-blue-500 bg-blue-50/10 dark:bg-blue-950/10'
                          : 'border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      {/* Top: Icon, Name, Branch & Checkbox */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {item.type === 'ulok' ? (
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl text-[#F28705] shrink-0">
                              <Folder className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[#142B4D] dark:text-blue-400 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}

                          <div className="flex flex-col min-w-0 pt-0.5">
                            <span
                              className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate w-full pr-2"
                              title={item.name}
                            >
                              {truncateText(item.name, 28)}
                            </span>

                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] font-bold text-[#142B4D] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/30">
                                {item.branchName}
                              </span>
                              {item.type === 'document' && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                  Induk: {item.parentName || '-'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectItem(item.id, item.type)}
                          className="shrink-0 p-1 mt-1 text-gray-400 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#142B4D] dark:text-blue-500" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Middle: Details & Countdown */}
                      <div className="flex flex-col gap-2 text-[11px] text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-4 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-gray-400 text-[9px] uppercase tracking-wider mb-0.5">
                              Masuk Backup
                            </span>
                            <span className="font-semibold text-gray-700 dark:text-gray-200">
                              {formatPurgedAt(item.purgedByCabangAt)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="block text-gray-400 text-[9px] uppercase tracking-wider mb-0.5">
                              Dihapus Oleh
                            </span>
                            <span className="font-semibold text-gray-700 dark:text-gray-200">
                              {item.deletedBy}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/50 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-gray-400">Sisa Auto-Purge:</span>
                          {getCountdownBadge(item.remainingDays)}
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => triggerRestoreSingle(item.id, item.type, item.name)}
                          disabled={isPending}
                          className="flex-1 py-2.5 bg-[#142B4D] hover:bg-[#1a3863] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Pulihkan ke Cabang
                        </button>

                        <button
                          onClick={() => triggerDeleteSingle(item.id, item.type, item.name)}
                          disabled={isPending}
                          className="flex-1 py-2.5 bg-[#D91E2E] hover:bg-red-750 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus Permanen
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-850 w-full max-w-md text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              confirmModal.actionType.startsWith('restore')
                ? 'bg-blue-50 dark:bg-blue-950/20 text-[#142B4D] dark:text-blue-500'
                : 'bg-red-50 dark:bg-red-950/20 text-[#D91E2E] dark:text-red-500'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-850 dark:text-gray-100 font-extrabold text-lg">{confirmModal.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed font-medium">
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
                className={`flex-1 text-white py-2.5 rounded-xl text-sm font-bold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer ${
                  confirmModal.actionType.startsWith('restore')
                    ? 'bg-[#142B4D] hover:bg-blue-900'
                    : 'bg-[#D91E2E] hover:bg-red-750'
                }`}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? 'Memproses...' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL / TOAST */}
      {successModal.isOpen && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-800 z-50 animate-[fadeIn_0.2s_ease-out] max-w-md">
          <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold">{successModal.message}</span>
        </div>
      )}

    </div>
  )
}
