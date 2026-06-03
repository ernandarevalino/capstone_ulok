'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { getSAWLeaderboard } from '@/actions/saw'
import { Trophy, Medal, AlertCircle, MapPin, ChevronDown, ChevronUp, Star, Award, Sparkles } from 'lucide-react'

export default function PeringkatAssessorPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const loadData = async () => {
    setIsLoading(true)
    const res = await getSAWLeaderboard()

    if (res.success && res.data) {
      setLeaderboard(res.data)
    } else {
      setError(res.error || 'Gagal memuat data peringkat nasional')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleCard = (id: string) => {
    setOpenCardId(prev => (prev === id ? null : id))
  }

  const top3Data = useMemo(() => leaderboard.slice(0, 3), [leaderboard])
  const remainingData = useMemo(() => leaderboard.slice(3), [leaderboard])

  const itemsPerPage = 10
  const totalPages = Math.ceil(remainingData.length / itemsPerPage) || 1
  const displayedRemainingData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return remainingData.slice(start, start + itemsPerPage)
  }, [remainingData, currentPage])

  const checkIncomplete = (item: any) => !item.harga_sewa || item.c1_score <= 1 || !item.first_in_review_at

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 animate-pulse">Menyusun matriks peringkat nasional SAW...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 flex items-center justify-center transition-colors">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-md text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Gagal Memuat Data</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{error}</p>
          <button onClick={loadData} className="w-full bg-blue-950 dark:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition active:scale-95">
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* === HEADER HERO BANNER PRESTASI === */}
        <div className="bg-linear-to-r from-blue-950 via-slate-950 to-blue-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border border-blue-900/40">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Award className="w-48 h-48" />
          </div>
          <div className="space-y-2.5 z-10">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 dark:bg-amber-500 text-blue-950 font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3 fill-current" /> SPK SAW Nasional
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Leaderboard Nasional Kelayakan Usulan Lokasi</h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Hasil analisis komparatif seluruh cabang Usulan Lokasi di Indonesia berdasarkan pembobotan *Simple Additive Weighting*. Kriteria utama penilaian mencakup Persentase Kelengkapan Dokumen (45%), Durasi Review Legal (35%), dan Harga Sewa per 5 Tahun (20%).
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center z-10 w-full md:w-auto shrink-0">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Total Usulan Nasional</p>
            <p className="text-3xl font-black text-amber-400">{leaderboard.length}</p>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800/60 p-12 text-center shadow-sm text-gray-500">
            <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Belum ada usulan lokasi nasional yang terhitung.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Harap tunggu pengisian data atau sinkronisasi berkas ULOK dari sistem cabang.</p>
          </div>
        ) : (
          <>
            {/* === PODIUM: TOP 3 NASIONAL === */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4">
              
              {/* === PODIUM: JUARA 2 === */}
              {top3Data[1] && (
                <div 
                  onClick={() => toggleCard(top3Data[1].id)}
                  className={`order-2 md:order-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative flex flex-col justify-between group h-52.5 ${openCardId === top3Data[1].id ? 'ring-2 ring-blue-500/40' : ''}`}
                >
                  <div className="absolute top-4 right-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 p-2 rounded-xl">
                    <Medal className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="space-y-1.5 mt-2">
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nasional Peringkat 2</span>
                    <h3 className="font-black text-base text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {top3Data[1].nama_lokasi}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-900 dark:text-blue-500" /> {top3Data[1].profiles?.branches?.nama_cabang || 'Cabang'}
                    </p>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800/80 pt-3 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Skor SAW</p>
                      <p className="text-xl font-black text-slate-700 dark:text-slate-300">
                        {top3Data[1].final_score?.toFixed(4) || '0.0000'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                      Detail {openCardId === top3Data[1].id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                </div>
              )}

              {/* === PODIUM: JUARA 1 === */}
              {top3Data[0] && (
                <div 
                  onClick={() => toggleCard(top3Data[0].id)}
                  className={`order-1 md:order-2 bg-linear-to-b from-amber-50/40 to-white dark:from-amber-950/10 dark:to-gray-900 border-2 border-amber-400 dark:border-amber-500/60 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative flex flex-col justify-between group h-60 md:-translate-y-2 ${openCardId === top3Data[0].id ? 'ring-4 ring-amber-400/20' : ''}`}
                >
                  <div className="absolute top-5 right-5 bg-amber-400 dark:bg-amber-500 text-amber-950 p-2.5 rounded-xl shadow-sm animate-bounce">
                    <Trophy className="w-5 h-5 fill-current" />
                  </div>
                  <div className="space-y-1.5 mt-1">
                    <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider inline-block">
                      Rekomendasi Utama Nasional
                    </span>
                    <h3 className="font-black text-lg text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors pt-1">
                      {top3Data[0].nama_lokasi}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" /> {top3Data[0].profiles?.branches?.nama_cabang || 'Cabang'}
                    </p>
                  </div>
                  <div className="border-t border-amber-100 dark:border-gray-800 pt-3 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-wider">Skor Tertinggi</p>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                        {top3Data[0].final_score?.toFixed(4) || '0.0000'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                      Detail {openCardId === top3Data[0].id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                </div>
              )}

              {/* === PODIUM: JUARA 3 === */}
              {top3Data[2] && (
                <div 
                  onClick={() => toggleCard(top3Data[2].id)}
                  className={`order-3 md:order-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative flex flex-col justify-between group h-52.5 ${openCardId === top3Data[2].id ? 'ring-2 ring-blue-500/40' : ''}`}
                >
                  <div className="absolute top-4 right-4 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 p-2 rounded-xl">
                    <Medal className="w-5 h-5 text-amber-700 dark:text-amber-600" />
                  </div>
                  <div className="space-y-1.5 mt-2">
                    <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-600 uppercase tracking-wider">Nasional Peringkat 3</span>
                    <h3 className="font-black text-base text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {top3Data[2].nama_lokasi}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-900 dark:text-blue-500" /> {top3Data[2].profiles?.branches?.nama_cabang || 'Cabang'}
                    </p>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800/80 pt-3 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Skor SAW</p>
                      <p className="text-xl font-black text-slate-700 dark:text-slate-300">
                        {top3Data[2].final_score?.toFixed(4) || '0.0000'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                      Detail {openCardId === top3Data[2].id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* === DETAIL ACCORDION: TOP 3 === */}
            {top3Data.map((item) => {
              if (openCardId !== item.id) return null
              const isIncomplete = checkIncomplete(item)
              return (
                <div key={`podium-detail-${item.id}`} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-5 space-y-4 animate-fadeIn shadow-inner">
                  <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Detail Analisis Perhitungan: {item.nama_lokasi}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
                      <span className="text-[10px] text-gray-400 uppercase font-black block">C1 (Persentase Kelengkapan Dokumen)</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1 block">
                        Skor: <strong className="text-gray-900 dark:text-white text-sm font-black">{item.c1_score || 1}</strong> / 5
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
                      <span className="text-[10px] text-gray-400 uppercase font-black block">C2 (Durasi Review Legal)</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1 block">
                        Skor: <strong className="text-gray-900 dark:text-white text-sm font-black">{item.c2_score || 1}</strong> / 5
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
                      <span className="text-[10px] text-gray-400 uppercase font-black block">C3 (Harga Sewa per 5 Tahun)</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1 block">
                        Skor: <strong className="text-gray-900 dark:text-white text-sm font-black">{item.c3_score || 1}</strong> / 5
                      </span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${isIncomplete ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 text-amber-900 dark:text-amber-300' : 'bg-blue-50/30 border-blue-100 dark:bg-slate-950/40 dark:border-gray-800 text-gray-800 dark:text-gray-300'}`}>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> Hasil Analisis Keputusan SPK:
                      </h4>
                      <p className="text-xs font-medium leading-relaxed italic">
                        "{item.saw_analysis_notes || 'Belum ada catatan analisis tersemat untuk lokasi ini.'}"
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* === LIST: PERINGKAT LANJUTAN === */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pl-1 pt-4">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Daftar Peringkat Nasional Lainnya
                </h3>
                <span className="text-xs font-medium text-gray-400">
                  {remainingData.length} Lokasi Terdaftar
                </span>
              </div>

              {remainingData.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800/60 p-8 text-center text-gray-400 dark:text-gray-500 italic text-xs">
                  Tidak ada data peringkat lanjutan nasional saat ini.
                </div>
              ) : (
                displayedRemainingData.map((item, index) => {
                  const isOpen = openCardId === item.id
                  const actualRank = index + 4 + (currentPage - 1) * itemsPerPage
                  const isIncomplete = checkIncomplete(item)

                  return (
                    <div 
                      key={item.id}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800/80 shadow-xs overflow-hidden transition-all duration-200"
                    >
                      {/* === ITEM ROW === */}
                      <div 
                        onClick={() => toggleCard(item.id)}
                        className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-all"
                      >
                        <div className="flex items-center gap-3.5 w-full sm:w-auto">
                          {/* === RANK NUMBER === */}
                          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xs text-gray-500 dark:text-gray-400 shrink-0">
                            {actualRank}
                          </div>
                          
                          <div className="space-y-0.5 min-w-0">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate flex items-center gap-2">
                              {item.nama_lokasi}
                              {isIncomplete && (
                                <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                                  Skor Berjalan
                                </span>
                              )}
                            </h3>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                              <span className="flex items-center gap-1 font-bold text-blue-900 dark:text-blue-400">
                                <MapPin className="w-3 h-3" /> {item.profiles?.branches?.nama_cabang || 'Cabang'}
                              </span>
                              <span>•</span>
                              <span>Oleh: {item.profiles?.full_name || 'Admin'}</span>
                            </div>
                          </div>
                        </div>

                        {/* === RANK SCORE & ACTIONS === */}
                        <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-none pt-2.5 sm:pt-0 border-gray-100 dark:border-gray-800">
                          <div className="text-left sm:text-right">
                            <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Skor SAW</p>
                            <p className="text-sm font-black text-gray-800 dark:text-gray-200">
                              {item.final_score?.toFixed(4) || '0.0000'}
                            </p>
                          </div>
                          <div className="text-gray-400 dark:text-gray-500">
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* === ITEM COLLAPSIBLE DETAIL === */}
                      {isOpen && (
                        <div className="bg-gray-50/50 dark:bg-gray-950/30 border-t border-gray-100 dark:border-gray-800 p-4 space-y-4 animate-fadeIn">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-800/80">
                              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">C1 (Persentase Kelengkapan Dokumen)</span>
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5 block">
                                Skor: <strong className="text-gray-900 dark:text-white font-black">{item.c1_score || 1}</strong> / 5
                              </span>
                            </div>
                            <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-800/80">
                              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">C2 (Durasi Review Legal)</span>
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5 block">
                                Skor: <strong className="text-gray-900 dark:text-white font-black">{item.c2_score || 1}</strong> / 5
                              </span>
                            </div>
                            <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-800/80">
                              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">C3 (Harga Sewa per 5 Tahun)</span>
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5 block">
                                Skor: <strong className="text-gray-900 dark:text-white font-black">{item.c3_score || 1}</strong> / 5
                              </span>
                            </div>
                          </div>
                          
                          <div className={`p-3.5 rounded-xl border text-xs ${isIncomplete ? 'bg-amber-50/40 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/60 text-amber-900 dark:text-amber-400' : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'}`}>
                            <p className="font-bold uppercase text-[9px] tracking-wider text-gray-400 mb-0.5">Analisis Pengambilan Keputusan:</p>
                            <p className="font-medium italic leading-relaxed">"{item.saw_analysis_notes || 'Belum ada catatan khusus.'}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* === PAGINATION === */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-xl shadow-xs transition-colors">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Prev
                </button>
                
                {/* === PAGINATION: DESKTOP === */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, idx) => {
                    const pageNum = idx + 1
                    return (
                      <button
                        key={`page-btn-${pageNum}`}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7.5 h-7.5 text-xs font-bold rounded-lg transition-all ${
                          currentPage === pageNum
                            ? 'bg-blue-950 text-white dark:bg-slate-800 dark:text-blue-300 border border-blue-950 dark:border-slate-700 shadow-xs'
                            : 'border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                {/* === PAGINATION: MOBILE === */}
                <span className="sm:hidden text-xs font-semibold text-gray-500">
                  Halaman {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}