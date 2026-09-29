'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCabangProfile } from '@/context/CabangProfileContext';
import { getUlokSubmissions, getNotificationsAction } from '@/actions/cabang';
import { calculateULOKSAW } from '@/actions/saw';
import type { SelectedCellInfo } from '@/components/cabang/ActivityHeatmapCabang';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  BarChart3,
  Bell,
  TrendingUp,
  Timer,
  TriangleAlert,
  BadgeCheck,
} from 'lucide-react';

// ── DYNAMIC IMPORTS ────────────────────────────────────────────────────────────
const ActivityHeatmapCabang = dynamic(
  () => import('@/components/cabang/ActivityHeatmapCabang'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs h-full min-h-[420px] animate-pulse" />
    ),
  }
);

const TopUlokProgressList = dynamic(
  () => import('@/components/cabang/TopUlokProgressList'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs h-full min-h-[420px] animate-pulse" />
    ),
  }
);

// ── KPI CARD ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trendIcon: React.ReactNode;
  trendText: string;
  trendType: 'success' | 'warning' | 'danger' | 'info';
  subLabel?: string;
  href?: string;
}

function KpiCard({
  title,
  value,
  icon,
  trendIcon,
  trendText,
  trendType,
  subLabel = 'vs bulan lalu',
  href,
}: KpiCardProps) {
  let badgeColor =
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  if (trendType === 'warning')
    badgeColor =
      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
  else if (trendType === 'danger')
    badgeColor =
      'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800';
  else if (trendType === 'info')
    badgeColor =
      'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800';

  const inner = (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between space-y-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            {icon}
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-tight truncate max-w-[130px]">
            {title}
          </span>
        </div>
        <MoreHorizontal className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
      </div>

      <div>
        <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {value}
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${badgeColor}`}
        >
          {trendIcon}
          {trendText}
        </span>
        <span className="text-[11px] font-semibold text-slate-400 truncate">
          {subLabel}
        </span>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function AdminCabangPage() {
  const profile = useCabangProfile();
  const fullName = profile?.full_name || 'Admin Cabang';

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Heatmap ↔ detail panel shared state
  const [selectedCell, setSelectedCell] = useState<SelectedCellInfo | null>(null);
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);

  const handleCellSelect = useCallback(
    (info: SelectedCellInfo | null) => {
      setSelectedCell(info);
      // Derive a stable key for highlighting — use label+sublabel as proxy
      setSelectedCellKey(info ? `${info.label}-${info.sublabel}` : null);
    },
    []
  );

  useEffect(() => {
    async function initDashboard() {
      setLoading(true);
      try {
        const [submissionsRes, notificationsRes] = await Promise.all([
          getUlokSubmissions(),
          getNotificationsAction(),
        ]);

        if (submissionsRes?.success && submissionsRes.data) {
          setSubmissions(submissionsRes.data);

          const uncalculated = submissionsRes.data.filter(
            (s: any) => s.status !== 'Draft' && (s.final_score === 0 || s.final_score === null)
          );
          if (uncalculated.length > 0) {
            Promise.all(uncalculated.map((s: any) => calculateULOKSAW(s.id)))
              .then(() =>
                getUlokSubmissions().then((u) => {
                  if (u?.success && u.data) setSubmissions(u.data);
                })
              )
              .catch((err) =>
                console.error('Gagal kalkulasi background SAW:', err)
              );
          }
        }

        if (notificationsRes?.success && notificationsRes.data) {
          setNotifications(notificationsRes.data.slice(0, 7));
        }
      } catch (err) {
        console.error('Gagal inisialisasi dashboard admin cabang:', err);
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, []);

  const totalSubmissions = submissions.length;
  const inReviewCount = submissions.filter((s) => s.status === 'In Review').length;
  const revisionCount = submissions.filter((s) => s.status === 'Revisi').length;
  const approvedCount = submissions.filter((s) => s.status === 'Approved').length;

  // ── SKELETON ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full min-h-full space-y-5 text-gray-800 dark:text-slate-100 transition-colors duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 h-[130px] animate-pulse space-y-3"
            >
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-8 w-16 bg-slate-300 dark:bg-slate-700 rounded" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 h-[420px] animate-pulse" />
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 h-[420px] animate-pulse" />
        </div>
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-full space-y-5 text-gray-800 dark:text-slate-100 transition-colors duration-300">

      {/* ══ HEADER BAR ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#142B4D] dark:text-blue-400" />
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Dashboard Command Center
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Selamat datang,{' '}
          <strong className="text-[#142B4D] dark:text-blue-400">{fullName}</strong>
        </span>
      </div>

      {/* ══ ROW 1: 4 KPI CARDS ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Usulan ULOK"
          value={totalSubmissions}
          icon={<FileText className="w-4.5 h-4.5 text-[#142B4D] dark:text-blue-400" />}
          trendIcon={<TrendingUp className="w-3 h-3" />}
          trendText="+15%"
          trendType="success"
          subLabel="vs bulan lalu"
          href="/admin/cabang/usulan-lokasi"
        />
        <KpiCard
          title="Dalam Review"
          value={inReviewCount}
          icon={<Clock className="w-4.5 h-4.5 text-[#F28705]" />}
          trendIcon={<Timer className="w-3 h-3" />}
          trendText="Active Review"
          trendType="warning"
          subLabel="evaluasi assessor"
        />
        <KpiCard
          title="Butuh Revisi"
          value={revisionCount}
          icon={<AlertTriangle className="w-4.5 h-4.5 text-[#D91E2E]" />}
          trendIcon={<TriangleAlert className="w-3 h-3" />}
          trendText="Action Needed"
          trendType="danger"
          subLabel="perbaikan berkas"
        />
        <KpiCard
          title="Approved & Selesai"
          value={approvedCount}
          icon={<CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />}
          trendIcon={<BadgeCheck className="w-3 h-3" />}
          trendText="Validated"
          trendType="success"
          subLabel="usulan disetujui"
        />
      </div>

      {/* ══ ROW 2: ACTIVITY HEATMAP (left 2-col) + DETAIL PANEL (right 1-col) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* LEFT: Activity Heatmap */}
        <div className="lg:col-span-2 min-h-[420px]">
          <ActivityHeatmapCabang
            submissions={submissions}
            onCellSelect={handleCellSelect}
            selectedCellKey={selectedCellKey}
          />
        </div>

        {/* RIGHT: Detail Panel (driven by selected cell) */}
        <div className="lg:col-span-1 min-h-[420px]">
          <TopUlokProgressList
            selectedCell={selectedCell}
            submissions={submissions}
          />
        </div>
      </div>

      {/* ══ ROW 3: RECENT ACTIVITY LOG ════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-[#142B4D] dark:bg-slate-950 px-5 py-3.5 flex items-center justify-between gap-2">
          <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#F28705]" />
            Recent Activity Log
          </h3>
          <span className="text-[10px] bg-white/10 text-blue-200 font-bold px-2 py-0.5 rounded-full animate-pulse">
            Real-time
          </span>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 italic">
              Tidak ada notifikasi aktivitas terbaru.
            </div>
          ) : (
            notifications.map((notif, idx) => (
              <div
                key={notif.id || idx}
                className="flex gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
              >
                <div className="mt-2 shrink-0 w-2 h-2 rounded-full bg-[#F28705] group-hover:scale-125 transition-transform" />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold shrink-0">
                      {notif.created_at
                        ? new Date(notif.created_at).toLocaleDateString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-1">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}