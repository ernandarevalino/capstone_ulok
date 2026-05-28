'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
// Import fungsi deleteUlokSubmission yang baru dibuat
import { getUlokSubmissions, createUlokSubmission, deleteUlokSubmission } from '@/actions/cabang'

export default function UsulanLokasiPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // State untuk form modal
  const [namaLokasi, setNamaLokasi] = useState('')
  const [statusBadan, setStatusBadan] = useState('')
  const [namaPemegang, setNamaPemegang] = useState('')

  // Ambil data dari server/database
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
  }, [router])

  /**
   * HELPER ROUTING
   * Menentukan halaman form berdasarkan value jenis_badan_hukum dari database / select option
   */
  const getFormRoute = (jenisBadanHukum: string) => {
    const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa']
    
    if (kelompokPerorangan.includes(jenisBadanHukum)) {
      return `/admin/cabang/usulan-lokasi/form/perorangan`
    }
    
    return `/admin/cabang/usulan-lokasi/form/badanhukum`
  }

  // Handle submit pembuatan ULOK baru
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
        const targetRoute = getFormRoute(res.data.jenis_badan_hukum)
        
        setNamaLokasi('')
        setStatusBadan('')
        setNamaPemegang('')
        
        router.push(`${targetRoute}?id=${res.data.id}`)
      } else {
        alert("Error: " + res.error)
      }
    })
  } 

  // Handle aksi menghapus data usulan lokasi
  const handleDeleteLocation = async (id: string, namaLokasi: string) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus usulan lokasi "${namaLokasi}"?`)
    if (!confirmDelete) return

    startTransition(async () => {
      const res = await deleteUlokSubmission(id)
      if (res.success) {
        // Segarkan data tabel setelah berhasil dihapus
        fetchSubmissions()
      } else {
        alert("Gagal menghapus: " + res.error)
      }
    })
  }

  // Komponen pembantu untuk merender kelompok tabel berdasarkan status
  const renderTableGroup = (title: string, allowedStatuses: string[], colorStyles: string) => {
    const dataFiltered = submissions.filter(item => allowedStatuses.includes(item.status))

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-500 text-xs">▼</span>
          <h3 className="font-bold text-gray-800 text-base">{title}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 font-semibold text-xs border-b">
                <th className="p-4 w-1/4">Nama ULOK</th>
                <th className="p-4">Tanggal Dibuat</th>
                <th className="p-4">Kepemilikan</th>
                <th className="p-4 text-center">Status Assessor</th>
                <th className="p-4 text-center w-56">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataFiltered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400 text-sm">Tidak ada data usulan lokasi</td>
                </tr>
              ) : (
                dataFiltered.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b hover:bg-gray-50/80 transition"
                  >
                    <td className="p-4 flex items-center gap-3">
                      <span className="text-xl text-amber-500">📁</span>
                      <span className="font-semibold text-gray-700 text-sm">{item.nama_lokasi}</span>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      <span className="font-medium text-gray-800">{item.jenis_badan_hukum}</span> ({item.nama_pemegang_hak})
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${colorStyles}`}>
                        {item.status === 'Draft' ? 'Belum Direview' : item.status}
                      </span>
                    </td>
                    {/* KOLOM AKSI DENGAN DUA TOMBOL BARU */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => router.push(`${getFormRoute(item.jenis_badan_hukum)}?id=${item.id}`)}
                          className="bg-blue-950 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-900 transition shadow-sm"
                        >
                          Lihat
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(item.id, item.nama_lokasi)}
                          disabled={isPending}
                          className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition shadow-sm disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-gray-900">Daftar Usulan Lokasi (ULOK)</h1>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="Search Daftar Lokasi" 
            className="px-4 py-2 border rounded-lg bg-white text-sm focus:outline-none w-60 shadow-sm"
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-950 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-900 transition shadow-sm"
          >
            + Tambah Lokasi Baru
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {renderTableGroup("ULOK Baru", ["Draft"], "bg-blue-50 text-blue-700 border border-blue-200")}
        {renderTableGroup("Sedang Direview", ["In Review"], "bg-amber-50 text-amber-700 border border-amber-200")}
        {renderTableGroup("Perlu Revisi", ["Revision"], "bg-red-50 text-red-700 border border-red-200")}
        {renderTableGroup("Disetujui / Ditolak", ["Approved", "Rejected"], "bg-green-50 text-green-700 border border-green-200")}
      </div>

      {/* POP UP FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-950 text-white p-4 font-bold flex items-center gap-2">
              <span>📍</span> Tambah Lokasi Baru
            </div>
            <form onSubmit={handleCreateLocation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nama Lokasi</label>
                <input 
                  type="text" 
                  value={namaLokasi} 
                  onChange={(e) => setNamaLokasi(e.target.value)}
                  placeholder="Contoh: Alfamidi Jababeka 2" 
                  className="w-full border p-2.5 rounded-lg text-sm focus:outline-blue-950" 
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Status Kepemilikan</label>
                <select 
                  value={statusBadan} 
                  onChange={(e) => setStatusBadan(e.target.value)}
                  className="w-full border p-2.5 rounded-lg text-sm bg-white focus:outline-blue-950"
                  required
                >
                  <option value="">Pilih Opsi Kepemilikan</option>
                  <optgroup label="Kelompok Perorangan">
                    <option value="Perorangan">Perorangan</option>
                    <option value="Waris">Waris / Ahli Waris</option>
                    <option value="Hibah">Hibah</option>
                    <option value="Kuasa">Kuasa / Penerima Kuasa</option>
                  </optgroup>
                  <optgroup label="Kelompok Badan Hukum">
                    <option value="PT">PT (Perseroan Terbatas)</option>
                    <option value="Yayasan">Yayasan</option>
                    <option value="Koperasi">Koperasi</option>
                    <option value="Badan Hukum">Badan Hukum</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nama Pemegang Hak</label>
                <input 
                  type="text" 
                  value={namaPemegang} 
                  onChange={(e) => setNamaPemegang(e.target.value)}
                  placeholder="Nama pemilik asli sertifikat" 
                  className="w-full border p-2.5 rounded-lg text-sm focus:outline-blue-950" 
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="bg-blue-950 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-blue-900 transition disabled:opacity-50"
                >
                  {isPending ? 'Membuat...' : 'Buat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}