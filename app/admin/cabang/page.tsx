'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentProfile } from '@/actions/auth';
import { getUlokSubmissions } from '@/actions/cabang';
import { getNotificationsAction } from '@/actions/superadmin';
import { 
  FileText, 
  FileEdit, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  TrendingUp, 
  Layers,
  ArrowRight,
  Bell
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';

export default function AdminCabangPage() {
  const [fullName, setFullName] = useState<string>("Loading...");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initDashboard() {
      setLoading(true);
      try {
        // Fetch Profile
        const profileRes = await getCurrentProfile();
        if (profileRes && profileRes.success && profileRes.profile) {
          setFullName(profileRes.profile.full_name);
        } else {
          setFullName("Pengguna");
        }

        // Fetch Submissions
        const submissionsRes = await getUlokSubmissions();
        if (submissionsRes && submissionsRes.success && submissionsRes.data) {
          setSubmissions(submissionsRes.data);
        }

        // Fetch Notifications as Recent Activity
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

  // Calculate stats dynamically
  const totalSubmissions = submissions.length;
  const draftCount = submissions.filter(s => s.status === 'Draft').length;
  const inReviewCount = submissions.filter(s => s.status === 'In Review').length;
  const revisionCount = submissions.filter(s => s.status === 'Revision').length;
  const approvedCount = submissions.filter(s => s.status === 'Approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'Rejected').length;

  // Pie chart data
  const chartData = [
    { name: 'Draft (Belum Diajukan)', value: draftCount, color: '#64748B' }, // Slate
    { name: 'Dalam Review', value: inReviewCount, color: '#F59E0B' }, // Amber
    { name: 'Butuh Revisi', value: revisionCount, color: '#F43F5E' }, // Rose
    { name: 'Selesai / Approved', value: approvedCount, color: '#10B981' }, // Emerald
    { name: 'Ditolak / Rejected', value: rejectedCount, color: '#1E3A8A' } // Navy
  ].filter(item => item.value > 0);

  // Default mock data if no submissions have statuses yet to show the chart beautifully
  const displayChartData = chartData.length > 0 ? chartData : [
    { name: 'Draft', value: 1, color: '#64748B' },
    { name: 'Dalam Review', value: 1, color: '#F59E0B' },
    { name: 'Butuh Revisi', value: 1, color: '#F43F5E' }
  ];

  // Top 5 highest final scores
  const topScores = [...submissions]
    .filter(s => s.final_score !== null && s.final_score !== undefined)
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 md:p-4">
      {/* WELCOME BANNER */}
      <div className="bg-[#142B4D] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
          <Layers className="w-64 h-64 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight relative z-10">
          Selamat Datang Kembali, {fullName}!
        </h1>
        <p className="text-blue-200 text-xs md:text-sm mt-1 max-w-xl relative z-10">
          Pantau status usulan lokasi (ULOK) cabang Anda, kelola draf dokumen, perbaiki revisi, dan pantau penilaian real-time di sini.
        </p>
      </div>

      {/* 4 SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Pengajuan (Navy) */}
        <div className="bg-white p-5 rounded-2xl border-t-4 border-[#142B4D] shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Pengajuan</p>
            <h3 className="text-3xl font-black text-gray-800 mt-1">{loading ? '...' : totalSubmissions}</h3>
            <span className="text-[11px] text-gray-500 font-medium">Semua berkas terdaftar</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl">
            <FileText className="w-6 h-6 text-[#142B4D]" />
          </div>
        </div>

        {/* Card 2: Status Draft (Gray/Slate) */}
        <div className="bg-white p-5 rounded-2xl border-t-4 border-slate-500 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Status Draft</p>
            <h3 className="text-3xl font-black text-slate-700 mt-1">{loading ? '...' : draftCount}</h3>
            <span className="text-[11px] text-slate-500 font-medium">Belum diajukan ke pusat</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <FileEdit className="w-6 h-6 text-slate-600" />
          </div>
        </div>

        {/* Card 3: Dalam Review (Amber/Kuning) */}
        <div className="bg-white p-5 rounded-2xl border-t-4 border-amber-500 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-amber-600 text-xs font-bold uppercase tracking-wider">Dalam Review</p>
            <h3 className="text-3xl font-black text-amber-600 mt-1">{loading ? '...' : inReviewCount}</h3>
            <span className="text-[11px] text-amber-500 font-medium">Sedang dinilai assessor</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        {/* Card 4: Butuh Revisi (Rose/Merah Muda) */}
        <div className="bg-white p-5 rounded-2xl border-t-4 border-rose-500 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-rose-600 text-xs font-bold uppercase tracking-wider">Butuh Revisi</p>
            <h3 className="text-3xl font-black text-rose-600 mt-1">{loading ? '...' : revisionCount}</h3>
            <span className="text-[11px] text-rose-500 font-medium">Perlu perbaikan berkas</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
        </div>
      </div>

      {/* CHART ROW */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 pb-4 mb-4">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#142B4D]" />
            Persentase Status Pengajuan ULOK
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Visualisasi penyebaran status usulan lokasi saat ini</p>
        </div>
        <div className="h-64 flex flex-col md:flex-row items-center justify-around gap-4">
          <div className="w-full md:w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {displayChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} Usulan`, 'Jumlah']} 
                  contentStyle={{ borderRadius: '12px', borderColor: '#E2E8F0' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-2">
            <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-2">Legenda Status</h4>
            {displayChartData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold py-1 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-700">{entry.name}</span>
                </div>
                <span className="text-gray-900 font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TWO COLUMN BOTTOM LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#142B4D] p-4 text-white flex items-center justify-between">
            <h3 className="font-bold text-sm md:text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Recent Activity (Log & Notifikasi)
            </h3>
            <span className="text-[10px] bg-blue-900 text-blue-100 font-bold px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          <div className="p-5 flex-1 divide-y divide-gray-100 overflow-y-auto max-h-[350px]">
            {loading ? (
              <div className="text-center py-12 text-sm text-gray-400">Loading aktivitas...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">Tidak ada aktivitas terbaru.</div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={notif.id || idx} className="py-3 first:pt-0 last:pb-0 flex gap-3 hover:bg-slate-50/50 transition px-1 rounded-lg">
                  <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-gray-800">{notif.title}</h4>
                      <span className="text-[10px] text-gray-400 font-semibold flex-shrink-0">
                        {notif.created_at ? new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: Top 5 Lokasi Skor Tertinggi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#142B4D] p-4 text-white flex items-center justify-between">
            <h3 className="font-bold text-sm md:text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Top 5 Lokasi Skor Tertinggi
            </h3>
            <span className="text-[10px] bg-emerald-600 text-emerald-50 font-bold px-2 py-0.5 rounded-full">
              Sistem SAW
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 font-bold">
                  <th className="p-4 pl-6">Nama ULOK</th>
                  <th className="p-4">Badan Hukum</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Skor SAW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center p-12 text-gray-400">Loading data skor...</td>
                  </tr>
                ) : topScores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-12 text-gray-400">Belum ada lokasi yang dinilai.</td>
                  </tr>
                ) : (
                  topScores.map((row, idx) => {
                    let statusColor = "bg-gray-100 text-gray-700";
                    if (row.status === 'Approved') statusColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                    else if (row.status === 'In Review') statusColor = "bg-amber-50 text-amber-700 border border-amber-200";
                    else if (row.status === 'Revision') statusColor = "bg-red-50 text-red-700 border border-red-200";

                    return (
                      <tr key={row.id || idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 pl-6 font-bold text-gray-900">{row.nama_lokasi}</td>
                        <td className="p-4 text-gray-500 font-medium">{row.jenis_badan_hukum}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                            {row.status === 'Draft' ? 'Draf' : row.status}
                          </span>
                        </td>
                        <td className="p-4 text-center font-black text-emerald-600 text-sm">{row.final_score.toFixed(2)}</td>
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
