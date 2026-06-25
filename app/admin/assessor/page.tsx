'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentProfile } from '@/actions/auth';
import { getAssessorSubmissions } from '@/actions/assessor';
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

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-bold text-gray-800 dark:text-slate-100">{payload[0].name}</p>
        <p className="text-xs text-[#142B4D] dark:text-blue-400 font-black mt-0.5">
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
        const profileRes = await getCurrentProfile();
        if (profileRes && profileRes.success && profileRes.profile) {
          setFullName(profileRes.profile.full_name);
        }

        const res = await getAssessorSubmissions();
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

  const inReviewCount = submissions.filter(s => s.status === 'In Review').length;
  const revisionCount = submissions.filter(s => s.status === 'Revisi').length;
  const completedCount = submissions.filter(s => s.status === 'Approved' || s.status === 'Rejected').length;

  const uniqueBranches = new Set(
    submissions
      .map(s => s.profiles?.branches?.nama_cabang)
      .filter(Boolean)
  );
  const activeBranchesCount = uniqueBranches.size;

  const pieData = [
    { name: 'Belum Direview', value: inReviewCount, color: '#FE9A00' },
    { name: 'Sedang Revisi', value: revisionCount, color: '#D11A22' },
    { name: 'Selesai (Approve/Reject)', value: completedCount, color: '#10B981' }
  ].filter(item => item.value > 0);

  const displayPieData = pieData.length > 0 ? pieData : [
    { name: 'Belum Direview', value: 1, color: '#FE9A00' },
    { name: 'Sedang Revisi', value: 0, color: '#D11A22' }
  ];

  const branchDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    submissions.forEach(s => {
      const bName = s.profiles?.branches?.nama_cabang || 'Cabang Lainnya';
      counts[bName] = (counts[bName] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [submissions]);

  const reviewQueue = [...submissions]
    .filter(s => s.status === 'In Review' && !(s.documents && s.documents.some((d: any) => d.is_verified === true)))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const topNationalScores = [...submissions]
    .filter(s => s.final_score !== null && s.final_score !== undefined)
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 7);

  const handleGoToReview = (id: string, jenisBadanHukum: string) => {
    const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa'];
    const path = kelompokPerorangan.includes(jenisBadanHukum) ? 'ulok-perorangan' : 'ulok-badanhukum';
    router.push(`/admin/assessor/penilaian/${path}?id=${id}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-3 md:p-6 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#142B4D] via-[#10223d] to-[#1d3c6a] p-6 text-white shadow-lg border border-[#142B4D] dark:border-slate-800 transition-all duration-300 hover:shadow-xl">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none transform rotate-12 transition-transform duration-500">
          <ClipboardCheck className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/10 backdrop-blur-md border border-white/20 text-[#FE9A00]">
            ⚡ Live Update Sistem
          </span>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            Panel Assessor Nasional, {fullName}!
          </h1>
          <p className="text-blue-100/80 dark:text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
            Anda memegang kendali penilaian seluruh cabang. Periksa antrean review usulan lokasi (ULOK), berikan catatan revisi, dan pantau perangkingan nilai SAW terbaik secara terpusat.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#FE9A00] shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-1">
            <p className="text-[#FE9A00] text-xs font-bold uppercase tracking-wider">Antrean Review</p>
            <h3 className="text-3xl font-black text-[#FE9A00] tracking-tight">{loading ? '...' : inReviewCount}</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Menunggu penilaian Anda</p>
          </div>
          <div className="bg-[#FE9A00]/10 dark:bg-[#FE9A00]/20 p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Clock className="w-6 h-6 text-[#FE9A00]" />
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#D11A22] shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-1">
            <p className="text-[#D11A22] text-xs font-bold uppercase tracking-wider">Sedang Direvisi</p>
            <h3 className="text-3xl font-black text-[#D11A22] tracking-tight">{loading ? '...' : revisionCount}</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Dikembalikan ke cabang</p>
          </div>
          <div className="bg-[#D11A22]/10 dark:bg-[#D11A22]/20 p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <AlertTriangle className="w-6 h-6 text-[#D11A22]" />
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-emerald-500 shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-1">
            <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">Selesai Dinilai</p>
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{loading ? '...' : completedCount}</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Approved & Rejected</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#142B4D] shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-1">
            <p className="text-[#142B4D] dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Cabang Berpartisipasi</p>
            <h3 className="text-3xl font-black text-[#142B4D] dark:text-white tracking-tight">{loading ? '...' : activeBranchesCount}</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Cabang mengirim data aktif</p>
          </div>
          <div className="bg-[#142B4D]/10 dark:bg-slate-800 p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Building2 className="w-6 h-6 text-[#142B4D] dark:text-blue-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-all duration-300 hover:shadow-md">
          <div className="border-b border-gray-100 dark:border-slate-800/80 pb-4 mb-4">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FE9A00]" />
              Persentase Status Review Nasional
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Komposisi tumpukan pekerjaan review saat ini</p>
          </div>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="w-full sm:w-1/2 h-full min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {displayPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="outline-none transition-all duration-300 hover:opacity-80" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 flex flex-col gap-2">
              {displayPieData.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-semibold py-2 border-b border-gray-50 dark:border-slate-800/50 px-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-600 dark:text-slate-300">{entry.name}</span>
                  </div>
                  <span className="text-gray-900 dark:text-slate-100 font-bold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{entry.value} Data</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-all duration-300 hover:shadow-md">
          <div className="border-b border-gray-100 dark:border-slate-800/80 pb-4 mb-4">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#142B4D] dark:text-blue-400" />
              Top 5 Cabang Teraktif (Volume Usulan)
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Cabang penyuplai usulan lokasi terbanyak di luar tipe draf</p>
          </div>
          <div className="h-64 w-full">
            {branchDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">Tidak ada data distribusi cabang</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 500 }} stroke="#94A3B8" tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 500 }} stroke="#94A3B8" allowDecimals={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(20, 43, 77, 0.04)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {branchDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#142B4D" className="fill-[#142B4D] dark:fill-blue-600 transition-all duration-300 hover:opacity-80" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
          <div className="bg-[#142B4D] dark:bg-slate-950 p-4 text-white flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FE9A00]" />
              Antrean Berkas Masuk Terbaru
            </h3>
            <span className="text-[10px] bg-[#FE9A00] text-slate-950 font-black px-2.5 py-0.5 rounded-full animate-pulse">
              Belum Di-checklist
            </span>
          </div>

          <div className="p-3 flex-1 divide-y divide-gray-100 dark:divide-slate-800 overflow-y-auto max-h-[350px] scrollbar-thin">
            {loading ? (
              <div className="text-center py-12 text-xs text-gray-400">Loading antrean berkas...</div>
            ) : reviewQueue.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 italic">Semua berkas masuk telah mulai dinilai atau dinilai penuh! ✨</div>
            ) : (
              reviewQueue.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition-all duration-200 group">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-gray-900 dark:text-slate-100 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors">{item.nama_lokasi}</h4>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-400 dark:text-slate-500">
                      <span className="bg-[#142B4D]/10 text-[#142B4D] dark:bg-slate-800 dark:text-slate-300 font-bold px-2 py-0.5 rounded text-[10px]">
                        {item.profiles?.branches?.nama_cabang || 'Cabang Pusat'}
                      </span>
                      <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-medium">{item.jenis_badan_hukum}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGoToReview(item.id, item.jenis_badan_hukum)}
                    className="w-full sm:w-auto px-3 py-2 text-xs font-bold text-white bg-[#142B4D] hover:bg-[#1d3c6a] dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl flex items-center justify-center gap-1 transition shadow-sm active:scale-95 group"
                  >
                    Buka Formulir 
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
          <div className="bg-[#142B4D] dark:bg-slate-950 p-4 text-white flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Peringkat Kebijakan ULOK Terbaik (Nasional)
            </h3>
            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full">
              Skor SAW
            </span>
          </div>

          <div className="overflow-x-auto flex-1 scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800 text-gray-400 dark:text-slate-400 font-bold text-[11px]">
                  <th className="p-3 pl-5">Nama ULOK</th>
                  <th className="p-3">Asal Cabang</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Skor Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-gray-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center p-12 text-xs text-gray-400">Loading data peringkat...</td>
                  </tr>
                ) : topNationalScores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-12 text-xs text-gray-400 italic">Belum ada lokasi yang dinilai skala nasional.</td>
                  </tr>
                ) : (
                  topNationalScores.map((row, idx) => {
                    let statusColor = "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
                    if (row.status === 'Approved') statusColor = "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40";
                    else if (row.status === 'In Review') statusColor = "bg-[#FE9A00]/10 text-[#FE9A00] border border-[#FE9A00]/20 dark:bg-[#FE9A00]/20";
                    else if (row.status === 'Revisi') statusColor = "bg-[#D11A22]/10 text-[#D11A22] border border-[#D11A22]/20 dark:bg-[#D11A22]/20";

                    return (
                      <tr key={row.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="p-3 pl-5 font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors">{row.nama_lokasi}</td>
                        <td className="p-3 text-gray-500 dark:text-slate-400 font-medium">
                          {row.profiles?.branches?.nama_cabang || 'Cabang Pusat'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3 text-center font-black text-emerald-600 dark:text-emerald-400 text-sm">
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