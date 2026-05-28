'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getAssessorSubmissions } from '@/actions/assessor';

export default function PenilaianPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State Utama Data & Filter Pencarian
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State untuk melacak ID usulan yang sudah pernah diklik/view oleh Assessor
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  // Mengambil data usulan lokasi dari database & inisialisasi riwayat buka dokumen
  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('priolo_assessor_viewed_ulok');
      if (saved) {
        try {
          setViewedIds(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  async function fetchData() {
    setLoading(true);
    const res = await getAssessorSubmissions();
    
    // Log debugging untuk melihat struktur nested data profile & branch
    console.log("LOG ASSESSOR RES:", res);

    if (res.success && res.data) {
      setSubmissions(res.data);
    } else {
      console.error(res.error);
    }
    setLoading(false);
  }

  // Fungsi routing dinamis berdasarkan klasifikasi Kelompok Kepemilikan Karyawan/Mitra
  const getFormRoute = (jenisBadanHukum: string) => {
    const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa'];
    if (kelompokPerorangan.includes(jenisBadanHukum)) {
      return '/admin/assessor/penilaian/ulok-perorangan';
    }
    return '/admin/assessor/penilaian/ulok-badanhukum';
  };

  // Menangani aksi pembukaan berkas penilaian & mencatar riwayat baca data
  const handleViewPenilaian = (id: string, jenisBadanHukum: string) => {
    startTransition(() => {
      if (!viewedIds.includes(id)) {
        const updatedViewed = [...viewedIds, id];
        setViewedIds(updatedViewed);
        localStorage.setItem('priolo_assessor_viewed_ulok', JSON.stringify(updatedViewed));
      }
      router.push(`${getFormRoute(jenisBadanHukum)}?id=${id}`);
    });
  };

  // Filter global pencarian berdasarkan Nama Lokasi, Nama Pemegang Hak, atau Nama Cabang
  const filteredData = submissions.filter((item) => {
    // Ambil nama cabang dengan aman secara opsional chaining
    const namaCabang = item.profiles?.branches?.nama_cabang || '';

    const matchesSearch = 
      item.nama_lokasi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nama_pemegang_hak?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      namaCabang.toLowerCase().includes(searchQuery.toLowerCase()); // Tambahan filter cabang
    return matchesSearch;
  });

  // Render Sub-Komponen Tabel Grouping Dinamis
  const renderTableGroup = (
    groupTitle: string, 
    allowedStatuses: string[], 
    colorStyles: string,
    viewCheck: 'all' | 'new_only' | 'viewed_only' = 'all'
  ) => {
    const dataFiltered = filteredData.filter((item) => {
      const isStatusAllowed = allowedStatuses.includes(item.status);
      if (!isStatusAllowed) return false;

      if (viewCheck === 'new_only') {
        return !viewIdsContains(item.id);
      }
      if (viewCheck === 'viewed_only') {
        return viewIdsContains(item.id);
      }
      return true;
    });

    function viewIdsContains(id: string) {
      return viewedIds.includes(id);
    }

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-gray-400 text-xs">▼</span>
          <h3 className="font-bold text-gray-800 text-sm md:text-base flex items-center gap-2">
            {groupTitle}
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full font-semibold">
              {dataFiltered.length}
            </span>
          </h3>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b">
                  <th className="p-4 w-1/4">Nama ULOK</th>
                  <th className="p-4">Asal Cabang</th>
                  <th className="p-4">Tanggal Diajukan</th>
                  <th className="p-4">Kepemilikan</th>
                  <th className="p-4 text-center">Skor SAW</th>
                  <th className="p-4 text-center">Status Berkas</th>
                  <th className="p-4 text-center w-40">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-400 italic">Memuat berkas masuk...</td>
                  </tr>
                ) : dataFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-400">Tidak ada usulan lokasi pada kelompok ini.</td>
                  </tr>
                ) : (
                  dataFiltered.map((item) => {
                    const branchName = item.profiles?.branches?.nama_cabang || 'Cabang Pusat / Lainnya';

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">📁</span>
                            <span className="font-bold text-gray-800">{item.nama_lokasi}</span>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <span className="bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-md text-[11px] border">
                            {branchName}
                          </span>
                        </td>

                        <td className="p-4 text-gray-500 font-medium">
                          {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="p-4 text-gray-600">
                          <span className="font-semibold text-gray-900">{item.jenis_badan_hukum}</span>
                          <div className="text-[11px] text-gray-400 mt-0.5">a.n {item.nama_pemegang_hak}</div>
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-sm text-purple-700">
                          {item.final_score !== null && item.final_score !== undefined ? item.final_score.toFixed(2) : '0.00'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase inline-block ${colorStyles}`}>
                            {item.status === 'In Review' && !viewedIds.includes(item.id) ? 'BARU MASUK' : item.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleViewPenilaian(item.id, item.jenis_badan_hukum)}
                            disabled={isPending}
                            className="bg-blue-950 hover:bg-blue-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm w-full disabled:opacity-50"
                          >
                            {isPending ? 'Memproses...' : viewedIds.includes(item.id) ? 'Lanjut Review 📝' : 'Mulai Nilai 🔍'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* SEKTOR TOP DASHBOARD HEADER CONTROL */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Validasi & Penilaian Usulan Lokasi</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Pendukung Keputusan pemilihan lokasi ekspansi gerai baru PRIOLO.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto shrink-0">
          <input 
            type="text" 
            placeholder="🔍 Cari Usulan / Pemilik / Cabang..." 
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-xs md:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-950 w-full sm:w-64 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* STRUKTUR GRUP UTAMA BERDASARKAN ALUR WORKFLOW ASSESSOR */}
      <div className="space-y-2">
        {renderTableGroup("ULOK Baru (Belum Disentuh)", ["In Review"], "bg-blue-50 text-blue-700 border border-blue-200", "new_only")}
        {renderTableGroup("Sedang Direview (On Progress)", ["In Review"], "bg-amber-50 text-amber-700 border border-amber-200", "viewed_only")}
        {renderTableGroup("Perlu Revisi (Dikembalikan ke Cabang)", ["Revision"], "bg-red-50 text-red-700 border border-red-200", "all")}
        {renderTableGroup("Selesai Dinilai (Approved / Rejected)", ["Approved", "Rejected"], "bg-green-50 text-green-700 border border-green-200", "all")}
      </div>
    </div>
  );
}