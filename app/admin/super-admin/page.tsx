'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getDashboardStatsAction, getNotificationsAction } from '@/actions/superadmin';
import Link from 'next/link';
import { 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  Users,
  FileText,
  Bell
} from 'lucide-react';

const SuperAdminDashboardCharts = dynamic(
  () => import('./SuperAdminDashboardCharts'),
  {
    ssr: false,
    loading: () => (
      <div className="h-auto sm:h-72 md:h-64 flex flex-col md:flex-row items-center justify-around gap-6 py-2 md:py-0 animate-pulse">
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full border-[12px] border-slate-200 dark:border-slate-800 flex items-center justify-center" />
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-3">
          <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded-md mb-2" />
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/30 px-2">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
              <div className="w-8 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    ),
  }
);

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
        const resStats = await getDashboardStatsAction();
        if (resStats && resStats.success) {
          const dataDariBackend = resStats.stats as any;
          setStats({
            adminCabang: dataDariBackend.adminCabang || 0,
            assessor: dataDariBackend.assessor || 0,
            totalUlok: dataDariBackend.totalUlok || 0
          });
        }

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

  const chartData = [
    { name: 'Admin Cabang (User)', value: stats.adminCabang, color: '#142B4D' }, 
    { name: 'Tim Assessor (User)', value: stats.assessor, color: '#FE9A00' },    
    { name: 'Total Berkas ULOK', value: stats.totalUlok, color: '#D11A22' }      
  ].filter(item => item.value > 0);

  const displayChartData = chartData.length > 0 ? chartData : [
    { name: 'Admin Cabang', value: 1, color: '#142B4D' },
    { name: 'Tim Assessor', value: 1, color: '#FE9A00' },
    { name: 'Total Berkas ULOK', value: 1, color: '#D11A22' }
  ];

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
        
        {/* === SKELETON BANNER: WELCOME === */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-800 p-5 sm:p-6 animate-pulse">
          <div className="h-5 sm:h-7 w-1/2 max-w-xs bg-slate-300 dark:bg-slate-700 rounded-md mb-2.5" />
          <div className="h-3 w-full max-w-xl bg-slate-300/70 dark:bg-slate-700/70 rounded-md" />
        </div>

        {/* === SKELETON SUMMARY CARDS === */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-slate-200 dark:border-t-slate-800 shadow-sm flex items-center justify-between gap-2 animate-pulse ${
                i === 3 ? 'col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-10 sm:h-8 w-16 bg-slate-300 dark:bg-slate-700 rounded-md" />
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded mt-1" />
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-slate-200 dark:bg-slate-800 rounded-lg sm:rounded-xl shrink-0" />
            </div>
          ))}
        </div>

        {/* === SKELETON PANEL GRAFIK === */}
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-slate-800 animate-pulse">
          <div className="pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-gray-100 dark:border-gray-800/60">
            <div className="h-3.5 w-48 bg-slate-300 dark:bg-slate-700 rounded-md mb-2" />
            <div className="h-2.5 w-60 max-w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="h-auto sm:h-72 md:h-64 flex flex-col md:flex-row items-center justify-around gap-6 py-2 md:py-0">
            <div className="w-full md:w-1/2 flex justify-center items-center">
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full border-[12px] border-slate-200 dark:border-slate-800 flex items-center justify-center" />
            </div>
            <div className="w-full md:w-1/2 flex flex-col gap-3">
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded-md mb-2" />
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/30 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                  <div className="w-8 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === SKELETON LAYOUT BAWAH === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Log Aktivitas Skeleton */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col animate-pulse">
            <div className="bg-slate-200 dark:bg-slate-800 p-3.5 sm:p-4 h-[52px] sm:h-[56px]" />
            <div className="p-3 sm:p-4 space-y-3.5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="py-2 flex gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-2.5 w-4/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hak Akses Penuh Quick Actions Skeleton */}
          <div className="bg-white dark:bg-slate-950/90 rounded-xl sm:rounded-2xl shadow-md p-5 sm:p-6 flex flex-col justify-between h-[300px] sm:h-[350px] animate-pulse">
            <div className="space-y-4">
              <div className="w-10 h-10 bg-slate-200/20 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 w-1/2 bg-slate-200/20 rounded" />
                <div className="h-3 w-5/6 bg-slate-200/20 rounded" />
                <div className="h-3 w-4/6 bg-slate-200/20 rounded" />
              </div>
            </div>
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="h-3 w-1/4 bg-slate-200/20 rounded" />
              <div className="flex gap-2">
                <div className="h-8 w-24 bg-slate-200/20 rounded-xl" />
                <div className="h-8 w-24 bg-slate-200/20 rounded-xl" />
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* === BANNER: WELCOME === */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#142B4D] via-[#0f203a] to-[#1a365d] p-5 sm:p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="absolute -right-6 -bottom-6 sm:-right-10 sm:-bottom-10 opacity-10 pointer-events-none transform rotate-12 transition-transform duration-500">
          <Layers className="w-40 h-40 sm:w-64 sm:h-64 text-white" />
        </div>
        <div className="relative z-10 space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent leading-snug">
            Dashboard Utama Super Admin
          </h1>
          <p className="text-blue-100/80 dark:text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Selamat datang kembali! Panel ini digunakan untuk memonitoring penuh akun aktif Admin Cabang, Tim Assessor, serta memantau seluruh aktivitas dan log sistem secara real-time.
          </p>
        </div>
      </div>

      {/* === SUMMARY CARDS === */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        
        {/* === CARD: TOTAL ADMIN CABANG === */}
        <div className="group bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#142B4D] shadow-sm flex items-center justify-between gap-2 transition-all duration-300 sm:hover:-translate-y-1 hover:shadow-md active:scale-[0.98] cursor-pointer">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <p className="text-gray-400 dark:text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Total Admin Cabang</p>
            <h3 className="text-xl sm:text-3xl font-black text-gray-800 dark:text-slate-100 tracking-tight">
              {stats.adminCabang} <span className="text-xs sm:text-sm font-semibold text-gray-400">User</span>
            </h3>
            <Link href="/admin/super-admin/daftaruser/admincabang" className="text-[11px] text-[#142B4D] dark:text-blue-400 font-bold inline-flex items-center gap-1 pt-1 transition-opacity duration-200 hover:opacity-75 truncate max-w-full">
              <span className="truncate">Kelola Admin Cabang</span>
              <ArrowRight className="w-3 h-3 transform transition-transform duration-300 ease-out group-hover:translate-x-1.5 shrink-0" />
            </Link>
          </div>
          <div className="bg-[#142B4D]/10 dark:bg-slate-800 p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Users className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#142B4D] dark:text-blue-400" />
          </div>
        </div>

        {/* === CARD: TOTAL TIM ASSESSOR === */}
        <div className="group bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#FE9A00] shadow-sm flex items-center justify-between gap-2 transition-all duration-300 sm:hover:-translate-y-1 hover:shadow-md active:scale-[0.98] cursor-pointer">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <p className="text-[#FE9A00] text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Total Tim Assessor</p>
            <h3 className="text-xl sm:text-3xl font-black text-[#FE9A00] tracking-tight">
              {stats.assessor} <span className="text-xs sm:text-sm font-semibold text-gray-400">User</span>
            </h3>
            <Link href="/admin/super-admin/daftaruser/assessor" className="text-[11px] text-[#FE9A00] font-bold inline-flex items-center gap-1 pt-1 transition-opacity duration-200 hover:opacity-75 truncate max-w-full">
              <span className="truncate">Kelola Tim Penilai</span>
              <ArrowRight className="w-3 h-3 transform transition-transform duration-300 ease-out group-hover:translate-x-1.5 shrink-0" />
            </Link>
          </div>
          <div className="bg-[#FE9A00]/10 dark:bg-[#FE9A00]/20 p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <ShieldCheck className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#FE9A00]" />
          </div>
        </div>

        {/* === CARD: TOTAL PENGAJUAN ULOK === */}
        <div className="group bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 border-t-4 border-t-[#D11A22] shadow-sm flex items-center justify-between gap-2 transition-all duration-300 sm:hover:-translate-y-1 hover:shadow-md active:scale-[0.98] cursor-pointer col-span-2 lg:col-span-1">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <p className="text-[#D11A22] text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Total Pengajuan ULOK</p>
            <h3 className="text-xl sm:text-3xl font-black text-[#D11A22] tracking-tight">
              {stats.totalUlok} <span className="text-xs sm:text-sm font-semibold text-gray-400">Berkas</span>
            </h3>
            <span className="text-[11px] text-gray-400 dark:text-slate-500 block pt-1 font-bold tracking-wide transition-colors duration-300 group-hover:text-[#D11A22] truncate">
              Terintegrasi Pusat
            </span>
          </div>
          <div className="bg-[#D11A22]/10 dark:bg-[#D11A22]/20 p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <FileText className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#D11A22]" />
          </div>
        </div>

      </div>

      {/* === PANEL GRAFIK === */}
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 transition-all duration-300 hover:shadow-md">
        <div className="border-b border-gray-100 dark:border-gray-800/60 pb-3 sm:pb-4 mb-3 sm:mb-4">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2 group cursor-default">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#142B4D] dark:text-blue-400 shrink-0" />
            Proporsi Data Dashboard Super Admin
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-400 dark:text-slate-500 mt-0.5">Visualisasi perbandingan volume user aktif dan dokumen usulan masuk</p>
        </div>
        <SuperAdminDashboardCharts displayChartData={displayChartData} />
      </div>

      {/* === LAYOUT BAWAH === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* === KOLOM LOG AKTIVITAS === */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
          <div className="bg-[#142B4D] dark:bg-slate-950 p-3.5 sm:p-4 text-white flex items-center justify-between gap-2">
            <h3 className="font-bold text-xs sm:text-sm flex items-center gap-2 min-w-0">
              <Bell className="w-4 h-4 text-[#FE9A00] shrink-0" />
              <span className="truncate">Recent Activity (Log Sistem Global)</span>
            </h3>
            <span className="text-[10px] bg-white/10 text-blue-200 border border-white/10 font-bold px-2 sm:px-2.5 py-0.5 rounded-full animate-pulse shrink-0">
              Real-time
            </span>
          </div>

          <div className="p-3 sm:p-4 flex-1 divide-y divide-gray-100 dark:divide-slate-800 overflow-y-auto max-h-[300px] sm:max-h-[350px] scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 dark:text-slate-500 italic">Tidak ada aktivitas terdeteksi dari Cabang maupun Assessor.</div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={notif.id || idx} className="py-2.5 sm:py-3 first:pt-0 last:pb-0 flex gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition px-2 rounded-xl group">
                  <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-[#FE9A00] transition-transform duration-200 group-hover:scale-125" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start sm:items-center justify-between gap-2">
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

        {/* === KOLOM QUICK ACTIONS === */}
        <div className="bg-[#142B4D] dark:bg-slate-950 text-white p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-md border border-transparent dark:border-gray-800/40 flex flex-col justify-between transition-all duration-300 hover:shadow-xl group">
          <div className="space-y-4">
            <div className="bg-white/10 dark:bg-[#1A2647] w-fit p-2.5 rounded-xl border border-white/10 dark:border-gray-800/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <ShieldCheck className="w-6 h-6 text-[#FE9A00]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-base tracking-wide">Hak Akses Penuh Super Admin</h3>
              <p className="text-xs text-gray-300 dark:text-gray-400 leading-relaxed font-medium">
                Sebagai pemegang otoritas tertinggi sistem SPK PT. Midi Utama Indonesia Tbk, Anda berwenang memonitor silang semua aktivitas Admin Cabang, pelacakan berkas tertunda, kontrol data master checklist, serta memastikan pembobotan kriteria SAW berjalan objektif.
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/10 dark:border-gray-800/30 space-y-2.5">
            <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Akses Cepat Menu</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/super-admin/daftaruser/admincabang" className="bg-[#FE9A00] hover:bg-[#e08900] text-[#142B4D] px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 shadow-sm">
                Data Cabang
              </Link>
              <Link href="/admin/super-admin/profile" className="bg-white/10 dark:bg-[#1A2647] hover:bg-white/20 dark:hover:bg-[#23335e] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 border border-white/5 dark:border-transparent">
                Profil Saya
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
