'use client'

import React, { useState, useEffect, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Filter, RotateCcw, Trash, Trash2, AlertTriangle, FileText, Folder, CheckSquare, Square, Loader2, ChevronDown, CheckCircle2, ArrowLeftCircle, Calendar } from 'lucide-react'
import { getTrashItems, restoreUlok, restoreDocument, purgeFromCabangRecycleBin, bulkRestoreItems, bulkPurgeFromCabangRecycleBin, emptyTrash, TrashItem } from '@/actions/recyclebin'
import { getCurrentUserBranchId } from '@/actions/saw'

export default function RecycleBinPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // States
  const [branchId, setBranchId] = useState<number | null>(null)
  const [items, setItems] = useState<TrashItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'ulok' | 'document'>('all')
  const [selectedItems, setSelectedItems] = useState<{ id: string; type: 'ulok' | 'document' }[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  // Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    actionType: 'empty' | 'delete_single' | 'delete_bulk'
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

  const [restoreConfirmModal, setRestoreConfirmModal] = useState<{
    isOpen: boolean
    documentId: string
    parentUlokId: string
    documentName: string
  }>({ isOpen: false, documentId: '', parentUlokId: '', documentName: '' })

  const [bulkRestoreConfirmModal, setBulkRestoreConfirmModal] = useState<{
    isOpen: boolean
    extraParentIds: string[]
    parentNames: string[]
  }>({ isOpen: false, extraParentIds: [], parentNames: [] })

  // Date formatter
  const formatDeletedAt = (dateStr: string) => {
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

  // Name truncator
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '-'
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
  }

  // Load user branch and trash items
  const loadTrashData = async (bId?: number) => {
    setLoading(true)
    try {
      let activeBranchId = bId ?? branchId
      if (activeBranchId === null) {
        const resBranch = await getCurrentUserBranchId()
        if (resBranch !== null) {
          activeBranchId = Number(resBranch)
          setBranchId(activeBranchId)
        }
      }

      if (activeBranchId !== null) {
        const resTrash = await getTrashItems(activeBranchId)
        if (resTrash.success && resTrash.data) {
          setItems(resTrash.data)
        } else {
          console.error('Gagal mengambil data trash:', resTrash.error)
        }
      }
    } catch (err) {
      console.error('Error memuat data recycle bin:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrashData()
  }, [])

  // Filter items in memory
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.deletedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource =
        sourceFilter === "all" ? true : item.type === sourceFilter;

      let matchesDate = true;
      if (startDate || endDate) {
        const itemDate = new Date(item.deletedAt);
        if (startDate)
          matchesDate = matchesDate && itemDate >= new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && itemDate <= end;
        }
      }
      return matchesSearch && matchesSource && matchesDate;
    });
  }, [items, searchQuery, sourceFilter, startDate, endDate]);

  // Select handlers
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
      // Unselect all filtered items
      setSelectedItems((prev) => 
        prev.filter((x) => !allFilteredIds.some((y) => y.id === x.id && y.type === x.type))
      )
    } else {
      // Select all filtered items, keeping already selected items from other scopes
      setSelectedItems((prev) => {
        const otherSelected = prev.filter((x) => !allFilteredIds.some((y) => y.id === x.id && y.type === x.type))
        return [...otherSelected, ...allFilteredIds]
      })
    }
  }

  // Restore handlers
  const handleRestoreSingle = (id: string, type: 'ulok' | 'document', name: string) => {
    if (type === 'document') {
      const currentItem = items.find((item) => item.id === id && item.type === 'document')
      const parentInTrash = items.some((item) => item.id === currentItem?.parentId && item.type === 'ulok')
      if (parentInTrash && currentItem?.parentId) {
        setRestoreConfirmModal({
          isOpen: true,
          documentId: id,
          parentUlokId: currentItem.parentId,
          documentName: name
        })
        return
      }
    }

    startTransition(async () => {
      const res = type === 'ulok' ? await restoreUlok(id) : await restoreDocument(id)
      if (res.success) {
        setSuccessModal({
          isOpen: true,
          message: `Berhasil memulihkan ${type === 'ulok' ? 'usulan' : 'dokumen'} "${name}"`
        })
        setSelectedItems((prev) => prev.filter((x) => !(x.id === id && x.type === type)))
        loadTrashData()
        setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 1500)
      } else {
        alert('Gagal memulihkan item: ' + res.error)
      }
    })
  }

  const executeRestoreWithParent = () => {
    const { documentId, parentUlokId, documentName } = restoreConfirmModal
    setRestoreConfirmModal({ isOpen: false, documentId: '', parentUlokId: '', documentName: '' })
    
    startTransition(async () => {
      const resParent = await restoreUlok(parentUlokId)
      if (resParent.success) {
        const resDoc = await restoreDocument(documentId)
        if (resDoc.success) {
          setSuccessModal({
            isOpen: true,
            message: `Berhasil memulihkan Induk ULOK dan dokumen "${documentName}"`
          })
          setSelectedItems((prev) => prev.filter((x) => !(x.id === documentId && x.type === 'document') && !(x.id === parentUlokId && x.type === 'ulok')))
          loadTrashData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 1500)
        } else {
          alert('Gagal memulihkan dokumen: ' + resDoc.error)
        }
      } else {
        alert('Gagal memulihkan induk ULOK: ' + resParent.error)
      }
    })
  }

  const executeRestoreBulk = (finalItems: { id: string; type: 'ulok' | 'document' }[]) => {
    startTransition(async () => {
      const res = await bulkRestoreItems(finalItems)
      if (res.success) {
        setSuccessModal({
          isOpen: true,
          message: `Berhasil memulihkan ${finalItems.length} item`
        })
        setSelectedItems([])
        loadTrashData()
        setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 1500)
      } else {
        alert('Gagal memulihkan item terpilih: ' + res.error)
      }
    })
  }

  const handleRestoreBulk = () => {
    if (selectedItems.length === 0) return

    // Cek: ada dokumen terpilih yang induk ULOK-nya masih di trash tapi belum ikut dicentang?
    const missingParents = new Map<string, string>()

    selectedItems.forEach((sel) => {
      if (sel.type !== 'document') return
      const currentItem = items.find((item) => item.id === sel.id && item.type === 'document')
      if (!currentItem?.parentId) return

      const parentStillInTrash = items.find((item) => item.id === currentItem.parentId && item.type === 'ulok')
      if (!parentStillInTrash) return

      const parentAlreadySelected = selectedItems.some((x) => x.id === currentItem.parentId && x.type === 'ulok')
      if (!parentAlreadySelected) {
        missingParents.set(currentItem.parentId, parentStillInTrash.name)
      }
    })

    if (missingParents.size > 0) {
      setBulkRestoreConfirmModal({
        isOpen: true,
        extraParentIds: Array.from(missingParents.keys()),
        parentNames: Array.from(missingParents.values())
      })
      return
    }

    executeRestoreBulk(selectedItems)
  }

  const executeBulkRestoreWithParents = () => {
    const { extraParentIds } = bulkRestoreConfirmModal
    setBulkRestoreConfirmModal({ isOpen: false, extraParentIds: [], parentNames: [] })
    const parentItems = extraParentIds.map((id) => ({ id, type: 'ulok' as const }))
    executeRestoreBulk([...selectedItems, ...parentItems])
  }

  // Delete handlers triggers
  const triggerDeleteSingle = (id: string, type: 'ulok' | 'document', name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Permanen Item',
      message: `Apakah Anda yakin ingin menghapus "${name}" secara permanen?`,
      actionType: 'delete_single',
      targetItem: { id, type, name }
    })
  }

  const triggerDeleteBulk = () => {
    if (selectedItems.length === 0) return
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Permanen Terpilih',
      message: `Apakah Anda yakin ingin menghapus ${selectedItems.length} item terpilih secara permanen? Semua berkas fisik dan data terkait akan dihapus selamanya.`,
      actionType: 'delete_bulk'
    })
  }

  const triggerEmptyTrash = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kosongkan Tempat Sampah',
      message: 'Apakah Anda yakin ingin menghapus seluruh item di tempat sampah secara permanen?',
      actionType: 'empty'
    })
  }

  // Confirm delete actions execution
  const executeConfirmAction = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }))
    
    startTransition(async () => {
      let res;
      if (confirmModal.actionType === 'delete_single' && confirmModal.targetItem) {
        const { id, type, name } = confirmModal.targetItem
        res = await purgeFromCabangRecycleBin(id, type)
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: `Berhasil menghapus "${name}" dari Cabang`
          })
          setSelectedItems((prev) => prev.filter((x) => !(x.id === id && x.type === type)))
          loadTrashData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 1500)
        } else {
          alert('Gagal menghapus item: ' + res.error)
        }
      } else if (confirmModal.actionType === 'delete_bulk') {
        res = await bulkPurgeFromCabangRecycleBin(selectedItems)
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: `Berhasil menghapus ${selectedItems.length} item dari Cabang`
          })
          setSelectedItems([])
          loadTrashData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 1500)
        } else {
          alert('Gagal menghapus item terpilih: ' + res.error)
        }
      } else if (confirmModal.actionType === 'empty') {
        if (branchId === null) return
        res = await emptyTrash(branchId)
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: 'Tempat sampah berhasil dikosongkan'
          })
          setSelectedItems([])
          loadTrashData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 1500)
        } else {
          alert('Gagal mengosongkan tempat sampah: ' + res.error)
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="w-full overflow-x-hidden space-y-4 md:space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {/* === SKELETON: HEADER TOOLBAR === */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="space-y-2">
              <div className="h-8 md:h-10 w-48 md:w-64 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 md:w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>

          {/* === SKELETON: ACTION BAR === */}
          <div className="flex flex-row flex-wrap items-stretch md:items-center gap-3 mb-6">
            {/* Back Button Skeleton */}
            <div className="order-1 md:order-none h-11 w-11 md:h-10 md:w-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse shrink-0"></div>
            {/* Search Box Skeleton */}
            <div className="order-3 md:order-none h-11 md:h-10 flex-1 w-full md:w-auto md:min-w-[240px] bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            {/* Filter Button Skeleton */}
            <div className="order-2 md:order-none h-11 md:h-10 flex-1 md:w-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          </div>

          {/* === SKELETON: TABLE WRAPPER === */}
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            {/* Retain the existing table/list skeleton logic here... */}
            <div className="h-[68px] w-full bg-slate-200 dark:bg-slate-800 animate-pulse border-b border-gray-100 dark:border-gray-800/60"></div>
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full overflow-x-hidden space-y-4 md:space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
        
        {/* HEADER TOOLBAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#142B4D] dark:text-gray-100 tracking-tight flex items-center gap-3">
              Tempat Sampah
            </h1>
            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Kelola usulan lokasi (ULOK) dan berkas dokumen yang telah dihapus sementara.
            </p>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-row items-center gap-2 sm:gap-3">

          {/* Back Button */}
          <button
            onClick={() => router.push("/admin/cabang/usulan-lokasi")}
            className="flex items-center justify-center w-11 h-11 md:w-10 md:h-10 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-500 hover:text-[#142B4D] dark:hover:text-blue-400 transition-all hover:scale-105 shrink-0 shadow-sm"
            title="Kembali ke Daftar Usulan"
          >
            <ArrowLeftCircle className="w-5 h-5"/>
          </button>

          {/* Search Box */}
          <div className="relative flex-1 md:min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"/>
            <input
              type="text"
              placeholder="Cari item, induk ULOK, atau penghapus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200 shadow-sm h-11 md:h-10"
            />
          </div>

          {/* Filter Button & Popover */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-3 md:px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-900 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm h-11 md:h-10 active:scale-95 ${
                (sourceFilter !== 'all' || startDate || endDate)
                  ? 'border-[#142B4D] text-[#142B4D] dark:border-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden md:inline">Filter</span>
              {(sourceFilter !== 'all' || startDate || endDate) && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 md:relative md:top-0 md:right-0"></span>
              )}
            </button>

            {/* Filter Popover Dropdown */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 md:mt-2 w-74 sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-5 z-40 space-y-4 animate-[fadeIn_0.15s_ease-out]">
                
                {/* Header & Reset */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#142B4D] dark:text-blue-400" /> Filter Tempat Sampah
                  </h4>
                  {(sourceFilter !== 'all' || startDate || endDate) && (
                    <button
                      onClick={() => { setSourceFilter('all'); setStartDate(''); setEndDate(''); }}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
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

                {/* Date Range Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                    Rentang Tanggal Dihapus
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
                    className="w-full py-2 bg-[#142B4D] hover:bg-[#1a3863] text-white font-bold text-xs rounded-xl shadow transition-all active:scale-[0.98]"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BULK ACTION TOOLBAR */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-3 sm:p-4 flex items-center justify-between animate-[fadeIn_0.2s_ease-out]">
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-400">
              {selectedItems.length} Item
            </span>

            <div className="flex gap-2">
              {/* Pulihkan */}
              <button
                onClick={handleRestoreBulk}
                disabled={isPending}
                aria-label="Pulihkan"
                className="bg-blue-900 hover:bg-blue-950 text-white dark:bg-blue-600 dark:hover:bg-blue-500
                  w-9 h-9 sm:w-auto sm:h-auto
                  sm:px-4 sm:py-2
                  rounded-xl text-xs font-bold transition active:scale-95
                  flex items-center justify-center sm:gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Pulihkan</span>
              </button>

              {/* Hapus Permanen */}
              <button
                onClick={triggerDeleteBulk}
                disabled={isPending}
                aria-label="Hapus Permanen"
                className="bg-red-600 hover:bg-red-750 text-white
                  w-9 h-9 sm:w-auto sm:h-auto
                  sm:px-4 sm:py-2
                  rounded-xl text-xs font-bold transition active:scale-95
                  flex items-center justify-center sm:gap-1.5 shadow-sm"
              >
                <Trash className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Hapus Permanen</span>
              </button>
            </div>
          </div>
        )}

        {/* DATA CONTAINER */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">
          
          {/* === TABEL: HEADER === */}
          <div className="bg-[#142B4D] dark:bg-slate-900 p-4 md:p-5 flex items-center justify-between gap-2 transition-colors">
            <h3 className="text-white font-bold text-sm md:text-base flex items-center gap-2">
              <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
              Recycle Bin (Trash)
            </h3>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] md:text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
                {filteredItems.length} <span className="hidden sm:inline">Items</span>
              </span>
              {items.length > 0 && (
                <button
                  onClick={triggerEmptyTrash}
                  disabled={isPending}
                  title="Empty Trash"
                  className="bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-xs px-2 sm:px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all h-6 md:h-7 shadow-sm disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              )}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-16 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center gap-4">
              <div className="p-4">
                <Trash2 className="w-12 h-12 text-gray-300 dark:text-gray-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">Tempat sampah kosong</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  {searchQuery || sourceFilter !== 'all' 
                    ? 'Tidak ada item sampah yang cocok dengan filter pencarian Anda.' 
                    : 'Usulan lokasi (ULOK) dan berkas dokumen yang Anda hapus sementara akan muncul di sini.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="hidden md:table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 font-semibold text-xs border-b border-gray-100 dark:border-gray-800">
                    <th className="p-4 w-12 text-center">
                      <button
                        onClick={handleSelectAll}
                        className="text-gray-400 hover:text-blue-900 dark:hover:text-blue-400 transition"
                      >
                        {filteredItems.every((x) => selectedItems.some((y) => y.id === x.id && y.type === x.type)) ? (
                          <CheckSquare className="w-4 h-4 text-blue-900 dark:text-blue-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-4">Nama Item</th>
                    <th className="p-4">Tipe / Sumber</th>
                    <th className="p-4">Induk ULOK</th>
                    <th className="p-4">Tanggal Dihapus</th>
                    <th className="p-4">Dihapus Oleh</th>
                    <th className="p-4 text-center w-36">Aksi</th>
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
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleSelectItem(item.id, item.type)}
                            className="text-gray-400 hover:text-blue-900 dark:hover:text-blue-400 transition"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-900 dark:text-blue-500" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Name with icon */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {item.type === 'ulok' ? (
                              <div className="p-2 bg-amber-50 dark:bg-amber-950/25 border border-amber-100 dark:border-amber-900/40 rounded-xl text-amber-500 flex-shrink-0">
                                <Folder className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="p-2 bg-blue-50 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/40 rounded-xl text-blue-500 flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0 max-w-md">
                              <span className="font-semibold text-gray-700 dark:text-gray-250 text-sm truncate block" title={item.name}>
                                {truncateText(item.name, 40)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Type badge */}
                        <td className="p-4">
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

                        {/* Parent ULOK */}
                        <td className="p-4 text-gray-500 dark:text-gray-400 text-sm truncate max-w-xs">
                          {item.parentName}
                        </td>

                        {/* Date deleted */}
                        <td className="p-4 text-gray-500 dark:text-gray-400 text-xs">
                          {formatDeletedAt(item.deletedAt)}
                        </td>

                        {/* Deleted by */}
                        <td className="p-4 text-gray-600 dark:text-gray-300 text-sm font-medium">
                          {item.deletedBy}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleRestoreSingle(item.id, item.type, item.name)}
                              disabled={isPending}
                              className="p-2 text-gray-500 hover:text-blue-950 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg active:scale-95 transition"
                              title="Pulihkan"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => triggerDeleteSingle(item.id, item.type, item.name)}
                              disabled={isPending}
                              className="p-2 text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg active:scale-95 transition"
                              title="Hapus Permanen"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* MOBILE CARD VIEW */}\
              <div className="md:hidden flex flex-col gap-4 p-4 bg-gray-50/50 dark:bg-gray-950/30">

                {/* MOBILE SELECT ALL */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSelectAll}
                    disabled={filteredItems.length === 0}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#142B4D] dark:hover:text-blue-400 transition active:scale-95"
                  >
                    {filteredItems.length > 0 &&
                    filteredItems.every((x) =>
                      selectedItems.some(
                        (y) => y.id === x.id && y.type === x.type
                      )
                    ) ? (
                      <CheckSquare className="w-5 h-5 text-[#142B4D] dark:text-blue-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}

                    <span>
                      {filteredItems.length > 0 &&
                      filteredItems.every((x) =>
                        selectedItems.some(
                          (y) => y.id === x.id && y.type === x.type
                        )
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
                  const isSelected = selectedItems.some(
                    (x) => x.id === item.id && x.type === item.type
                  )

                  return (
                    <div
                      key={`mobile-${item.type}-${item.id}`}
                      className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 shadow-sm transition-all relative ${
                        isSelected
                          ? 'border-[#142B4D] dark:border-blue-500 bg-blue-50/10 dark:bg-blue-950/10'
                          : 'border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      {/* Top: Icon, Name & Checkbox */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {item.type === 'ulok' ? (
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl text-amber-500 shrink-0">
                              <Folder className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-blue-500 shrink-0">
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

                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                              Induk: {item.parentName || '-'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectItem(item.id, item.type)}
                          className="shrink-0 p-1 mt-1 text-gray-400"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#142B4D] dark:text-blue-500" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex items-center justify-between text-[11px] text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 mb-4">
                        <div>
                          <span className="block text-gray-400 text-[9px] uppercase tracking-wider mb-0.5">
                            Dihapus Pada
                          </span>
                          <span className="font-semibold">
                            {formatDeletedAt(item.deletedAt)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="block text-gray-400 text-[9px] uppercase tracking-wider mb-0.5">
                            Oleh
                          </span>
                          <span className="font-semibold text-gray-600 dark:text-gray-300">
                            {item.deletedBy}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleRestoreSingle(item.id, item.type, item.name)
                          }
                          disabled={isPending}
                          className="flex-1 py-2.5 bg-[#142B4D] dark:bg-[#142B4D] hover:bg-[#1a3863] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Pulihkan
                        </button>

                        <button
                          onClick={() =>
                            triggerDeleteSingle(item.id, item.type, item.name)
                          }
                          disabled={isPending}
                          className="flex-1 py-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 border border-red-100 dark:border-red-900/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          Hapus
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={executeConfirmAction}
                disabled={isPending}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 font-bold px-4 py-2 text-sm transition-all flex items-center gap-1.5"
              >
                {isPending ? "Loading..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE PARENT CONFIRM MODAL */}
      {restoreConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-sm text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <Folder className="w-12 h-12 mx-auto text-blue-500 mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              Apakah Anda ingin memulihkan Induk ULOK beserta dokumen ini?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              (Jika Anda memilih 'Batal', pemulihan dokumen dibatalkan).
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() =>
                  setRestoreConfirmModal({
                    isOpen: false,
                    documentId: "",
                    parentUlokId: "",
                    documentName: "",
                  })
                }
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-bold px-4 py-2 text-sm transition-all"
              >
                Batal
              </button>
              <button
                onClick={executeRestoreWithParent}
                disabled={isPending}
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
              >
                {isPending ? "Memulihkan..." : "Ya, Keduanya"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK RESTORE PARENT CONFIRM MODAL */}
      {bulkRestoreConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-sm text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <Folder className="w-12 h-12 mx-auto text-blue-500 mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              {bulkRestoreConfirmModal.extraParentIds.length === 1
                ? "Apakah Anda ingin memulihkan Induk ULOK beserta dokumen ini?"
                : `Apakah Anda ingin memulihkan ${bulkRestoreConfirmModal.extraParentIds.length} Induk ULOK beserta dokumen ini?`}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              (Jika Anda memilih 'Batal', pemulihan dibatalkan).
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() =>
                  setBulkRestoreConfirmModal({
                    isOpen: false,
                    extraParentIds: [],
                    parentNames: [],
                  })
                }
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-bold px-4 py-2 text-sm transition-all"
              >
                Batal
              </button>
              <button
                onClick={executeBulkRestoreWithParents}
                disabled={isPending}
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
              >
                {isPending ? "Memulihkan..." : "Ya, Pulihkan Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-[#111C34] rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800/60 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 text-emerald-500" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm md:text-base leading-relaxed">
              {successModal.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
