'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getDashboardStatsAction } from '@/actions/superadmin';
import Link from 'next/link';
import {
  Users,
  FileText,
  Building2,
  Trash2,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

// ─── Dynamic Imports ──────────────────────────────────────────────────────────
const ActivityCalendar = dynamic(
  () => import('@/components/superadmin/ActivityCalendar'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm h-full min-h-[340px] animate-pulse" />
    ),
  }
);

const SuperAdminDashboardCharts = dynamic(
  () => import('./SuperAdminDashboardCharts'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map(j => (
              <div key={j} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 h-64 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    ),
  }
);

const RecentActivity = dynamic(
  () => import('./RecentActivity'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm min-h-[450px] animate-pulse" />
    ),
  }
);

// ─── Metric Card (vertical stack — left border accent) ───────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accentColor: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  href?: string;
}

function MetricCard({ label, value, sub, icon, accentColor, iconBg, iconColor, valueColor, href }: MetricCardProps) {
  const inner = (
    <div
      className="group bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] cursor-pointer h-full"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="space-y-0.5 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          {label}
        </p>
        <p
          className="text-2xl sm:text-3xl font-black tracking-tight"
          style={{ color: valueColor ?? undefined }}
        >
          {value}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500 font-semibold">{sub}</p>
      </div>
      <div
        className={`${iconBg} p-2.5 sm:p-3 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : <div className="h-full">{inner}</div>;
}

// ─── Stat Summary Card ────────────────────────────────────────────────────────
function StatSummaryCard({
  label, value, unit, color, loading, href,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  loading: boolean;
  href?: string | null;
}) {
  const inner = (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-3.5 sm:p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow h-full min-h-[100px]">
      <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-black" style={{ color }}>
          {loading ? '—' : value}{' '}
          <span className="text-xs font-semibold text-gray-400">{unit}</span>
        </p>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : <div className="h-full">{inner}</div>;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ adminCabang: 0, assessor: 0, totalUlok: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getDashboardStatsAction();
        if (res?.success) {
          const d = res.stats as any;
          setStats({
            adminCabang: d.adminCabang ?? 0,
            assessor: d.assessor ?? 0,
            totalUlok: d.totalUlok ?? 0,
          });
        }
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="w-full min-h-full space-y-4 sm:space-y-5 text-gray-800 dark:text-slate-100 transition-colors duration-300">

      {/* ══ HEADER: USER & ACTIVITY ══════════════════════════════════════ */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-[#142B4D] dark:text-blue-400" />
        <h2 className="text-sm font-black text-gray-700 dark:text-slate-200 uppercase tracking-wide">
          User &amp; Activity
        </h2>
      </div>

      {/* ══ 3 EQUAL COLUMNS MASTER GRID (grid-cols-1 md:grid-cols-3) ═══════════
          Benchmark layout: Row 2's 3 Stat Cards define 3 equal 33.3% columns.
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ROW 1: 4 Metric Cards (Col 1: 1 span) + Activity Calendar (Col 2 & 3: 2 spans) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {/* Col 1: 4 Metric Cards */}
        <div className="md:col-span-1 flex flex-col gap-2.5 sm:gap-3 justify-between">
          <MetricCard
            label="USER AKTIF HARI INI"
            value="18 User"
            sub="Adoption rate hari ini"
            icon={<Users className="w-5 h-5" />}
            accentColor="#142B4D"
            iconBg="bg-slate-100 dark:bg-slate-800"
            iconColor="text-gray-700 dark:text-slate-300"
            href="/admin/super-admin/daftaruser/admincabang"
          />
          <MetricCard
            label="ANTREAN IN-REVIEW"
            value="24 Berkas"
            sub="Bottleneck aktif saat ini"
            icon={<FileText className="w-5 h-5" />}
            accentColor="#F28705"
            iconBg="bg-amber-50 dark:bg-amber-900/20"
            iconColor="text-[#F28705]"
            valueColor="#F28705"
          />
          <MetricCard
            label="CABANG TERHUBUNG"
            value="11/12 Cabang"
            sub="Coverage aktif jaringan"
            icon={<Building2 className="w-5 h-5" />}
            accentColor="#10b981"
            iconBg="bg-emerald-50 dark:bg-emerald-900/20"
            iconColor="text-emerald-600 dark:text-emerald-400"
            valueColor="#10b981"
            href="/admin/super-admin/branches"
          />
          <MetricCard
            label="MENUNGGU PEMBERSIHAN"
            value="5 Item"
            sub="Di Recycle Bin sistem"
            icon={<Trash2 className="w-5 h-5" />}
            accentColor="#D91E2E"
            iconBg="bg-red-50 dark:bg-red-900/20"
            iconColor="text-[#D91E2E]"
            valueColor="#D91E2E"
            href="/admin/super-admin/recyclebin"
          />
        </div>

        {/* Col 2 & Col 3: Calendar Card (2 spans) */}
        <div className="md:col-span-2 h-full">
          <ActivityCalendar />
        </div>
      </div>

      {/* ══ ANALITIK & PERFORMA ══════════════════════════════════════ */}
      <div className="flex items-center gap-2 mt-[50px]">
        <TrendingUp className="w-4 h-4 text-[#142B4D] dark:text-blue-400" />
        <h2 className="text-sm font-black text-gray-700 dark:text-slate-200 uppercase tracking-wide">
          Analitik &amp; Performa
        </h2>
      </div>

      {/* ROW 2: 3 Stat Cards (Col 1: 1 span | Col 2: 1 span | Col 3: 1 span) ═══
          Benchmark row: 3 Cards of EXACT EQUAL WIDTH (1/3 each)!
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Col 1: TOTAL ADMIN CABANG */}
        <StatSummaryCard
          label="TOTAL ADMIN CABANG"
          value={`${stats.adminCabang}`}
          unit="User"
          color="#142B4D"
          loading={loading}
          href="/admin/super-admin/daftaruser/admincabang"
        />

        {/* Col 2: TOTAL TIM ASSESSOR */}
        <StatSummaryCard
          label="TOTAL TIM ASSESSOR"
          value={`${stats.assessor}`}
          unit="User"
          color="#F28705"
          loading={loading}
          href="/admin/super-admin/daftaruser/assessor"
        />

        {/* Col 3: TOTAL BERKAS ULOK */}
        <StatSummaryCard
          label="TOTAL BERKAS ULOK"
          value={`${stats.totalUlok}`}
          unit="Berkas"
          color="#D91E2E"
          loading={loading}
        />
      </div>


      {/* ROW 3: 2x2 Charts (Col 1 & 2: 2 spans) + Recent Activity (Col 3: 1 span) ══
          Charts block spans Col 1 & 2 (with 2 inner cols matching Col 1 & Col 2).
          Notifications panel spans Col 3 (matching Col 3 width & Total Berkas ULOK).
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {/* Col 1 & Col 2: 2x2 Charts Block (2 spans) */}
        <div className="md:col-span-2">
          <SuperAdminDashboardCharts />
        </div>

        {/* Col 3: Recent Activity (1 span, exact width of Total Berkas ULOK!) */}
        <div className="md:col-span-1 h-full">
          <RecentActivity />
        </div>
      </div>

    </div>
  );
}
