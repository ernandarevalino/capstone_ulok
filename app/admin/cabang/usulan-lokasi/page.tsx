'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getUlokSubmissions, createUlokSubmission } from '@/actions/cabang'

// 💡 HAPUS createClient Supabase manual dari client-side karena membuat session bentrok
// Dan biarkan Server Action di backend yang mengurusi autentikasinya

export default function UsulanLokasiPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [namaLokasi, setNamaLokasi] = useState('')
  const [statusBadan, setStatusBadan] = useState('')
  const [namaPemegang, setNamaPemegang] = useState('')

  // Fungsi fetch data dibersihkan agar bergantung langsung pada respon Server Action
  const fetchSubmissions = async () => {
    const res = await getUlokSubmissions()
    
    if (res.success && res.data) {
      setSubmissions(res.data)
    } else {
      // Jika server action mengirimkan pesan error 'Unauthorized' / gagal auth, 
      // arahkan ke halaman root '/' (halaman login kamu), bukan ke '/login'
      if (res.error && res.error.includes('Unauthorized')) {
        router.push('/') 
      }
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [router])

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
        setNamaLokasi('')
        setStatusBadan('')
        setNamaPemegang('')
        router.push(`/admin/cabang/usulan-lokasi/form?id=${res.data.id}`)
      } else {
        alert("Error: " + res.error)
      }
    })
  } 

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
                <th className="p-4 w-1/3">Nama ULOK</th>
                <th className="p-4">Tanggal Dibuat</th>
                <th className="p-4">Kepemilikan</th>
                <th className="p-4 text-right">Status Assessor</th>
              </tr>
            </thead>
            <tbody>
              {dataFiltered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400 text-sm">Tidak ada data usulan lokasi</td>
                </tr>
              ) : (
                dataFiltered.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => router.push(`/admin/cabang/usulan-lokasi/form?id=${item.id}`)}
                    className="border-b hover:bg-gray-50/80 cursor-pointer transition"
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
                    <td className="p-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorStyles}`}>
                        {item.status === 'Draft' ? 'Belum Direview' : item.status}
                      </span>
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-gray-900">Daftar Lokasi</h1>
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
        {renderTableGroup("Sedang Direview", ["In Review", "Submitted"], "bg-amber-50 text-amber-700 border border-amber-200")}
        {renderTableGroup("Perlu Revisi", ["Revisi"], "bg-red-50 text-red-700 border border-red-200")}
        {renderTableGroup("Disetujui", ["Approved"], "bg-green-50 text-green-700 border border-green-200")}
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
                <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
                <select 
                  value={statusBadan} 
                  onChange={(e) => setStatusBadan(e.target.value)}
                  className="w-full border p-2.5 rounded-lg text-sm bg-white focus:outline-blue-950"
                  required
                >
                  <option value="">Pilih Status Kepemilikan</option>
                  <option value="Badan Hukum">Badan Hukum</option>
                  <option value="Perorangan">Perorangan</option>
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