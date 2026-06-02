'use client';

import React, { useState, useEffect } from 'react';
import { getDashboardStatsAction, getNotificationsAction } from '@/actions/superadmin';
import Link from 'next/link';
import { 
  Layers, 
  TrendingUp, 
  Bell, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip
} from 'recharts';

// Custom Tooltip Recharts mendukung Light/Dark Mode
const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-md">
        <p className="text-xs font-bold text-gray-800 dark:text-slate-100">{payload[0].name}</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 font-extrabold mt-0.5">
          {payload[0].value} Entitas
        </p>
      </div>
    );
  }
  return null;
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ 
    adminCabang: 0, 
    assessor: 0, 
    totalUlok: 0 
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Ambil Data Statistik Utama
        const resStats = await getDashboardStatsAction();
        if (resStats && resStats.success) {
          // Melakukan type-casting 'as any' agar TypeScript tidak komplain
          const dataDariBackend = resStats.stats as any;
          setStats({
            adminCabang: dataDariBackend.adminCabang || 0,
            assessor: dataDariBackend.assessor || 0,
            totalUlok: dataDariBackend.totalUlok || 0
          });
        }

        // Ambil Log Notifikasi & Aktivitas Gabungan
        const resNotif = await getNotificationsAction();
        if (resNotif && resNotif.success && resNotif.data) {
          setNotifications(resNotif.data.slice(0, 6)); 
        }
      } catch (error) {
        console.error("Gagal memuat data dashboard super admin:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Format Data Grafik (Menampilkan perbandingan komposisi data di dalam sistem)
  const chartData = [
    { name: 'Admin Cabang (User)', value: stats.adminCabang, color: '#3B82F6' }, // Blue
    { name: 'Tim Assessor (User)', value: stats.assessor, color: '#A855F7' },    // Purple
    { name: 'Total Berkas ULOK', value: stats.totalUlok, color: '#10B981' }      // Emerald
  ].filter(item => item.value > 0);

  // Default Chart Data jika database masih kosong
  const displayChartData = chartData.length > 0 ? chartData : [
    { name: 'Admin Cabang', value: 1, color: '#3B82F6' },
    { name: 'Tim Assessor', value: 1, color: '#A855F7' },
    { name: 'Total Berkas ULOK', value: 1, color: '#10B981' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 md:p-4 text-gray-800 dark:text-slate-100">
      
      {/* WELCOME BANNER */}
      <div className="bg-[#142B4D] dark:bg-slate-950 text-white p-6 rounded-2xl shadow-md relative overflow-hidden border border-transparent dark:border-slate-800">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
          <Layers className="w-64 h-64 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight relative z-10">
          Dashboard Utama Super Admin
        </h1>
        <p className="text-blue-200 dark:text-slate-400 text-xs md:text-sm mt-1 max-w-2xl relative z-10">
          Selamat datang kembali! Panel ini digunakan untuk memonitoring penuh akun aktif, validasi dokumen master, serta mengontrol kelancaran alur penilaian dokumen SAW (Simple Additive Weighting).
        </p>
      </div>

      {/* 3 SUMMARY CARDS DENGAN TRANSISI WARNA TULISAN (TANPA UNDERLINE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Total Admin Cabang (Blue Theme) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/80 border-t-4 border-t-blue-500 flex items-center justify-between shadow-xs hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.25)] hover:border-blue-300 dark:hover:border-blue-800/50 hover:-translate-y-1.5 transition-all duration-300 ease-out group cursor-pointer">
          <div className="space-y-1.5">
            <p className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider transition-colors duration-300 group-hover:text-blue-500">Total Admin Cabang</p>
            <h3 className="text-3xl font-black text-gray-800 dark:text-slate-100 tracking-tight">
              {loading ? '...' : `${stats.adminCabang} User`}
            </h3>
            {/* LINK: Diubah ke group-hover warna biru yang lebih tegas/terang tanpa underline */}
            <Link href="/admin/super-admin/daftaruser/admincabang" className="text-[11px] text-blue-600 dark:text-blue-400 font-bold inline-flex items-center gap-1 pt-1 transition-colors duration-300 group-hover:text-blue-800 dark:group-hover:text-blue-300">
              Kelola Admin Cabang 
              <ArrowRight className="w-3 h-3 transform transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-xl transition-all duration-300 ease-out group-hover:bg-blue-500 group-hover:scale-110 group-hover:rotate-2 group-hover:shadow-[0_8px_20px_-6px_rgba(59,130,246,0.4)]">
            <img 
              src="/icons/icon-perorangan.svg" 
              alt="Icon Perorangan" 
              className="w-7 h-7 object-contain dark:invert transition-all duration-300 ease-out group-hover:invert-0 group-hover:brightness-200"
            />
          </div>
        </div>

        {/* Card 2: Total Tim Assessor (Purple Theme) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/80 border-t-4 border-t-purple-500 flex items-center justify-between shadow-xs hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.15)] dark:hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.25)] hover:border-purple-300 dark:hover:border-purple-800/50 hover:-translate-y-1.5 transition-all duration-300 ease-out group cursor-pointer">
          <div className="space-y-1.5">
            <p className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider transition-colors duration-300 group-hover:text-purple-500">Total Tim Assessor</p>
            <h3 className="text-3xl font-black text-gray-800 dark:text-slate-100 tracking-tight">
              {loading ? '...' : `${stats.assessor} User`}
            </h3>
            {/* LINK: Diubah ke group-hover warna ungu yang lebih tegas/terang tanpa underline */}
            <Link href="/admin/super-admin/daftaruser/assessor" className="text-[11px] text-purple-600 dark:text-purple-400 font-bold inline-flex items-center gap-1 pt-1 transition-colors duration-300 group-hover:text-purple-800 dark:group-hover:text-purple-300">
              Kelola Tim Penilai 
              <ArrowRight className="w-3 h-3 transform transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/40 p-3.5 rounded-xl transition-all duration-300 ease-out group-hover:bg-purple-500 group-hover:scale-110 group-hover:rotate-2 group-hover:shadow-[0_8px_20px_-6px_rgba(168,85,247,0.4)]">
            <img 
              src="/icons/icon-law.svg" 
              alt="Icon Law" 
              className="w-7 h-7 object-contain dark:invert transition-all duration-300 ease-out group-hover:invert-0 group-hover:brightness-200"
            />
          </div>
        </div>

        {/* Card 3: Total Pengajuan ULOK (Emerald Theme) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/80 border-t-4 border-t-emerald-500 flex items-center justify-between shadow-xs hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.25)] hover:border-emerald-300 dark:hover:border-emerald-800/50 hover:-translate-y-1.5 transition-all duration-300 ease-out group cursor-pointer">
          <div className="space-y-1.5">
            <p className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider transition-colors duration-300 group-hover:text-emerald-500">Total Pengajuan ULOK</p>
            <h3 className="text-3xl font-black text-gray-800 dark:text-slate-100 tracking-tight">
              {loading ? '...' : `${stats.totalUlok} Berkas`}
            </h3>
            <span className="text-[11px] text-gray-400 dark:text-slate-500 block pt-1 font-medium tracking-wide transition-colors duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Terintegrasi Database Terpusat</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl transition-all duration-300 ease-out group-hover:bg-emerald-500 group-hover:scale-110 group-hover:rotate-2 group-hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.4)]">
            <img 
              src="/icons/icon-file.svg" 
              alt="Icon File" 
              className="w-7 h-7 object-contain dark:invert transition-all duration-300 ease-out group-hover:invert-0 group-hover:brightness-200"
            />
          </div>
        </div>

      </div>

      {/* CHART ROW PANEL */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="border-b border-gray-100 dark:border-slate-800 pb-4 mb-4">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#142B4D] dark:text-blue-400" />
            Proporsi Data dan Entitas Sistem SPK
          </h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Visualisasi perbandingan volume user aktif dan dokumen usulan masuk</p>
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
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-2">
            <h4 className="text-xs font-extrabold uppercase text-gray-400 dark:text-slate-500 tracking-wider mb-2">Legenda Parameter</h4>
            {displayChartData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold py-1 border-b border-gray-50 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-700 dark:text-slate-300">{entry.name}</span>
                </div>
                <span className="text-gray-900 dark:text-slate-100 font-bold">
                  {loading ? '...' : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TWO COLUMN BOTTOM LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri & Tengah: Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#142B4D] dark:bg-slate-950 p-4 text-white flex items-center justify-between border-b dark:border-slate-800">
            <h3 className="font-bold text-sm md:text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Recent Activity (Log Sistem Global)
            </h3>
            <span className="text-[10px] bg-blue-900 dark:bg-slate-800 text-blue-100 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
              Real-time Monitor
            </span>
          </div>

          <div className="p-5 flex-1 divide-y divide-gray-100 dark:divide-slate-800 overflow-y-auto max-h-87.5">
            {loading ? (
              <div className="text-center py-12 text-sm text-gray-400 dark:text-slate-500">Memuat log aktivitas...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400 dark:text-slate-500">Tidak ada aktivitas terdeteksi dari Cabang maupun Assessor.</div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={notif.id || idx} className="py-3 first:pt-0 last:pb-0 flex gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition px-2 rounded-lg">
                  <div className="mt-1 shrink-0 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-gray-800 dark:text-slate-200">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold shrink-0">
                        {notif.created_at ? new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: Otoritas Kontrol Panel Quick Actions */}
        <div className="bg-linear-to-r from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-700 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="bg-slate-700/50 w-fit p-2.5 rounded-xl border border-slate-600">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-bold text-base tracking-wide">Hak Akses Penuh Super Admin</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sebagai pemegang otoritas tertinggi sistem SPK PT. Midi Utama Indonesia Tbk, Anda berwenang memonitor silang semua aktivitas Admin Cabang, pelacakan berkas tertunda, kontrol data master checklist, serta memastikan pembobotan kriteria SAW berjalan objektif.
            </p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-700/60 space-y-2">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Akses Cepat Menu</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/super-admin/daftaruser/admincabang" className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors">
                Data Cabang
              </Link>
              <Link href="/admin/super-admin/profile" className="bg-slate-700 hover:bg-slate-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors">
                Profil Saya
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}