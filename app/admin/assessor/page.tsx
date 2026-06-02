'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentProfile } from '@/actions/auth';
import { getAssessorHistoriSubmissions } from '@/actions/assessor'; // Menggunakan action assessor untuk mengambil seluruh data usulan
import { 
  ClipboardCheck, 
  Building2, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  BarChart3, 
  Layers,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { useRouter } from 'next/navigation';

// Custom Tooltip Recharts untuk mendukung Dark Mode
const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-md">
        <p className="text-xs font-bold text-gray-800 dark:text-slate-100">{payload[0].name}</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 font-extrabold mt-0.5">
          {payload[0].value} Usulan
        </p>
      </div>
    );
  }
  return null;
};

export default function AssessorDashboardPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string>("Assessor");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAssessorDashboard() {
      setLoading(true);
      try {
        // 1. Fetch Profile
        const profileRes = await getCurrentProfile();
        if (profileRes && profileRes.success && profileRes.profile) {
          setFullName(profileRes.profile.full_name);
        }

        // 2. Fetch All Submissions across branches
        const res = await getAssessorHistoriSubmissions();
        if (res.success && res.data) {
          setSubmissions(res.data);
        }
      } catch (err) {
        console.error("Gagal menginisialisasi dashboard assessor:", err);
      } finally {
        setLoading(false);
      }
    }

    initAssessorDashboard();
  }, []);

  // --- KUMPULAN LOGIKA STATISTIK (DITUNJANG OLEH STRUKTUR DATABASE) ---
  
  // Filter out Drafts (Assessor hanya memproses data yang sudah disubmit oleh cabang)
  const incomingSubmissions = submissions.filter(s => s.status !== 'Draft');

  const totalIncoming = incomingSubmissions.length;
  const inReviewCount = incomingSubmissions.filter(s => s.status === 'In Review').length;
  const revisionCount = incomingSubmissions.filter(s => s.status === 'Revision').length;
  const completedCount = incomingSubmissions.filter(s => s.status === 'Approved' || s.status === 'Rejected').length;

  // Menghitung Jumlah Cabang yang Berpartisipasi (Berdasarkan relasi sub.profiles.branches)
  const uniqueBranches = new Set(
    submissions
      .map(s => s.profiles?.branches?.nama_cabang)
      .filter(Boolean)
  );
  const activeBranchesCount = uniqueBranches.size;

  // 1. Data Pie Chart: Distribusi Status Review Global
  const pieData = [
    { name: 'Belum Direview', value: inReviewCount, color: '#F59E0B' }, // Amber
    { name: 'Sedang Revisi', value: revisionCount, color: '#F43F5E' }, // Rose
    { name: 'Selesai (Approve/Reject)', value: completedCount, color: '#10B981' } // Emerald
  ].filter(item => item.value > 0);

  const displayPieData = pieData.length > 0 ? pieData : [
    { name: 'Belum Direview', value: 1, color: '#F59E0B' },
    { name: 'Sedang Revisi', value: 0, color: '#F43F5E' }
  ];

  // 2. Data Bar Chart: Top 5 Cabang dengan Pengajuan Terbanyak
  const branchDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    submissions.forEach(s => {
      const bName = s.profiles?.branches?.nama_cabang || 'Cabang Lainnya';
      if (s.status !== 'Draft') {
        counts[bName] = (counts[bName] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [submissions]);

  // Antrean Usulan yang perlu segera dinilai (In Review) - Maksimal 5 data terbaru
  const reviewQueue = [...submissions]
    .filter(s => s.status === 'In Review')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Top 5 Skor ULOK Tertinggi Nasional (Sistem SAW)
  const topNationalScores = [...submissions]
    .filter(s => s.final_score !== null && s.final_score !== undefined)
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 5);

  // Helper navigasi ke halaman penilaian
  const handleGoToReview = (id: string, jenisBadanHukum: string) => {
    const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa'];
    const path = kelompokPerorangan.includes(jenisBadanHukum) ? 'ulok-perorangan' : 'ulok-badanhukum';
    router.push(`/admin/assessor/penilaian/${path}?id=${id}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 md:p-4 text-gray-800 dark:text-slate-100">
      
      {/* WELCOME BANNER */}
      <div className="bg-[#142B4D] dark:bg-slate-950 text-white p-6 rounded-2xl shadow-md relative overflow-hidden border border-transparent dark:border-slate-800">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
          <ClipboardCheck className="w-64 h-64 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight relative z-10">
          Panel Assessor Nasional, {fullName}!
        </h1>
        <p className="text-blue-200 dark:text-slate-400 text-xs md:text-sm mt-1 max-w-xl relative z-10">
          Anda memegang kendali penilaian seluruh cabang. Periksa antrean review usulan lokasi (ULOK), berikan catatan revisi, dan pantau perangkingan nilai SAW terbaik secara terpusat.
        </p>
      </div>

      {/* 4 SUMMARY CARDS (FOKUS BEBAN KERJA ASSESSOR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Antrean Review (Mendesak) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-amber-500 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">Antrean Review</p>
            <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{loading ? '...' : inReviewCount}</h3>
            <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Menunggu penilaian Anda</span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        {/* Card 2: Sedang Direvisi Cabang */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-rose-500 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">Sedang Direvisi</p>
            <h3 className="text-3xl font-black text-rose-700 dark:text-rose-400 mt-1">{loading ? '...' : revisionCount}</h3>
            <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Berkas dikembalikan ke cabang</span>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
        </div>

        {/* Card 3: Usulan Selesai Dinilai */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-emerald-500 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">Selesai Dinilai</p>
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{loading ? '...' : completedCount}</h3>
            <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Approved & Rejected</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        {/* Card 4: Total Cabang Aktif */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-blue-900 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-blue-900 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">Cabang Berpartisipasi</p>
            <h3 className="text-3xl font-black text-blue-900 dark:text-blue-400 mt-1">{loading ? '...' : activeBranchesCount}</h3>
            <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Cabang yang mengirim data</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl">
            <Building2 className="w-6 h-6 text-blue-900 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* CHARTS ROW (DUAL GRAPH: STATUS VS CABANG) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kiri: Pie Chart Status Usulan */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-4 mb-4">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              Persentase Status Review Nasional
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Komposisi tumpukan pekerjaan review saat ini</p>
          </div>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-around gap-4">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {displayPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 flex flex-col gap-2">
              {displayPieData.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-semibold py-1.5 border-b border-gray-50 dark:border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-700 dark:text-slate-300">{entry.name}</span>
                  </div>
                  <span className="text-gray-900 dark:text-slate-100 font-bold">{entry.value} Data</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kanan: Bar Chart Distribusi Pengajuan Per Cabang */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-4 mb-4">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Top 5 Cabang Teraktif (Volume Usulan)
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Cabang penyuplai usulan lokasi terbanyak diluar Draft</p>
          </div>
          <div className="h-64 w-full">
            {branchDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">Tidak ada data distribusi cabang</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                  <Bar dataKey="value" fill="#142B4D" radius={[4, 4, 0, 0]}>
                    {branchDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} className="fill-[#142B4D] dark:fill-blue-500/80" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* TWO COLUMN BOTTOM LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kolom Kiri: Antrean Usulan Masuk (Perlu Tindakan Assessor Segera) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#142B4D] dark:bg-slate-950 p-4 text-white flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Antrean Berkas Masuk Terbaru
            </h3>
            <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">
              Butuh Nilai
            </span>
          </div>

          <div className="p-4 flex-1 divide-y divide-gray-100 dark:divide-slate-800 overflow-y-auto max-h-[350px]">
            {loading ? (
              <div className="text-center py-12 text-xs text-gray-400">Loading antrean berkas...</div>
            ) : reviewQueue.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 italic">Semua berkas masuk telah selesai dinilai atau kosong! ✨</div>
            ) : (
              reviewQueue.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/30 px-2 rounded-xl transition">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-gray-900 dark:text-slate-100">{item.nama_lokasi}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-slate-500">
                      <span className="bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {item.profiles?.branches?.nama_cabang || 'Cabang Lain'}
                      </span>
                      <span>{item.jenis_badan_hukum}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGoToReview(item.id, item.jenis_badan_hukum)}
                    className="p-2 text-xs font-bold text-blue-900 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-xl flex items-center gap-1 transition group active:scale-95"
                  >
                    Buka Formulir 
                    <ArrowRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: Top 5 Lokasi Skor Tertinggi (Leaderboard Nasional) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#142B4D] dark:bg-slate-950 p-4 text-white flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Peringkat Kebijakan ULOK Terbaik (Nasional)
            </h3>
            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
              Skor SAW
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800 text-gray-500 dark:text-slate-400 font-bold text-[11px]">
                  <th className="p-3 pl-5">Nama ULOK</th>
                  <th className="p-3">Asal Cabang</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Skor Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center p-12 text-xs text-gray-400">Loading data peringkat...</td>
                  </tr>
                ) : topNationalScores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-12 text-xs text-gray-400">Belum ada lokasi yang dinilai skala nasional.</td>
                  </tr>
                ) : (
                  topNationalScores.map((row, idx) => {
                    let statusColor = "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
                    if (row.status === 'Approved') statusColor = "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50";
                    else if (row.status === 'In Review') statusColor = "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50";
                    else if (row.status === 'Revision') statusColor = "bg-red-50 text-red-700 border border-red-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50";

                    return (
                      <tr key={row.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 pl-5 font-bold text-gray-900 dark:text-slate-100">{row.nama_lokasi}</td>
                        <td className="p-3 text-gray-500 dark:text-slate-400 font-medium">
                          {row.profiles?.branches?.nama_cabang || 'Cabang Pusat'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3 text-center font-black text-emerald-600 dark:text-emerald-400 text-xs">
                          {row.final_score ? row.final_score.toFixed(2) : '0.00'}
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
    </div>
  );
}