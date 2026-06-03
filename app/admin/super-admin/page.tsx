'use client';

import React, { useState, useEffect } from 'react';
import { getDashboardStatsAction, getNotificationsAction } from '@/actions/superadmin';
import Link from 'next/link';
import { 
  Layers, 
  TrendingUp, 
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

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#111C34] p-3 rounded-xl border border-gray-200 dark:border-gray-800/60 shadow-lg transition-colors duration-300">
        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{payload[0].name}</p>
        <p className="text-xs font-extrabold mt-1" style={{ color: payload[0].payload.color }}>
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 md:p-4 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      
      {/* === BANNER: WELCOME === */}
      <div className="bg-[#142B4D] dark:bg-[#111C34] text-white p-6 rounded-2xl shadow-md relative overflow-hidden border border-transparent dark:border-gray-800/40 transition-all duration-300">
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-6 translate-x-6">
          <Layers className="w-64 h-64 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight relative z-10">
          Dashboard Utama Super Admin
        </h1>
        <p className="text-gray-300 dark:text-gray-400 text-xs md:text-sm mt-1 max-w-2xl relative z-10 leading-relaxed">
          Selamat datang kembali! Panel ini digunakan untuk memonitoring penuh akun aktif Admin Cabang, Tim Assessor, serta memantau seluruh aktivitas dan log sistem secara real-time.
        </p>
      </div>

      {/* === SUMMARY CARDS === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* === CARD: TOTAL ADMIN CABANG === */}
        <div className="bg-white dark:bg-[#111C34] p-5 rounded-2xl border border-gray-100 dark:border-gray-800/40 border-t-4 border-t-[#142B4D] flex items-center justify-between shadow-xs hover:shadow-[0_20px_40px_-15px_rgba(20,43,77,0.25)] dark:hover:shadow-[0_20px_45px_-10px_rgba(20,43,77,0.45)] hover:border-[#142B4D]/30 dark:hover:border-[#142B4D]/60 hover:-translate-y-1.5 transition-all duration-300 ease-out group cursor-pointer">
          <div className="space-y-1.5">
            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider transition-colors duration-300 group-hover:text-[#142B4D] dark:group-hover:text-blue-400">Total Admin Cabang</p>
            <h3 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
              {loading ? '...' : `${stats.adminCabang} User`}
            </h3>
            <Link href="/admin/super-admin/daftaruser/admincabang" className="text-[11px] text-[#142B4D] dark:text-blue-400 font-bold inline-flex items-center gap-1 pt-1 transition-opacity duration-200 hover:opacity-75">
              Kelola Admin Cabang 
              <ArrowRight className="w-3 h-3 transform transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
            </Link>
          </div>
          <div className="bg-slate-50 dark:bg-[#1A2647] p-3.5 rounded-xl transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_8px_20px_-6px_rgba(20,43,77,0.3)]">
            <img 
              src="/icons/icon-perorangan.svg" 
              alt="Icon Perorangan" 
              className="w-7 h-7 object-contain dark:invert transition-all duration-300 ease-out group-hover:invert-0 group-hover:brightness-120"
            />
          </div>
        </div>

        {/* === CARD: TOTAL TIM ASSESSOR === */}
        <div className="bg-white dark:bg-[#111C34] p-5 rounded-2xl border border-gray-100 dark:border-gray-800/40 border-t-4 border-t-[#FE9A00] flex items-center justify-between shadow-xs hover:shadow-[0_20px_40px_-15px_rgba(254,154,0,0.2)] dark:hover:shadow-[0_20px_45px_-10px_rgba(254,154,0,0.35)] hover:border-[#FE9A00]/30 dark:hover:border-[#FE9A00]/50 hover:-translate-y-1.5 transition-all duration-300 ease-out group cursor-pointer">
          <div className="space-y-1.5">
            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider transition-colors duration-300 group-hover:text-[#FE9A00]">Total Tim Assessor</p>
            <h3 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
              {loading ? '...' : `${stats.assessor} User`}
            </h3>
            <Link href="/admin/super-admin/daftaruser/assessor" className="text-[11px] text-[#FE9A00] font-bold inline-flex items-center gap-1 pt-1 transition-opacity duration-200 hover:opacity-75">
              Kelola Tim Penilai 
              <ArrowRight className="w-3 h-3 transform transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
            </Link>
          </div>
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-xl transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_8px_20px_-6px_rgba(254,154,0,0.4)]">
            <img 
              src="/icons/icon-law.svg" 
              alt="Icon Law" 
              className="w-7 h-7 object-contain dark:invert transition-all duration-300 ease-out group-hover:invert-0 group-hover:brightness-120"
            />
          </div>
        </div>

        {/* === CARD: TOTAL PENGAJUAN ULOK === */}
        <div className="bg-white dark:bg-[#111C34] p-5 rounded-2xl border border-gray-100 dark:border-gray-800/40 border-t-4 border-t-[#D11A22] flex items-center justify-between shadow-xs hover:shadow-[0_20px_40px_-15px_rgba(209,26,34,0.18)] dark:hover:shadow-[0_20px_45px_-10px_rgba(209,26,34,0.35)] hover:border-[#D11A22]/30 dark:hover:border-[#D11A22]/50 hover:-translate-y-1.5 transition-all duration-300 ease-out group cursor-pointer">
          <div className="space-y-1.5">
            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider transition-colors duration-300 group-hover:text-[#D11A22]">Total Pengajuan ULOK</p>
            <h3 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
              {loading ? '...' : `${stats.totalUlok} Berkas`}
            </h3>
            <span className="text-[11px] text-gray-400 dark:text-slate-500 block pt-1 font-bold tracking-wide transition-colors duration-300 group-hover:text-[#D11A22]">
              Terintegrasi Pusat
            </span>
          </div>
          <div className="bg-red-50/50 dark:bg-red-950/20 p-3.5 rounded-xl transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_8px_20px_-6px_rgba(209,26,34,0.4)]">
            <img 
              src="/icons/icon-file.svg" 
              alt="Icon File" 
              className="w-7 h-7 object-contain dark:invert transition-all duration-300 ease-out group-hover:invert-0 group-hover:brightness-120"
            />
          </div>
        </div>

      </div>

      {/* === PANEL GRAFIK === */}
      <div className="bg-white dark:bg-[#111C34] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800/40 transition-all duration-300 hover:shadow-lg">
        <div className="border-b border-gray-100 dark:border-gray-800/60 pb-4 mb-4">
          <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2 group cursor-default">
            <TrendingUp className="w-5 h-5 text-[#142B4D] dark:text-blue-400 transition-transform duration-300 group-hover:scale-115 group-hover:-translate-y-0.5" />
            Proporsi Data Dashboard Super Admin
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Visualisasi perbandingan volume user aktif dan dokumen usulan masuk</p>
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
                  paddingAngle={5}
                  dataKey="value"
                >
                  {displayChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="outline-none stroke-white dark:stroke-[#111C34] stroke-2" />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-2">
            <h4 className="text-xs font-extrabold uppercase text-gray-400 dark:text-gray-500 tracking-wider mb-2">Legenda Parameter</h4>
            {displayChartData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold py-1.5 border-b border-gray-50 dark:border-gray-800/30">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-700 dark:text-gray-300">{entry.name}</span>
                </div>
                <span className="text-gray-900 dark:text-white font-extrabold">
                  {loading ? '...' : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === LAYOUT BAWAH === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* === KOLOM LOG AKTIVITAS === */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111C34] rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg">
          <div className="bg-[#142B4D] dark:bg-[#16223F] p-4 text-white flex items-center justify-between border-b dark:border-gray-800/40">
            <h3 className="font-bold text-sm md:text-base flex items-center gap-2">
              <img 
                src="/icons/icon-notification.svg" 
                alt="Notification Icon" 
                className="w-4 h-4 object-contain brightness-0 invert tracking-wide" 
              />
              Recent Activity (Log Sistem Global)
            </h3>
            <span className="text-[10px] bg-[#FE9A00] text-[#142B4D] font-black px-2.5 py-0.5 rounded-full tracking-wide uppercase shadow-xs">
              Real-time
            </span>
          </div>

          <div className="p-5 flex-1 divide-y divide-gray-100 dark:divide-gray-800/30 overflow-y-auto max-h-87.5">
            {loading ? (
              <div className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">Memuat log aktivitas...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">Tidak ada aktivitas terdeteksi dari Cabang maupun Assessor.</div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={notif.id || idx} className="py-3 first:pt-0 last:pb-0 flex gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition duration-200 px-2 rounded-xl group">
                  <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-[#FE9A00] transition-transform duration-200 group-hover:scale-125" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors duration-200">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold shrink-0">
                        {notif.created_at ? new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* === KOLOM QUICK ACTIONS === */}
        <div className="bg-[#142B4D] dark:bg-[#111C34] text-white p-6 rounded-2xl shadow-md border border-transparent dark:border-gray-800/40 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-[#142B4D]/10 dark:hover:shadow-black/30 group">
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
              <Link href="/admin/super-admin/daftaruser/admincabang" className="bg-[#FE9A00] hover:bg-[#e08900] text-[#142B4D] px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 active:scale-95 shadow-sm">
                Data Cabang
              </Link>
              <Link href="/admin/super-admin/profile" className="bg-white/10 dark:bg-[#1A2647] hover:bg-white/20 dark:hover:bg-[#23335e] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 border border-white/5 dark:border-transparent">
                Profil Saya
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}