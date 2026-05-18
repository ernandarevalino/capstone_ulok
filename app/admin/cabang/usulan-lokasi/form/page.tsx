'use client'

import React, { useState, useEffect, useTransition, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getUlokDetail, getChecklistMaster, getUploadedDocuments, updateUlokSubmission } from '@/actions/ulok'

function FormInputContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id') // Menarik ID lokasi dari URL ?id=...

  const [isPending, startTransition] = useTransition()

  // State Penyimpanan Data dari Supabase
  const [ulok, setUlok] = useState<any>(null)
  const [checklist, setChecklist] = useState<any[]>([])
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([])

  // Toggle View State (Gambar 1 vs Gambar 3)
  const [isEditProfile, setIsEditProfile] = useState(false)

  // Form State Section 1
  const [namaLokasi, setNamaLokasi] = useState('')
  const [namaPemegang, setNamaPemegang] = useState('')

  // Form State Section 2
  const [jenisAlasHak, setJenisAlasHak] = useState('')
  const [noSertifikat, setNoSertifikat] = useState('')
  const [namaSertifikat, setNamaSertifikat] = useState('')
  const [bentukObjek, setBentukObjek] = useState('')

  const loadDataDetail = async () => {
    if (!id) return
    
    const resDetail = await getUlokDetail(id)
    if (resDetail.success && resDetail.data) {
      const data = resDetail.data
      setUlok(data)
      setNamaLokasi(data.nama_lokasi)
      setNamaPemegang(data.nama_pemegang_hak)
      setJenisAlasHak(data.jenis_alas_hak || '')
      setNoSertifikat(data.no_sertifikat_alas_hak || '')
      setNamaSertifikat(data.nama_sertifikat_alas_hak || '')
      setBentukObjek(data.bentuk_objek || '')

      // Ambil template checklist sesuai tipe badan hukum yang di-setting pas pop-up
      const resChecklist = await getChecklistMaster(data.jenis_badan_hukum)
      if (resChecklist.success && resChecklist.data) {
        setChecklist(resChecklist.data)
      }
    }

    const resDocs = await getUploadedDocuments(id)
    if (resDocs.success && resDocs.data) {
      setUploadedDocs(resDocs.data)
    }
  }

  useEffect(() => {
    loadDataDetail()
  }, [id])

  // Cek apakah master dokumen ini sudah diupload filenya atau belum
  const matchUploadedFile = (checklistId: number) => {
    return uploadedDocs.find(doc => doc.checklist_id === checklistId)
  }

  const handleUpdateSubmissionData = () => {
    startTransition(async () => {
      if (!id) return
      const res = await updateUlokSubmission(id, {
        nama_lokasi: namaLokasi,
        nama_pemegang_hak: namaPemegang,
        jenis_alas_hak: jenisAlasHak,
        no_sertifikat_alas_hak: noSertifikat,
        nama_sertifikat_alas_hak: namaSertifikat,
        bentuk_objek: bentukObjek
      })

      if (res.success) {
        alert("Semua data kelengkapan berhasil disimpan!")
        setIsEditProfile(false)
        loadDataDetail()
      } else {
        alert("Gagal memperbarui data")
      }
    })
  }

  if (!id) return <div className="p-8 text-center text-red-500">ID Usulan Lokasi Kosong.</div>
  if (!ulok) return <div className="p-8 text-center text-gray-500">Mengambil Formulir Kelengkapan...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-700">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
        
        {/* TOP NAVBAR TITLE */}
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <button 
            onClick={() => router.push('/admin/cabang/usulan-lokasi')}
            className="px-4 py-1.5 border rounded-lg text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 transition"
          >
            ← Kembali
          </button>
          <h2 className="font-bold text-sm text-blue-950 uppercase tracking-wide">Form Kelengkapan Sewa</h2>
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
            {ulok.status === 'Draft' ? 'Belum Direview' : ulok.status}
          </span>
        </div>

        <div className="p-6 space-y-8">
          
          {/* SECTION 1: PROFIL & CHECKLIST LEGALITAS UTAMA */}
          <div className="border rounded-xl p-5 bg-gray-50/50">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-sm text-gray-800">Section 1: Profil & Legalitas Pendirian</h3>
              <button 
                onClick={() => setIsEditProfile(!isEditProfile)}
                className="text-xs text-blue-900 font-bold hover:underline"
              >
                {isEditProfile ? 'Batal Edit' : '📝 Edit Profil'}
              </button>
            </div>

            {/* Input Data Profil */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-lg border shadow-xs">
              <div>
                <label className="text-xs font-semibold text-gray-400 block">Nama Lokasi</label>
                {isEditProfile ? (
                  <input type="text" value={namaLokasi} onChange={(e) => setNamaLokasi(e.target.value)} className="border p-1.5 text-sm w-full rounded mt-1 focus:outline-blue-950" />
                ) : (
                  <span className="font-bold text-sm text-gray-800">{ulok.nama_lokasi}</span>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 block">Tipe Kepemilikan</label>
                <span className="font-bold text-sm text-blue-950 block mt-1">{ulok.jenis_badan_hukum}</span>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-400 block">Nama Pemegang Hak</label>
                {isEditProfile ? (
                  <input type="text" value={namaPemegang} onChange={(e) => setNamaPemegang(e.target.value)} className="border p-1.5 text-sm w-full rounded mt-1 focus:outline-blue-950" />
                ) : (
                  <span className="font-bold text-sm text-gray-800">{ulok.nama_pemegang_hak}</span>
                )}
              </div>
            </div>

            {/* List Berkas Legalitas Dinamis */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Berkas Wajib ({ulok.jenis_badan_hukum})</h4>
              {checklist.map((item) => {
                const hasFile = matchUploadedFile(item.id)
                return (
                  <div key={item.id} className="bg-white p-3 rounded-lg border flex justify-between items-center shadow-xs">
                    <span className="text-xs font-semibold text-gray-700">{item.nama_dokumen}</span>
                    <div>
                      {hasFile ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-bold border border-green-200">✓ Terupload</span>
                          <button className="bg-blue-950 text-white text-xs px-3 py-1 rounded font-bold hover:bg-blue-950">Lihat</button>
                          <button className="text-xs text-red-600 border px-2 py-1 rounded hover:bg-red-50">🗑️</button>
                        </div>
                      ) : (
                        <button className="border border-dashed text-gray-500 text-xs px-3 py-1 rounded font-bold hover:bg-gray-50">
                          ↑ Upload File
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SECTION 2: ALAS HAK & PERIZINAN */}
          <div className="border rounded-xl p-5 bg-gray-50/50 space-y-4">
            <h3 className="font-bold text-sm text-gray-800 border-b pb-2">Section 2: Informasi Alas Hak & Bangunan</h3>
            
            <div className="bg-white p-4 rounded-lg border shadow-xs space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Jenis Alas Hak</label>
                <div className="flex gap-4 text-xs font-semibold">
                  {['SHM', 'Hak Guna Bangunan', 'Hak Pengelolaan', 'Hak Pakai'].map((type) => (
                    <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="alas_hak" 
                        value={type} 
                        checked={jenisAlasHak === type}
                        onChange={(e) => setJenisAlasHak(e.target.value)}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-bold text-gray-500 block">No. Sertifikat Alas Hak</label>
                  <input type="text" value={noSertifikat} onChange={(e)=>setNoSertifikat(e.target.value)} className="w-full border p-2 rounded text-xs mt-1 focus:outline-blue-950" placeholder="Ex: 02.01.10..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block">Nama Pada Sertifikat</label>
                  <input type="text" value={namaSertifikat} onChange={(e)=>setNamaSertifikat(e.target.value)} className="w-full border p-2 rounded text-xs mt-1 focus:outline-blue-950" placeholder="Nama Pemilik" />
                </div>
              </div>

              <div className="pt-1">
                <label className="text-xs font-bold text-gray-500 block">Bentuk Objek</label>
                <select value={bentukObjek} onChange={(e)=>setBentukObjek(e.target.value)} className="w-full border p-2 rounded text-xs mt-1 bg-white focus:outline-blue-950">
                  <option value="">Pilih Bentuk</option>
                  <option value="Tanah Kosong">Tanah Kosong</option>
                  <option value="Tanah dan Bangunan">Tanah dan Bangunan</option>
                </select>
              </div>
            </div>

            {/* Dokumen Pelengkap Tambahan */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Perizinan / Berkas Tambahan</h4>
              {['SPPT PBB', 'STTS PBB', 'IMB / PBG', 'SLF'].map((name) => (
                <div key={name} className="bg-white p-3 rounded-lg border flex justify-between items-center shadow-xs">
                  <span className="text-xs font-semibold text-gray-700">{name}</span>
                  <button className="border border-dashed text-gray-500 text-xs px-3 py-1 rounded font-bold hover:bg-gray-50">
                    ↑ Upload
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER ACTIONS BAR */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button 
              onClick={() => router.push('/admin/cabang/usulan-lokasi')}
              className="px-5 py-2 border rounded-lg text-xs font-bold text-gray-400 bg-white hover:bg-gray-50"
            >
              Batal
            </button>
            <button 
              onClick={handleUpdateSubmissionData}
              disabled={isPending}
              className="bg-blue-950 text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-blue-900 transition shadow-xs disabled:opacity-50"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Semua Data'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function DetailFormPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading Form Layout...</div>}>
      <FormInputContent />
    </Suspense>
  )
}