'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAssessorProfile } from '@/context/AssessorProfileContext';
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
import { useRouter } from 'next/navigation';

const AssessorDashboardCharts = dynamic(
  () => import('./AssessorDashboardCharts'),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-pulse">
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 md:p-6 shadow-sm h-64 sm:h-80" />
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 md:p-6 shadow-sm h-64 sm:h-80" />
      </div>
    ),
  }
);

export default function AssessorDashboardPage() {
  const router = useRouter();
  const profile = useAssessorProfile();
  const fullName = profile?.full_name || 'Assessor';
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAssessorDashboard() {
      setLoading(true);
      try {
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
    router.push(`/admin/assessor/penilaian/${path}?id=${id}&from=dashboard`);
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">

        {/* Skeleton Welcome Banner */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-800 p-5 sm:p-6">
          <div className="h-5 sm:h-7 w-1/2 max-w-xs bg-slate-300 dark:bg-slate-700 rounded-md mb-2.5 animate-pulse" />
          <div className="h-3 w-full max-w-md bg-slate-300/70 dark:bg-slate-700/70 rounded-md animate-pulse" />
        </div>

        {/* Skeleton Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-between gap-2"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-6 sm:h-8 w-12 bg-slate-300 dark:bg-slate-700 rounded-md animate-pulse" />
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-slate-200 dark:bg-slate-800 rounded-lg sm:rounded-xl shrink-0 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Skeleton Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

          {/* Skeleton Pie Chart Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="pb-3 sm:pb-4 mb-3 sm:mb-4">
              <div className="h-3.5 w-48 bg-slate-300 dark:bg-slate-700 rounded-md mb-2 animate-pulse" />
              <div className="h-2.5 w-56 max-w-full bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 sm:gap-6">
              <div className="w-full sm:w-1/2 h-40 sm:h-52 flex items-center justify-center">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[10px] sm:border-[12px] border-slate-200 dark:border-slate-800 animate-pulse" />
              </div>
              <div className="w-full sm:w-1/2 flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-full bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>

          {/* Skeleton Bar Chart Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="pb-3 sm:pb-4 mb-3 sm:mb-4">
              <div className="h-3.5 w-52 bg-slate-300 dark:bg-slate-700 rounded-md mb-2 animate-pulse" />
              <div className="h-2.5 w-60 max-w-full bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
            </div>
            <div className="h-40 sm:h-52 flex items-end justify-between gap-2.5 sm:gap-4 px-1 sm:px-4 pt-6 sm:pt-8 pb-2">
              {[70, 45, 85, 55, 65].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full">
                  <div
                    className="w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-t-lg"
                    style={{ height: `${h}%` }}
                  />
                  <div className="w-8 sm:w-10 h-3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skeleton Bottom Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Antrean Berkas */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-200 dark:bg-slate-800 p-3.5 sm:p-4 h-[52px] sm:h-[56px]" />
            <div className="p-2.5 sm:p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 px-2.5 sm:px-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-20 animate-pulse" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-14 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-full sm:w-24 shrink-0 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Peringkat Kebijakan */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-200 dark:bg-slate-800 p-3.5 sm:p-4 h-[52px] sm:h-[56px]" />
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs min-w-[420px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 dark:border-slate-800">
                    <th className="p-2.5 sm:p-3 pl-4 sm:pl-5">
                      <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </th>
                    <th className="p-2.5 sm:p-3">
                      <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </th>
                    <th className="p-2.5 sm:p-3 text-center">
                      <div className="h-2.5 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto" />
                    </th>
                    <th className="p-2.5 sm:p-3 text-center">
                      <div className="h-2.5 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                  {[1, 2, 3].map((n) => (
                    <tr key={n}>
                      <td className="p-2.5 sm:p-3 pl-4 sm:pl-5">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-2/3" />
                      </td>
                      <td className="p-2.5 sm:p-3">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-20" />
                      </td>
                      <td className="p-2.5 sm:p-3 text-center">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full w-14 mx-auto" />
                      </td>
                      <td className="p-2.5 sm:p-3 text-center">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-8 mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#142B4D] via-[#10223d] to-[#1d3c6a] p-5 sm:p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="absolute -right-6 -bottom-6 sm:-right-10 sm:-bottom-10 opacity-10 pointer-events-none transform rotate-12 transition-transform duration-500">
          <ClipboardCheck className="w-40 h-40 sm:w-64 sm:h-64 text-white" />
        </div>
        <div className="relative z-10 space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent leading-snug">
            Hallo Selamat Datang, {fullName}!
          </h1>
          <p className="text-blue-100/80 dark:text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Anda memegang kendali penilaian seluruh cabang. Periksa antrean review usulan lokasi (ULOK), berikan catatan revisi, dan pantau perangkingan nilai SAW terbaik secara terpusat.
          </p>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        
        <div className="group bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#FE9A00] dark:border-t-[#FE9A00] shadow-sm flex items-center justify-between gap-2 transition-all duration-300 sm:hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <p className="text-[#FE9A00] text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
              Antrean Review
            </p>

            {loading ? (
              <div className="h-6 sm:h-9 w-14 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <h3 className="text-xl sm:text-3xl font-black text-[#FE9A00] tracking-tight">
                {inReviewCount}
              </h3>
            )}

            <p className="hidden sm:block text-[11px] text-gray-400 dark:text-slate-400 font-medium">
              Menunggu penilaian Anda
            </p>
          </div>

          <div className="bg-[#FE9A00]/10 dark:bg-[#FE9A00]/20 p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Clock className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#FE9A00]" />
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#D11A22] dark:border-t-[#D11A22] shadow-sm flex items-center justify-between gap-2 transition-all duration-300 sm:hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <p className="text-[#D11A22] text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
              Sedang Direvisi
            </p>

            {loading ? (
              <div className="h-6 sm:h-9 w-14 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <h3 className="text-xl sm:text-3xl font-black text-[#D11A22] tracking-tight">
                {revisionCount}
              </h3>
            )}

            <p className="hidden sm:block text-[11px] text-gray-400 dark:text-slate-400 font-medium">
              Dikembalikan ke cabang
            </p>
          </div>

          <div className="bg-[#D11A22]/10 dark:bg-[#D11A22]/20 p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <AlertTriangle className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#D11A22]" />
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-emerald-500 dark:border-t-emerald-500 shadow-sm flex items-center justify-between gap-2 transition-all duration-300 sm:hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <p className="text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
              Selesai Dinilai
            </p>

            {loading ? (
              <div className="h-6 sm:h-9 w-14 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <h3 className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {completedCount}
              </h3>
            )}

            <p className="hidden sm:block text-[11px] text-gray-400 dark:text-slate-400 font-medium">
              Approved & Rejected
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <CheckCircle2 className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-emerald-500" />
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#142B4D] dark:border-t-[#142B4D] shadow-sm flex items-center justify-between gap-2 transition-all duration-300 sm:hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <p className="text-[#142B4D] dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
              Cabang Berpartisipasi
            </p>

            {loading ? (
              <div className="h-6 sm:h-9 w-14 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <h3 className="text-xl sm:text-3xl font-black text-[#142B4D] dark:text-white tracking-tight">
                {activeBranchesCount}
              </h3>
            )}

            <p className="hidden sm:block text-[11px] text-gray-400 dark:text-slate-400 font-medium">
              Cabang mengirim data aktif
            </p>
          </div>

          <div className="bg-[#142B4D]/10 dark:bg-slate-800 p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Building2 className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#142B4D] dark:text-blue-400" />
          </div>
        </div>

      </div>

      {/* CHARTS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-pulse">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 md:p-6 shadow-sm h-64 sm:h-80" />
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 md:p-6 shadow-sm h-64 sm:h-80" />
        </div>
      ) : (
        <AssessorDashboardCharts
          displayPieData={displayPieData}
          branchDistribution={branchDistribution}
        />
      )}

      {/* BOTTOM CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
          <div className="bg-[#142B4D] dark:bg-slate-950 p-3.5 sm:p-4 text-white flex items-center justify-between gap-2">
            <h3 className="font-bold text-xs sm:text-sm flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-[#FE9A00] shrink-0" />
              <span className="truncate">Antrean Berkas Masuk Terbaru</span>
            </h3>
            <span className="text-[10px] bg-[#FE9A00] text-slate-950 font-black px-2 sm:px-2.5 py-0.5 rounded-full animate-pulse shrink-0">
              Belum Di-checklist
            </span>
          </div>

          <div className="p-2.5 sm:p-3 flex-1 divide-y divide-gray-100 dark:divide-slate-800 overflow-y-auto max-h-[300px] sm:max-h-[350px] scrollbar-thin">
            {loading ? (
              <div className="space-y-3.5 py-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2.5 sm:px-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="h-3.5 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-md w-3/4" />
                      <div className="flex gap-2">
                        <div className="h-3 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-md w-20" />
                        <div className="h-3 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-md w-14" />
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-xl w-full sm:w-24 shrink-0" />
                  </div>
                ))}
              </div>
            ) : reviewQueue.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 italic">Semua berkas masuk telah mulai dinilai atau dinilai penuh! ✨</div>
            ) : (
              reviewQueue.map((item) => (
                <div key={item.id} className="py-2.5 sm:py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2.5 sm:px-3 rounded-xl transition-all duration-200 group">
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-xs text-gray-900 dark:text-slate-100 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors truncate">{item.nama_lokasi}</h4>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-400 dark:text-slate-500">
                      <span className="bg-[#142B4D]/10 text-[#142B4D] dark:bg-slate-800 dark:text-slate-300 font-bold px-2 py-0.5 rounded text-[10px]">
                        {item.profiles?.branches?.nama_cabang || 'Cabang Pusat'}
                      </span>
                      <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-medium">{item.jenis_badan_hukum}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGoToReview(item.id, item.jenis_badan_hukum)}
                    className="w-full sm:w-auto px-3 py-2 text-xs font-bold text-white bg-[#142B4D] hover:bg-[#1d3c6a] dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl flex items-center justify-center gap-1 transition shadow-sm active:scale-95 group shrink-0"
                  >
                    Buka Formulir 
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
          <div className="bg-[#142B4D] dark:bg-slate-950 p-3.5 sm:p-4 text-white flex items-center justify-between gap-2">
            <h3 className="font-bold text-xs sm:text-sm flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Peringkat Kebijakan ULOK Terbaik (Nasional)</span>
            </h3>
            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 sm:px-2.5 py-0.5 rounded-full shrink-0">
              Skor SAW
            </span>
          </div>

          <div className="overflow-x-auto flex-1 scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs min-w-[420px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-400 font-bold text-[11px]">
                  <th className="p-2.5 sm:p-3 pl-4 sm:pl-5">Nama ULOK</th>
                  <th className="p-2.5 sm:p-3">Asal Cabang</th>
                  <th className="p-2.5 sm:p-3 text-center">Status</th>
                  <th className="p-2.5 sm:p-3 text-center">Skor Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-gray-700 dark:text-slate-300">
                {loading ? (
                  [1, 2, 3, 4, 5].map((n) => (
                    <tr key={n}>
                      <td className="p-2.5 sm:p-3 pl-4 sm:pl-5">
                        <div className="h-3.5 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-md w-2/3" />
                      </td>
                      <td className="p-2.5 sm:p-3">
                        <div className="h-3.5 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-md w-20" />
                      </td>
                      <td className="p-2.5 sm:p-3 text-center">
                        <div className="h-4 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-full w-14 mx-auto" />
                      </td>
                      <td className="p-2.5 sm:p-3 text-center">
                        <div className="h-3.5 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-md w-8 mx-auto" />
                      </td>
                    </tr>
                  ))
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
                        <td className="p-2.5 sm:p-3 pl-4 sm:pl-5 font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors">{row.nama_lokasi}</td>
                        <td className="p-2.5 sm:p-3 text-gray-500 dark:text-slate-400 font-medium">
                          {row.profiles?.branches?.nama_cabang || 'Cabang Pusat'}
                        </td>
                        <td className="p-2.5 sm:p-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-2.5 sm:p-3 text-center font-black text-emerald-600 dark:text-emerald-400 text-sm">
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