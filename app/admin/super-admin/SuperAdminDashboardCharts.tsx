'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ─── Dummy Data ───────────────────────────────────────────────────────────────
const PIPELINE_DATA = [
  { name: 'Toko Baru',    inReview: 12, approved: 8, revisi: 4, rejected: 2 },
  { name: 'Perpanjangan', inReview: 6,  approved: 9, revisi: 2, rejected: 1 },
];

const TREND_DATA = [
  { day: 'Sen', userLogin: 14, ulokBaru: 3 },
  { day: 'Sel', userLogin: 18, ulokBaru: 5 },
  { day: 'Rab', userLogin: 12, ulokBaru: 2 },
  { day: 'Kam', userLogin: 21, ulokBaru: 6 },
  { day: 'Jum', userLogin: 19, ulokBaru: 4 },
  { day: 'Sab', userLogin: 8,  ulokBaru: 1 },
  { day: 'Min', userLogin: 5,  ulokBaru: 0 },
];

const TOP_CABANG = [
  { nama: 'Jakarta Selatan', total: 14, aktif: true  },
  { nama: 'Jakarta Pusat',   total: 11, aktif: true  },
  { nama: 'Jakarta Barat',   total:  9, aktif: true  },
  { nama: 'Depok',           total:  7, aktif: true  },
  { nama: 'Jakarta Utara',   total:  5, aktif: false },
];

// Proporsi data for pie chart — matches reference (Admin Cabang 18, Assessor 14, ULOK 150)
interface ProporsiItem {
  name: string;
  value: number;
  color: string;
}
const PROPORSI_DATA: ProporsiItem[] = [
  { name: 'Admin Cabang (User)', value: 18,  color: '#142B4D' },
  { name: 'Tim Assessor (User)', value: 14,  color: '#F28705' },
  { name: 'Total Berkas ULOK',   value: 150, color: '#D91E2E' },
];

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-black text-gray-700 dark:text-slate-200 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.fill ?? p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-black text-gray-700 dark:text-slate-200 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.stroke }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-gray-700 dark:text-slate-200">{item.name}</p>
      <p className="font-black text-base" style={{ color: item.payload.color }}>{item.value}</p>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SuperAdminDashboardCharts() {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── Row 1: Trend Line + Proporsi Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Line Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-0.5">
            Tren Aktivitas (7 Hari)
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">
            User Login vs ULOK Baru
          </p>
          <ResponsiveContainer width="100%" height={200} debounce={200}>
            <LineChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 700, fill: 'rgb(100 116 139)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgb(148 163 184)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomLineTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: '12px' }} />
              <Line type="monotone" dataKey="userLogin" name="User Login" stroke="#142B4D" strokeWidth={2.5} dot={{ r: 4, fill: '#142B4D', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="ulokBaru" name="ULOK Baru" stroke="#F28705" strokeWidth={2.5} dot={{ r: 4, fill: '#F28705', strokeWidth: 0 }} activeDot={{ r: 6 }} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — Proporsi Dashboard */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-0.5">
            Proporsi Data
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">
            Proporsi Data Dashboard Super Admin
          </p>
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <ResponsiveContainer width={160} height={160} debounce={200}>
                <PieChart>
                  <Pie
                    data={PROPORSI_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {PROPORSI_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                Legenda Parameter
              </p>
              {PROPORSI_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600 dark:text-slate-300 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-gray-800 dark:text-slate-100 tabular-nums shrink-0" style={{ color: item.color }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Pipeline Bar + Top Cabang ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Stacked Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-0.5">
            Pipeline ULOK
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">
            Toko Baru vs Perpanjangan
          </p>
          <ResponsiveContainer width="100%" height={200} debounce={200}>
            <BarChart data={PIPELINE_DATA} barSize={52}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: 'rgb(100 116 139)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgb(148 163 184)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(100,116,139,0.06)' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: '12px' }} />
              <Bar dataKey="approved" name="Approved"  stackId="a" fill="#142B4D" radius={[0,0,0,0]} />
              <Bar dataKey="inReview" name="In Review" stackId="a" fill="#F28705" />
              <Bar dataKey="rejected" name="Rejected"  stackId="a" fill="#D91E2E" />
              <Bar dataKey="revisi"   name="Revisi"    stackId="a" fill="#FE9A00" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 Cabang */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-0.5">
            Peringkat Cabang
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">
            Top 5 Cabang Aktif
          </p>
          <div className="flex flex-col gap-3">
            {TOP_CABANG.map((cb, idx) => (
              <div key={cb.nama} className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                    idx === 0
                      ? 'bg-[#F28705] text-white'
                      : idx === 1
                      ? 'bg-[#142B4D] dark:bg-blue-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-gray-800 dark:text-slate-100 truncate">{cb.nama}</p>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 tabular-nums shrink-0 ml-2">
                      {cb.total} berkas
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#142B4D] dark:bg-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${(cb.total / 14) * 100}%` }}
                    />
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    cb.aktif
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}
                >
                  {cb.aktif ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}