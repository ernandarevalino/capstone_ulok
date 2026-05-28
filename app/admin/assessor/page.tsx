'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAssessorSubmissions } from '@/actions/assessor';
import { 
  Inbox, 
  CheckCircle, 
  FileClock, 
  AlertCircle, 
  ArrowRight, 
  BarChart4, 
  Calendar,
  Layers,
  User,
  Briefcase
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell 
} from 'recharts';

export default function AssessorDashboardPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      const res = await getAssessorSubmissions();
      if (res.success && res.data) {
        setSubmissions(res.data);
      } else {
        console.error("Gagal memuat data usulan untuk assessor:", res.error);
      }
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  // Classify submissions helper
  const peroranganTypes = ['Perorangan', 'Waris', 'Hibah', 'Kuasa'];

  // Status mapping
  // Antrean Berkas Baru (In Review)
  const pendingCount = submissions.filter(s => s.status === 'In Review').length;
  // Selesai Dinilai (Approved, Rejected)
  const completedCount = submissions.filter(s => s.status === 'Approved' || s.status === 'Rejected').length;
  // Menunggu Revisi Cabang (Revision)
  const revisionCount = submissions.filter(s => s.status === 'Revision').length;

  // Chart data: Badan Hukum vs Perorangan
  const peroranganCount = submissions.filter(s => peroranganTypes.includes(s.jenis_badan_hukum)).length;
  const badanHukumCount = submissions.filter(s => !peroranganTypes.includes(s.jenis_badan_hukum)).length;

  const barChartData = [
    { name: 'Badan Hukum', jumlah: badanHukumCount, color: '#1E3A8A' }, // Navy
    { name: 'Perorangan', jumlah: peroranganCount, color: '#0F172A' }  // Slate Dark
  ];

  // Urgent To-Do List: 5 oldest pending submissions (In Review), order by created_at asc
  const urgentSubmissions = [...submissions]
    .filter(s => s.status === 'In Review')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5);

  const handleNavigateToPenilaian = (item: any) => {
    const isPerorangan = peroranganTypes.includes(item.jenis_badan_hukum);
    const targetRoute = isPerorangan 
      ? `/admin/assessor/penilaian/ulok-perorangan` 
      : `/admin/assessor/penilaian/ulok-badanhukum`;
    router.push(`${targetRoute}?id=${item.id}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 md:p-4">
      {/* WELCOME ASSESSOR BANNER */}
      <div className="bg-[#142B4D] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
          <CheckCircle className="w-64 h-64 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight relative z-10">
          Dashboard Penilaian Assessor
        </h1>
        <p className="text-blue-200 text-xs md:text-sm mt-1 max-w-xl relative z-10">
          Gunakan panel ini untuk mengamati antrean berkas yang baru masuk, memeriksa kelengkapan usulan, dan segera memberikan penilaian objektif dengan metode SAW.
        </p>
      </div>

      {/* 3 SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Antrean Berkas Baru (Amber/Kuning) */}
        <div className="bg-white p-5 rounded-2xl border-t-4 border-amber-500 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-amber-600 text-xs font-bold uppercase tracking-wider">Antrean Berkas Baru</p>
            <h3 className="text-3xl font-black text-amber-600 mt-1">{loading ? '...' : pendingCount}</h3>
            <span className="text-[11px] text-gray-400 font-medium">Status In Review / Pending</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl">
            <Inbox className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        {/* Card 2: Selesai Dinilai (Emerald/Hijau) */}
        <div className="bg-white p-5 rounded-2xl border-t-4 border-emerald-500 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Selesai Dinilai</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{loading ? '...' : completedCount}</h3>
            <span className="text-[11px] text-emerald-500 font-medium">Approved / Rejected</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Card 3: Menunggu Revisi Cabang (Navy/Slate) */}
        <div className="bg-white p-5 rounded-2xl border-t-4 border-[#142B4D] shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-blue-950 text-xs font-bold uppercase tracking-wider">Menunggu Revisi</p>
            <h3 className="text-3xl font-black text-[#142B4D] mt-1">{loading ? '...' : revisionCount}</h3>
            <span className="text-[11px] text-gray-500 font-medium">Status Revision</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl">
            <FileClock className="w-6 h-6 text-[#142B4D]" />
          </div>
        </div>
      </div>

      {/* BAR CHART SECTION */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 pb-4 mb-4">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <BarChart4 className="w-5 h-5 text-[#142B4D]" />
            Perbandingan Pengajuan: Badan Hukum vs Perorangan
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Jumlah usulan lokasi berdasarkan klasifikasi pemegang hak</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} fontWeight="bold" />
              <YAxis stroke="#94A3B8" fontSize={11} fontWeight="bold" allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{ borderRadius: '12px', borderColor: '#E2E8F0' }}
              />
              <Bar dataKey="jumlah" radius={[10, 10, 0, 0]} barSize={50}>
                {barChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* URGENT TO-DO LIST */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#142B4D] p-4 text-white flex items-center justify-between">
          <h3 className="font-bold text-sm md:text-base flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            Urgent To-Do List (Antrean Terlama)
          </h3>
          <span className="text-[10px] bg-red-600 text-red-50 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            Sangat Penting
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">Loading antrean berkas...</div>
          ) : urgentSubmissions.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400 flex flex-col items-center justify-center gap-2">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              <span>Yayy! Semua berkas pengajuan telah selesai dinilai!</span>
            </div>
          ) : (
            urgentSubmissions.map((item, idx) => {
              const isPerorangan = peroranganTypes.includes(item.jenis_badan_hukum);
              const branchName = item.profiles?.branches?.nama_cabang || "Cabang Tidak Diketahui";
              const adminName = item.profiles?.full_name || "Admin Cabang";
              const dateStr = new Date(item.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });

              return (
                <div key={item.id || idx} className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📁</span>
                      <h4 className="font-bold text-sm text-gray-800">{item.nama_lokasi}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        isPerorangan ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' : 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                      }`}>
                        {isPerorangan ? <User className="w-2.5 h-2.5" /> : <Briefcase className="w-2.5 h-2.5" />}
                        {item.jenis_badan_hukum}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <span className="text-gray-400">📍</span> {branchName} ({adminName})
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> Diajukan: {dateStr}
                      </span>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => handleNavigateToPenilaian(item)}
                      className="w-full sm:w-auto bg-[#142B4D] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-900 transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      Mulai Nilai
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
