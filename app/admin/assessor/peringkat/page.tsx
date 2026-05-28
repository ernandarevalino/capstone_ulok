'use client'

import React, { useEffect, useState } from 'react'
import { getSAWLeaderboard } from '@/actions/saw'
import { Trophy, Medal, AlertCircle, Calendar, Sparkles, ChevronDown, ChevronUp, MapPin, Award } from 'lucide-react'

export default function PeringkatAssessorPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    const res = await getSAWLeaderboard()
    if (res.success && res.data) {
      setLeaderboard(res.data)
    } else {
      setError(res.error || 'Gagal memuat data peringkat')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleCard = (id: string) => {
    setOpenCardId(prev => (prev === id ? null : id))
  }

  const renderRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-bold px-3 py-1.5 rounded-full text-xs shadow-md animate-pulse">
          <Trophy className="w-4 h-4" /> Juara 1 (Emas)
        </span>
      )
    }
    if (index === 1) {
      return (
        <span className="flex items-center gap-1.5 bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-full text-xs shadow-md">
          <Medal className="w-4 h-4 text-slate-700" /> Juara 2 (Perak)
        </span>
      )
    }
    if (index === 2) {
      return (
        <span className="flex items-center gap-1.5 bg-gradient-to-r from-amber-700 to-amber-600 text-white font-bold px-3 py-1.5 rounded-full text-xs shadow-md">
          <Medal className="w-4 h-4 text-amber-200" /> Juara 3 (Perunggu)
        </span>
      )
    }
    return (
      <span className="bg-gray-100 text-gray-600 font-semibold px-2.5 py-1 rounded-md text-xs">
        Peringkat {index + 1}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-950 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-gray-500 animate-pulse">Menganalisis & Menyusun Peringkat Nasional SPK SAW...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl border shadow-lg max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900">Gagal Memuat Data</h3>
          <p className="text-xs text-gray-500">{error}</p>
          <button onClick={loadData} className="bg-blue-950 hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition">
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Award className="w-48 h-48" />
          </div>
          <div className="space-y-2 z-10">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-blue-950 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-current" /> SPK SAW Real-Time
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Leaderboard Nasional Kelayakan Usulan Lokasi</h1>
            <p className="text-xs text-blue-200/80 max-w-2xl leading-relaxed">
              Peringkat kelayakan usulan lokasi ruko berdasarkan pembobotan Simple Additive Weighting. Kriteria utama: C1 (Kelengkapan Legalitas - 40%), C2 (Durasi Mobilisasi Berkas Wajib - 25%), C3 (Harga Sewa Properti - 35%).
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center z-10 w-full md:w-auto">
            <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Total Usulan Ternilai</p>
            <p className="text-3xl font-black text-amber-400">{leaderboard.length}</p>
          </div>
        </div>

        {/* LIST LEADERBOARD */}
        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center shadow-sm text-gray-500">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-sm">Belum ada usulan lokasi yang di-input atau terhitung.</p>
              <p className="text-xs text-gray-400">Harap lakukan pengisian berkas ruko terlebih dahulu.</p>
            </div>
          ) : (
            leaderboard.map((item, index) => {
              const isOpen = openCardId === item.id
              const hasPenalties = item.saw_analysis_notes?.includes('⚠️ Data Belum Siap') || 
                                   item.c3_score === 1 && (item.harga_sewa === 0 || item.harga_sewa === null)
              const branchName = item.profiles?.branches?.nama_cabang || 'Tidak Diketahui'
              const creatorName = item.profiles?.full_name || 'Admin Cabang'

              return (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition duration-200 overflow-hidden ${
                    isOpen ? 'ring-2 ring-blue-950/20' : ''
                  }`}
                >
                  {/* MAIN CARD ROW */}
                  <div 
                    onClick={() => toggleCard(item.id)} 
                    className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none"
                  >
                    {/* LEFT SIDE: RANK & TITLE */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="flex-shrink-0">
                        {renderRankBadge(index)}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-black text-base text-gray-900 truncate flex items-center gap-2">
                          {item.nama_lokasi}
                          {hasPenalties && (
                            <span className="bg-red-50 text-red-600 border border-red-200 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                              Penalti Aktif
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1 text-blue-950 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-blue-950/70" /> Cabang {branchName}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Diajukan: {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span>Oleh: {creatorName}</span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE: SCORES & SELECTION TRIGGER */}
                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-none pt-3 md:pt-0">
                      {/* GRID MINI SCORES */}
                      <div className="hidden sm:grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="bg-slate-50 border px-2.5 py-1.5 rounded-lg">
                          <p className="text-gray-400 font-bold">C1 (Legalitas)</p>
                          <p className="font-black text-slate-700">{item.c1_score || 0}/5</p>
                        </div>
                        <div className="bg-slate-50 border px-2.5 py-1.5 rounded-lg">
                          <p className="text-gray-400 font-bold">C2 (Kecepatan)</p>
                          <p className="font-black text-slate-700">{item.c2_score || 0}/5</p>
                        </div>
                        <div className="bg-slate-50 border px-2.5 py-1.5 rounded-lg">
                          <p className="text-gray-400 font-bold">C3 (Harga)</p>
                          <p className="font-black text-slate-700">{item.c3_score || 0}/5</p>
                        </div>
                      </div>

                      {/* FINAL SCORE BIG BADGE */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Skor SAW</p>
                          <p className="text-2xl font-black text-blue-950 leading-tight">
                            {item.final_score !== null && item.final_score !== undefined ? item.final_score.toFixed(4) : '0.0000'}
                          </p>
                        </div>
                        <div className="text-gray-400">
                          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLLAPSIBLE DETAIL ACCORDION (saw_analysis_notes) */}
                  {isOpen && (
                    <div className="bg-slate-50 border-t p-5 space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3.5 rounded-xl border">
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Kriteria C1 (Legalitas)</span>
                          <span className="text-xs font-bold text-gray-700 mt-1 block">
                            Skor: <strong className="text-blue-950 text-sm font-black">{item.c1_score || 1}</strong> dari 5
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1">Dihitung otomatis berdasarkan jumlah kelengkapan berkas yang di-verify.</p>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border">
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Kriteria C2 (Kecepatan Mobilisasi)</span>
                          <span className="text-xs font-bold text-gray-700 mt-1 block">
                            Skor: <strong className="text-blue-950 text-sm font-black">{item.c2_score || 1}</strong> dari 5
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {item.c2_score === 1 && (item.saw_analysis_notes?.includes('dokumen wajib') || hasPenalties) 
                              ? 'Terkena Penalti! Berkas wajib Non-Negotiable belum lengkap seluruhnya.' 
                              : 'Semua berkas wajib lengkap terverifikasi.'}
                          </p>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border">
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Kriteria C3 (Harga Sewa)</span>
                          <span className="text-xs font-bold text-gray-700 mt-1 block">
                            Skor: <strong className="text-blue-950 text-sm font-black">{item.c3_score || 1}</strong> dari 5
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {item.harga_sewa === null || item.harga_sewa === 0 
                              ? 'Terkena Penalti! Nominal sewa belum di-input (bernilai 0).' 
                              : `Nominal Sewa: Rp ${(item.harga_sewa || 0).toLocaleString('id-ID')}`}
                          </p>
                        </div>
                      </div>

                      {/* Box Alert Indah saw_analysis_notes */}
                      <div className={`p-4 rounded-xl border flex gap-3 items-start ${
                        hasPenalties 
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
                          : 'bg-blue-50/50 border-blue-100 text-slate-800'
                      }`}>
                        <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${hasPenalties ? 'text-amber-600' : 'text-blue-950'}`} />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold uppercase tracking-wider">Hasil Analisis Keputusan SPK:</h4>
                          <p className="text-xs font-semibold leading-relaxed">
                            {item.saw_analysis_notes || 'Belum ada analisis untuk lokasi ini.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
