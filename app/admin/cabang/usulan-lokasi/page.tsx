'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getUlokSubmissions, createUlokSubmission } from '@/actions/cabang'
import { softDeleteUlok } from '@/actions/recyclebin'
import { Download, Trash2 } from 'lucide-react'
import { exportUlokSubmissionsCSV } from '@/actions/export'
import { getCurrentUserBranchId } from '@/actions/saw'

export default function UsulanLokasiPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const formatLastReviewedShort = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Belum direview'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return 'Belum direview'
      const pad = (num: number) => String(num).padStart(2, '0')
      const day = pad(date.getDate())
      const month = pad(date.getMonth() + 1)
      const year = String(date.getFullYear()).slice(-2)
      const hours = pad(date.getHours())
      const minutes = pad(date.getMinutes())
      return `${day}-${month}-${year} ${hours}:${minutes}`
    } catch (e) {
      return 'Belum direview'
    }
  };

  const formatTimestamp = (dateStr: string | null | undefined) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ''
      const pad = (num: number) => String(num).padStart(2, '0')
      const day = pad(date.getDate())
      const month = pad(date.getMonth() + 1)
      const year = String(date.getFullYear()).slice(-2)
      const hours = pad(date.getHours())
      const minutes = pad(date.getMinutes())
      return `${day}-${month}-${year} ${hours}:${minutes}`
    } catch (e) {
      return ''
    }
  };
  
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [downloadingDocName, setDownloadingDocName] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [userBranchId, setUserBranchId] = useState<number | undefined>(undefined)

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

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const res = await exportUlokSubmissionsCSV('admin_cabang', userBranchId)
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

  const [deleteTarget, setDeleteTarget] = useState<{ id: string, namaLokasi: string } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')

  const [namaLokasi, setNamaLokasi] = useState('')
  const [statusBadan, setStatusBadan] = useState('')
  const [namaPemegang, setNamaPemegang] = useState('')

  const [searchQuery, setSearchQuery] = useState('')

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

  const toggleGroup = (groupTitle: string) => {
    if (expandedGroup === groupTitle) {
      setExpandedGroup(null)
    } else {
      setExpandedGroup(groupTitle)
    }
    setCurrentPage(1)
  }

  const handleSortCycle = (column: string) => {
    if (sortColumn !== column) {
      setSortColumn(column)
      setSortDirection('asc')
    } else {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    }
  }

  const renderSortButton = (column: string) => {
    const isActive = sortColumn === column
    const isAsc = isActive && sortDirection === 'asc'
    const isDesc = isActive && sortDirection === 'desc'

    return (
      <button
        onClick={() => handleSortCycle(column)}
        className={`ml-1.5 inline-flex items-center justify-center p-0.5 rounded hover:bg-gray-200/80 dark:hover:bg-gray-700/50 transition-all ${
          isActive ? 'opacity-100 bg-blue-100/50 dark:bg-blue-950/50' : 'opacity-40 hover:opacity-85'
        }`}
        title={`Sort by ${column} (${isActive ? (isAsc ? 'Ascending' : 'Descending') : 'None'})`}
      >
        <img
          src="/icons/icon-filter-2.svg"
          alt="Sort"
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isDesc ? 'rotate-180 text-blue-950 dark:text-blue-400' : 'text-gray-500'
          }`}
        />
      </button>
    )
  }

  const fetchSubmissions = async () => {
    const res = await getUlokSubmissions()
    if (res.success && res.data) {
      setSubmissions(res.data)
    } else {
      if (res.error && res.error.includes('Unauthorized')) {
        router.push('/') 
      } else {
        alert("Gagal memuat daftar usulan: " + res.error)
      }
    }
  }

  useEffect(() => {
    router.refresh()
    fetchSubmissions()

    async function loadBranchId() {
      const branchId = await getCurrentUserBranchId()
      if (branchId) {
        setUserBranchId(Number(branchId))
      }
    }
    loadBranchId()
  }, [router])

  const getFormRoute = (jenisBadanHukum: string) => {
    const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa']
    
    if (kelompokPerorangan.includes(jenisBadanHukum)) {
      return `/admin/cabang/usulan-lokasi/form/perorangan`
    }
    
    return `/admin/cabang/usulan-lokasi/form/badanhukum`
  }

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!namaLokasi || !statusBadan || !namaPemegang) return

    startTransition(async () => {
      const res = await createUlokSubmission({
        nama_lokasi: namaLokasi,
        jenis_badan_hukum: statusBadan, 
        nama_pemegang_hak: namaPemegang
      })

      if (res.success && res.data) {
        setIsModalOpen(false)
        setSuccessMessage(`ULOK '${res.data.nama_lokasi || namaLokasi}' berhasil dibuat!`)
        setShowSuccessModal(true)

        const targetRoute = getFormRoute(res.data.jenis_badan_hukum)
        const targetId = res.data.id
        
        setNamaLokasi('')
        setStatusBadan('')
        setNamaPemegang('')
        
        setTimeout(() => {
          setShowSuccessModal(false)
          router.push(`${targetRoute}?id=${targetId}`)
        }, 1500)
      } else {
        alert("Error: " + res.error)
      }
    })
  } 

  const handleDeleteLocation = async (id: string, namaLokasi: string) => {
    setDeleteTarget({ id, namaLokasi })
  }

  const executeDelete = async () => {
    if (!deleteTarget) return
    const idToDelete = deleteTarget.id
    const namaToDelete = deleteTarget.namaLokasi

    startTransition(async () => {
      const res = await softDeleteUlok(idToDelete)
      if (res.success) {
        setSuccessMessage(`ULOK '${namaToDelete}' berhasil dipindahkan ke tempat sampah`)
        setShowSuccessModal(true)
        fetchSubmissions()
        setDeleteTarget(null)
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 1500)
      } else {
        alert("Gagal memindahkan ke tempat sampah: " + res.error)
      }
    })
  }

  const filteredSubmissions = submissions.filter((item) => {
    const searchLower = searchQuery.toLowerCase()
    const dateStr = item.created_at
      ? new Date(item.created_at)
          .toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          .toLowerCase()
      : ''
    const kepemilikanStr = `${item.jenis_badan_hukum || ''} ${item.nama_pemegang_hak || ''}`.toLowerCase()
    const namaLokasiStr = (item.nama_lokasi || '').toLowerCase()

    const matchesSearch =
      !searchQuery ||
      namaLokasiStr.includes(searchLower) ||
      kepemilikanStr.includes(searchLower) ||
      dateStr.includes(searchLower)

    return matchesSearch
  })

  const renderTableGroup = (title: string, allowedStatuses: string[], colorStyles: string) => {
    const dataSorted = [...filteredSubmissions].filter((item) => allowedStatuses.includes(item.status))

    if (sortColumn && sortDirection) {
      dataSorted.sort((a, b) => {
        let valA = ''
        let valB = ''

        if (sortColumn === 'nama_lokasi') {
          valA = a.nama_lokasi || ''
          valB = b.nama_lokasi || ''
        } else if (sortColumn === 'tanggal') {
          const timeA = new Date(a.created_at).getTime()
          const timeB = new Date(b.created_at).getTime()
          return sortDirection === 'asc' ? timeA - timeB : timeB - timeA
        } else if (sortColumn === 'kepemilikan') {
          valA = a.nama_pemegang_hak || ''
          valB = b.nama_pemegang_hak || ''
        }

        if (sortDirection === 'asc') {
          return valA.localeCompare(valB, 'id', { sensitivity: 'base' })
        } else {
          return valB.localeCompare(valA, 'id', { sensitivity: 'base' })
        }
      })
    } else {
      dataSorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    const isExpanded = expandedGroup === title

    let displayedData = []
    const itemsPerPage = 12
    const totalItems = dataSorted.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const activePage = Math.min(currentPage, totalPages || 1)

    if (isExpanded) {
      displayedData = dataSorted.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)
    } else {
      displayedData = dataSorted.slice(0, 3)
    }

    return (
      <div className="mb-6">
        <div 
          onClick={() => toggleGroup(title)}
          className="flex items-center gap-2 mb-2 cursor-pointer select-none group transition-all duration-200"
        >
          <div
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-lg transition-all duration-200 flex items-center justify-center"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <img
              src="/icons/icon-expand.svg"
              alt="Expand/Collapse"
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base flex items-center group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors duration-200">
            {title}
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-bold ml-2">
              {dataSorted.length}
            </span>
          </h3>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">
          {/* === DESKTOP TABLE VIEW === */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold text-xs border-b border-gray-100 dark:border-gray-800">
                  <th className="p-4 w-1/4">
                    <div className="flex items-center">
                      Nama ULOK
                      {renderSortButton('nama_lokasi')}
                    </div>
                  </th>
                  <th className="p-4">
                    <div className="flex items-center">
                      Tanggal Dibuat
                      {renderSortButton('tanggal')}
                    </div>
                  </th>
                  <th className="p-4">
                    <div className="flex items-center">
                      Kepemilikan
                      {renderSortButton('kepemilikan')}
                    </div>
                  </th>
                  <th className="p-4 text-center">Status Assessor</th>
                  <th className="p-4 text-center">Progres</th>
                  <th className="p-4 text-center w-56">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">Tidak ada data usulan lokasi</td>
                  </tr>
                ) : (
                  displayedData.map((item) => {
                    const isExpanded = expandedRowId === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr 
                          onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                          className={`border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors cursor-pointer select-none ${isExpanded ? 'bg-gray-50/40 dark:bg-gray-900/10' : ''}`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Chevron Arrow Toggle */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedRowId(isExpanded ? null : item.id)
                                }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer"
                                title={isExpanded ? "Sembunyikan Checklist" : "Tampilkan Checklist"}
                              >
                                <img
                                  src="/icons/icon-expand.svg"
                                  alt="Expand/Collapse"
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                />
                              </div>
                              <span className="text-xl text-amber-500">📁</span>
                              <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{item.nama_lokasi}</span>
                                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                                  Review: {formatLastReviewedShort(item.last_reviewed_at)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                          <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                            <span className="font-medium text-gray-800 dark:text-gray-200">{item.jenis_badan_hukum}</span> ({item.nama_pemegang_hak})
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${colorStyles}`}>
                              {item.status === 'Draft' ? 'Belum Direview' : item.status}
                            </span>
                          </td>
                          <td className="p-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                            <div>
                              <span>
                                {item.numerator ?? 0}/{item.denominator ?? 0} ({Math.round(item.persentase ?? 0)}%)
                              </span>
                              {item.persentase === 100 && item.documents_completed_at && (
                                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-normal mt-0.5 whitespace-nowrap">
                                  Lengkap pada: {formatTimestamp(item.documents_completed_at)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() => router.push(`${getFormRoute(item.jenis_badan_hukum)}?id=${item.id}`)}
                                className="p-2 rounded-lg bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-950 dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
                                title="Lihat Detail"
                              >
                                <img src="/icons/icon-location-edit.svg" alt="Lihat" className="w-4 h-4 dark:brightness-0 dark:invert" />
                              </button>
                              <button
                                onClick={() => handleDeleteLocation(item.id, item.nama_lokasi)}
                                disabled={isPending}
                                className="p-2 rounded-lg bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:scale-100 flex items-center justify-center"
                                title="Hapus Usulan"
                              >
                                <img src="/icons/icon-remove.svg" alt="Delete" className="w-4 h-4" />
                              </button>
                            </div>
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
                                    item.checklistStatus.map((doc: any, idx: number) => {
                                      const isUploaded = doc.is_uploaded
                                      const isVerified = !!doc.is_verified

                                      let rowClass = ''
                                      let iconElement = null
                                      let textClass = ''
                                      let badgeText = ''
                                      let badgeClass = ''

                                      if (!isUploaded) {
                                        rowClass = 'bg-gray-50/40 dark:bg-gray-950/10 border-gray-150 dark:border-gray-900/40 hover:border-gray-250 dark:hover:border-gray-800'
                                        iconElement = (
                                          <span className="text-gray-400 dark:text-gray-605 flex-shrink-0 text-xs font-bold bg-gray-100 dark:bg-gray-900/60 w-5 h-5 rounded-full flex items-center justify-center">
                                            ✕
                                          </span>
                                        )
                                        textClass = 'text-gray-400 dark:text-gray-500'
                                        badgeText = 'BELUM TERUNGGAH'
                                        badgeClass = 'bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-450 border border-gray-200 dark:border-gray-800/80'
                                      } else if (!isVerified) {
                                        rowClass = 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-100/80 dark:border-amber-900/30 hover:border-amber-250 dark:hover:border-amber-800'
                                        iconElement = (
                                          <span className="text-amber-500 dark:text-amber-400 flex-shrink-0 text-xs font-bold bg-amber-100/60 dark:bg-amber-950/40 w-5 h-5 rounded-full flex items-center justify-center">
                                            !
                                          </span>
                                        )
                                        textClass = 'text-gray-800 dark:text-gray-205'
                                        badgeText = 'BELUM SESUAI'
                                        badgeClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                                      } else {
                                        rowClass = 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/80 dark:border-emerald-900/30 hover:border-emerald-250 dark:hover:border-emerald-800'
                                        iconElement = (
                                          <span className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 text-xs font-bold bg-emerald-100/60 dark:bg-emerald-950/40 w-5 h-5 rounded-full flex items-center justify-center">
                                            ✓
                                          </span>
                                        )
                                        textClass = 'text-gray-800 dark:text-gray-205'
                                        badgeText = 'SUDAH SESUAI'
                                        badgeClass = 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/50'
                                      }

                                      return (
                                        <div
                                          key={idx}
                                          className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${rowClass}`}
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            {iconElement}
                                            <span
                                              className={`text-xs font-semibold truncate ${textClass}`}
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

                                            <div className="flex items-center gap-1.5 ml-2">
                                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                                                {badgeText}
                                              </span>
                                              {isUploaded && doc.file_url && (
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
                                          </div>
                                        </div>
                                      )
                                    })
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* === MOBILE CARD VIEW === */}
          <div className="block md:hidden">
            {displayedData.length === 0 ? (
              <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                Tidak ada data usulan lokasi
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {displayedData.map((item) => (
                  <div key={item.id} className="p-4 space-y-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    {/* Nama ULOK & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-amber-500 select-none">📁</span>
                        <div>
                          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm break-all leading-snug">
                            {item.nama_lokasi}
                          </span>
                          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                            Review: {formatLastReviewedShort(item.last_reviewed_at)}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 shrink-0 rounded-full text-[10px] font-bold inline-block text-center ${colorStyles}`}>
                        {item.status === 'Draft' ? 'Belum Direview' : item.status}
                      </span>
                    </div>

                    {/* Detail Info Grid */}
                    <div className="grid grid-cols-3 gap-x-2 gap-y-3 text-xs text-gray-600 dark:text-gray-400 pt-1.5 border-t border-gray-50 dark:border-gray-800">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Tanggal Dibuat</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                          {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Kepemilikan</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{item.jenis_badan_hukum}</p>
                        <p className="text-[10px] text-gray-400 truncate">({item.nama_pemegang_hak})</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Progres</p>
                        <p className="font-bold text-blue-950 dark:text-blue-400 truncate">
                          {item.numerator ?? 0}/{item.denominator ?? 0} ({Math.round(item.persentase ?? 0)}%)
                        </p>
                        {item.persentase === 100 && item.documents_completed_at && (
                          <p className="text-[9px] text-gray-400 leading-tight">
                            Lengkap: {formatTimestamp(item.documents_completed_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800/60 pt-2.5">
                      <button
                        onClick={() => router.push(`${getFormRoute(item.jenis_badan_hukum)}?id=${item.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#142B4D] hover:bg-[#1a3863] text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-sm"
                        title="Lihat Detail"
                      >
                        <img src="/icons/icon-location-edit.svg" alt="Lihat" className="w-4 h-4 brightness-0 invert" />
                        <span>Lihat Detail</span>
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(item.id, item.nama_lokasi)}
                        disabled={isPending}
                        className="px-3 py-2 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                        title="Hapus Usulan"
                      >
                        <img src="/icons/icon-remove.svg" alt="Delete" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* === KONTROL PAGINASI === */}
          {isExpanded && totalItems > itemsPerPage && (
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
              <button
                disabled={activePage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
              >
                Prev
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Halaman {activePage} dari {totalPages}
              </span>
              <button
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-255 mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-12">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Daftar Usulan Lokasi (ULOK)</h1>
          <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pantau status usulan lokasi (ULOK) cabang Anda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:shrink-0">
          <div className="relative flex items-center w-full lg:w-auto">
            <img 
              src="/icons/icon_sharp-search.svg" 
              alt="Search" 
              className="absolute left-3 w-4 h-4 pointer-events-none dark:brightness-0 dark:invert" 
            />
            <input 
              type="text" 
              placeholder="Search Daftar Lokasi" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-950 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-950/10 w-full sm:w-60 sm:focus:w-72 transition-all duration-300 shadow-sm"
            />
          </div>

          <button 
            onClick={() => router.push('/admin/cabang/usulan-lokasi/recyclebin')}
            className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-red-650 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center w-10 h-10 shrink-0 shadow-sm"
            title="Tempat Sampah (Recycle Bin)"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button 
            onClick={handleExportCSV}
            disabled={isExporting}
            className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-blue-950 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 h-10 shrink-0 shadow-sm disabled:opacity-50 disabled:scale-100"
            title="Ekspor ke CSV"
          >
            {isExporting ? (
              <svg className="animate-spin h-4 w-4 text-blue-900 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="text-xs font-bold whitespace-nowrap">Export CSV</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-950 dark:bg-blue-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-900 dark:hover:bg-blue-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md flex items-center gap-2 w-full lg:w-auto justify-center"
          >
            <img src="/icons/icon-location-add.svg" alt="" className="w-4 h-4 brightness-0 invert" />
            Tambah Lokasi Baru
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {renderTableGroup("ULOK Baru", ["Draft"], "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60")}
        {renderTableGroup("Sedang Direview", ["In Review"], "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60")}
        {renderTableGroup("Perlu Revisi", ["Revisi"], "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60")}
        {renderTableGroup("Disetujui / Ditolak", ["Approved", "Rejected"], "bg-green-50 text-green-700 border border-green-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60")}
      </div>

      {/* === MODAL: KONFIRMASI HAPUS === */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <img src="/icons/icon-hand.svg" alt="Confirm" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              Apakah Anda yakin ingin menghapus usulan lokasi "{deleteTarget.namaLokasi}"?
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
              >
                No
              </button>
              <button
                onClick={executeDelete}
                disabled={isPending}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 font-bold px-4 py-2 text-sm transition-all flex items-center gap-1.5"
              >
                {isPending ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Yes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: SUKSES === */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <img src="/icons/icon-check.svg" alt="Success" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* === MODAL: FORM ULOK === */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-80 space-y-3 animate-[scaleUp_0.2s_ease-out]">
            
            {/* === HEADER MODAL === */}
            <div className="bg-linear-to-r from-blue-950 to-slate-900 text-white p-4 font-bold flex items-center justify-between rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <img src="/icons/icon-location.svg" alt="" className="w-5 h-4 brightness-0 invert" /> Tambah Lokasi Baru
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="hover:bg-white/15 p-1 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 flex items-center justify-center"
                  title="Batal"
                >
                  <img src="/icons/icon-close.svg" alt="Batal" className="w-4 h-4 brightness-0 invert" />
                </button>
              </div>
            </div>

            {/* === FORM INPUT === */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
              <form id="form-ulok" onSubmit={handleCreateLocation} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Nama Lokasi</label>
                  <input 
                    type="text" 
                    value={namaLokasi} 
                    onChange={(e) => setNamaLokasi(e.target.value)}
                    placeholder="Contoh: Alfamidi Jababeka 2" 
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-950 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-950/10 transition-all duration-200" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Status Kepemilikan</label>
                  <select 
                    value={statusBadan} 
                    onChange={(e) => setStatusBadan(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-950 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-950/10 transition-all duration-200"
                    required
                  >
                    <option value="" className="bg-white dark:bg-gray-900">Pilih Opsi Kepemilikan</option>
                    <optgroup label="Kelompok Perorangan" className="bg-white dark:bg-gray-900 font-semibold">
                      <option value="Perorangan">Perorangan</option>
                      <option value="Waris">Waris / Ahli Waris</option>
                      <option value="Hibah">Hibah</option>
                      <option value="Kuasa">Kuasa / Penerima Kuasa</option>
                    </optgroup>
                    <optgroup label="Kelompok Badan Hukum" className="bg-white dark:bg-gray-900 font-semibold">
                      <option value="PT">PT (Perseroan Terbatas)</option>
                      <option value="Yayasan">Yayasan</option>
                      <option value="Koperasi">Koperasi</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Nama Pemegang Hak</label>
                  <input 
                    type="text" 
                    value={namaPemegang} 
                    onChange={(e) => setNamaPemegang(e.target.value)}
                    placeholder="Nama pemilik asli sertifikat" 
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-950 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-950/10 transition-all duration-200" 
                    required
                  />
                </div>
              </form>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" 
                form="form-ulok"
                disabled={isPending}
                className="bg-linear-to-r from-blue-950 to-slate-900 text-white px-32 py-3 mt-1 rounded-lg font-bold text-sm hover:bg-blue-900 dark:hover:bg-blue-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 shadow-xs"
                title="Simpan Usulan"
              >
                <img src="/icons/icon-add.svg" alt="" className="w-4 h-4 brightness-0 invert" />
                Simpan
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}