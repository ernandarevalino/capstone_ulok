'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentProfile } from '@/actions/auth';
import { getUlokSubmissions, getNotificationsAction } from '@/actions/cabang';
import { calculateULOKSAW } from '@/actions/saw';
import { 
  FileText, 
  FileEdit, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  TrendingUp, 
  Layers,
  Bell
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip
} from 'recharts';

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xl backdrop-blur-sm animate-fade-in">
        <p className="text-xs font-bold text-gray-800 dark:text-slate-100">{payload[0].name}</p>
        <p className="text-xs text-[#142B4D] dark:text-blue-400 font-black mt-0.5">
          {payload[0].value} Usulan
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminCabangPage() {
  const [fullName, setFullName] = useState<string>("Loading...");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initDashboard() {
      setLoading(true);
      try {
        const profileRes = await getCurrentProfile();
        if (profileRes && profileRes.success && profileRes.profile) {
          setFullName(profileRes.profile.full_name);
        } else {
          setFullName("Pengguna");
        }

        const submissionsRes = await getUlokSubmissions();
        if (submissionsRes && submissionsRes.success && submissionsRes.data) {
          setSubmissions(submissionsRes.data);

          const uncalculated = submissionsRes.data.filter((s: any) => s.status !== 'Draft' && (s.final_score === 0 || s.final_score === null));
          if (uncalculated.length > 0) {
            Promise.all(uncalculated.map((s: any) => calculateULOKSAW(s.id)))
              .then(() => {
                getUlokSubmissions().then((updatedRes) => {
                  if (updatedRes && updatedRes.success && updatedRes.data) {
                    setSubmissions(updatedRes.data);
                  }
                });
              })
              .catch((err) => console.error("Gagal melakukan kalkulasi background SAW:", err));
          }
        }

        const notificationsRes = await getNotificationsAction();
        if (notificationsRes && notificationsRes.success && notificationsRes.data) {
          setNotifications(notificationsRes.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Gagal menginisialisasi dashboard admin cabang:", err);
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, []);

  const totalSubmissions = submissions.length;
  const draftCount = submissions.filter(s => s.status === 'Draft').length;
  const inReviewCount = submissions.filter(s => s.status === 'In Review').length;
  const revisionCount = submissions.filter(s => s.status === 'Revisi').length;
  const approvedCount = submissions.filter(s => s.status === 'Approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'Rejected').length;

  const chartData = [
    { name: 'Draft (Belum Diajukan)', value: draftCount, color: '#64748B' }, 
    { name: 'Dalam Review', value: inReviewCount, color: '#FE9A00' }, 
    { name: 'Butuh Revisi', value: revisionCount, color: '#D11A22' },   
    { name: 'Selesai / Approved', value: approvedCount, color: '#10B981' }, 
    { name: 'Ditolak / Rejected', value: rejectedCount, color: '#334155' } 
  ].filter(item => item.value > 0);

  const displayChartData = chartData.length > 0 ? chartData : [
    { name: 'Draft', value: 1, color: '#64748B' },
    { name: 'Dalam Review', value: 1, color: '#FE9A00' },
    { name: 'Butuh Revisi', value: 1, color: '#D11A22' }
  ];

  const topScores = [...submissions]
    .filter(s => s.final_score !== null && s.final_score !== undefined)
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 7);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-3 md:p-6 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#142B4D] via-[#0f203a] to-[#1a365d] p-6 text-white shadow-lg border border-[#142B4D] dark:border-slate-800 transition-all duration-300 hover:shadow-xl">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none transform rotate-12 transition-transform duration-500">
          <Layers className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/10 backdrop-blur-md border border-white/20 text-[#FE9A00]">
            🏢 Dashboard Cabang
          </span>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            Selamat Datang Kembali, {fullName}!
          </h1>
          <p className="text-blue-100/80 dark:text-slate-300 text-xs md:text-sm max-w-xl leading-relaxed">
            Pantau status usulan lokasi (ULOK) cabang Anda, kelola draf dokumen, perbaiki revisi, dan pantau penilaian real-time di sini.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#142B4D] shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-1">
            <p className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Total Pengajuan</p>
            <h3 className="text-3xl font-black text-gray-800 dark:text-slate-100 tracking-tight">{loading ? '...' : totalSubmissions}</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Semua berkas terdaftar</p>
          </div>
          <div className="bg-[#142B4D]/10 dark:bg-slate-800 p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <FileText className="w-6 h-6 text-[#142B4D] dark:text-blue-400" />
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-slate-400 shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-1">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Status Draft</p>
            <h3 className="text-3xl font-black text-slate-700 dark:text-slate-200 tracking-tight">{loading ? '...' : draftCount}</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Belum diajukan ke pusat</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <FileEdit className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#FE9A00] shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-1">
            <p className="text-[#FE9A00] text-xs font-bold uppercase tracking-wider">Dalam Review</p>
            <h3 className="text-3xl font-black text-[#FE9A00] tracking-tight">{loading ? '...' : inReviewCount}</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Sedang dinilai assessor</p>
          </div>
          <div className="bg-[#FE9A00]/10 dark:bg-[#FE9A00]/20 p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Clock className="w-6 h-6 text-[#FE9A00]" />
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#D11A22] shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-[0.98]">
          <div className="space-y-1">
            <p className="text-[#D11A22] text-xs font-bold uppercase tracking-wider">Butuh Revisi</p>
            <h3 className="text-3xl font-black text-[#D11A22] tracking-tight">{loading ? '...' : revisionCount}</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Perlu perbaikan berkas</p>
          </div>
          <div className="bg-[#D11A22]/10 dark:bg-[#D11A22]/20 p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <AlertTriangle className="w-6 h-6 text-[#D11A22]" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-all duration-300 hover:shadow-md">
        <div className="border-b border-gray-100 dark:border-slate-800/80 pb-4 mb-4">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#142B4D] dark:text-blue-400" />
            Persentase Status Pengajuan ULOK
          </h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Visualisasi penyebaran status usulan lokasi saat ini</p>
        </div>
        <div className="h-64 flex flex-col md:flex-row items-center justify-around gap-6">
          <div className="w-full md:w-1/2 h-full min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {displayChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="transition-all duration-300 hover:opacity-80 outline-none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-2">
            <h4 className="text-xs font-extrabold uppercase text-gray-400 dark:text-slate-500 tracking-wider mb-2">Legenda Status</h4>
            {displayChartData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold py-2 border-b border-gray-50 dark:border-slate-800/50 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-600 dark:text-slate-300">{entry.name}</span>
                </div>
                <span className="text-gray-900 dark:text-slate-100 font-bold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
          <div className="bg-[#142B4D] dark:bg-slate-950 p-4 text-white flex items-center justify-between border-b dark:border-slate-800">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#FE9A00]" />
              Recent Activity (Log & Notifikasi)
            </h3>
            <span className="text-[10px] bg-white/10 text-blue-200 border border-white/10 font-bold px-2.5 py-0.5 rounded-full animate-pulse">
              Real-time
            </span>
          </div>

          <div className="p-4 flex-1 divide-y divide-gray-100 dark:divide-slate-800 overflow-y-auto max-h-[350px] scrollbar-thin">
            {loading ? (
              <div className="text-center py-12 text-xs text-gray-400 dark:text-slate-500">Loading aktivitas...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 dark:text-slate-500 italic">Tidak ada aktivitas terbaru.</div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={notif.id || idx} className="py-3 first:pt-0 last:pb-0 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition px-2 rounded-xl group">
                  <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-[#FE9A00] group-hover:scale-125 transition-transform" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-gray-800 dark:text-slate-200 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold shrink-0">
                        {notif.created_at ? new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
          <div className="bg-[#142B4D] dark:bg-slate-950 p-4 text-white flex items-center justify-between border-b dark:border-slate-800">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Top 7 Lokasi Skor Tertinggi
            </h3>
            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full">
              Sistem SAW
            </span>
          </div>

          <div className="overflow-x-auto flex-1 scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800 text-gray-400 dark:text-slate-400 font-bold text-[11px]">
                  <th className="p-3 pl-5">Nama ULOK</th>
                  <th className="p-3">Badan Hukum</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Skor SAW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-gray-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center p-12 text-xs text-gray-400 dark:text-slate-500">Loading data skor...</td>
                  </tr>
                ) : topScores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-12 text-xs text-gray-400 dark:text-slate-500 italic">Belum ada lokasi yang dinilai.</td>
                  </tr>
                ) : (
                  topScores.map((row, idx) => {
                    let statusColor = "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
                    if (row.status === 'Approved') statusColor = "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40";
                    else if (row.status === 'In Review') statusColor = "bg-[#FE9A00]/10 text-[#FE9A00] border border-[#FE9A00]/20 dark:bg-[#FE9A00]/20";
                    else if (row.status === 'Revisi') statusColor = "bg-[#D11A22]/10 text-[#D11A22] border border-[#D11A22]/20 dark:bg-[#D11A22]/20";

                    return (
                      <tr key={row.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="p-3 pl-5 font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors">{row.nama_lokasi}</td>
                        <td className="p-3 text-gray-500 dark:text-slate-400 font-medium">{row.jenis_badan_hukum}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                            {row.status === 'Draft' ? 'Draf' : row.status}
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