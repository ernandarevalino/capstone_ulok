'use client'

import React, { useState, useEffect, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Filter, RotateCcw, Trash, Trash2, AlertTriangle, FileText, Folder, CheckSquare, Square, Loader2 } from 'lucide-react'
import { getTrashItems, restoreUlok, restoreDocument, permanentDeleteUlok, permanentDeleteDocument, bulkRestoreItems, bulkPermanentDeleteItems, emptyTrash, TrashItem } from '@/actions/recyclebin'
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
        item.deletedBy.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSource = sourceFilter === 'all' ? true : item.type === sourceFilter
      return matchesSearch && matchesSource
    })
  }, [items, searchQuery, sourceFilter])

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

  const handleRestoreBulk = () => {
    if (selectedItems.length === 0) return
    startTransition(async () => {
      const res = await bulkRestoreItems(selectedItems)
      if (res.success) {
        setSuccessModal({
          isOpen: true,
          message: `Berhasil memulihkan ${selectedItems.length} item`
        })
        setSelectedItems([])
        loadTrashData()
        setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 1500)
      } else {
        alert('Gagal memulihkan item terpilih: ' + res.error)
      }
    })
  }

  // Delete handlers triggers
  const triggerDeleteSingle = (id: string, type: 'ulok' | 'document', name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Permanen Item',
      message: `Apakah Anda yakin ingin menghapus "${name}" secara permanen? Tindakan ini tidak dapat dibatalkan dan file fisik akan dihapus selamanya.`,
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
      message: 'Apakah Anda yakin ingin menghapus seluruh item di tempat sampah secara permanen? Semua usulan lokasi dan dokumen di dalam cabang ini akan dihapus selamanya.',
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
        res = type === 'ulok' ? await permanentDeleteUlok(id) : await permanentDeleteDocument(id)
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: `Berhasil menghapus secara permanen "${name}"`
          })
          setSelectedItems((prev) => prev.filter((x) => !(x.id === id && x.type === type)))
          loadTrashData()
          setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 1500)
        } else {
          alert('Gagal menghapus item: ' + res.error)
        }
      } else if (confirmModal.actionType === 'delete_bulk') {
        res = await bulkPermanentDeleteItems(selectedItems)
        if (res.success) {
          setSuccessModal({
            isOpen: true,
            message: `Berhasil menghapus secara permanen ${selectedItems.length} item`
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* BACK TO MAIN DASHBOARD LINK */}
        <button
          onClick={() => router.push('/admin/cabang/usulan-lokasi')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-900 dark:hover:text-blue-400 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Kembali ke Daftar Usulan
        </button>

        {/* HEADER TOOLBAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-3">
              <Trash2 className="w-8 h-8 text-red-500" />
              Tempat Sampah
            </h1>
            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Kelola usulan lokasi (ULOK) dan berkas dokumen yang telah dihapus sementara.
            </p>
          </div>
          
          {items.length > 0 && (
            <button
              onClick={triggerEmptyTrash}
              disabled={isPending}
              className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Trash className="w-4 h-4" />
              Kosongkan Trash
            </button>
          )}
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 p-4 flex flex-col md:flex-row items-center gap-4">
          
          {/* Search Box */}
          <div className="relative flex items-center w-full md:flex-1">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama item, induk ULOK, atau penghapus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-255 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-900 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-900/10 w-full transition-all duration-300 shadow-xs"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="px-3 py-2.5 border border-gray-255 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-900 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-900/10 w-full md:w-48 transition-all duration-300 shadow-xs"
            >
              <option value="all">Semua Tipe</option>
              <option value="ulok">Usulan Lokasi (ULOK)</option>
              <option value="document">Dokumen / File</option>
            </select>
          </div>
        </div>

        {/* BULK ACTION TOOLBAR */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900/30 rounded-2xl p-4 flex items-center justify-between animate-[fadeIn_0.2s_ease-out]">
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-400">
              {selectedItems.length} item dipilih
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleRestoreBulk}
                disabled={isPending}
                className="bg-blue-900 hover:bg-blue-950 text-white dark:bg-blue-600 dark:hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Pulihkan
              </button>
              <button
                onClick={triggerDeleteBulk}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-750 text-white px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1.5 shadow-sm"
              >
                <Trash className="w-3.5 h-3.5" />
                Hapus Permanen
              </button>
            </div>
          </div>
        )}

        {/* DATA CONTAINER */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">
          
          {loading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 text-blue-900 dark:text-blue-500 animate-spin" />
              <span className="text-sm font-medium">Memuat item tempat sampah...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-16 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-850">
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
              <table className="w-full text-left border-collapse">
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
                                {item.name}
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
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-850 w-full max-w-sm text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-850 dark:text-gray-100 font-bold text-lg">{confirmModal.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-bold transition active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={executeConfirmAction}
                disabled={isPending}
                className="flex-1 bg-red-600 hover:bg-red-750 text-white py-2.5 rounded-xl text-sm font-bold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Hapus
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
