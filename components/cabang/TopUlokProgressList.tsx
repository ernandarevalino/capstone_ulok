'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  ExternalLink,
  ChevronRight,
  MousePointerClick,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  XCircle,
} from 'lucide-react';
import { getFormRoute } from './formRoute';
import type { SelectedCellInfo, SubmissionItem } from './ActivityHeatmapCabang';

// ── STATUS CONFIG ──────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
  string,
  { dot: string; badge: string; label: string; icon: React.ReactNode }
> = {
  Draft: {
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    label: 'Draft',
    icon: <FileEdit className="w-3 h-3" />,
  },
  'In Review': {
    dot: 'bg-[#F28705]',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    label: 'Review',
    icon: <Clock className="w-3 h-3" />,
  },
  Revisi: {
    dot: 'bg-[#D91E2E]',
    badge: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    label: 'Revisi',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  Approved: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    label: 'Approved',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  Rejected: {
    dot: 'bg-slate-500',
    badge: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    label: 'Rejected',
    icon: <XCircle className="w-3 h-3" />,
  },
};

interface TopUlokProgressListProps {
  /** When null → show default top-5 by score; when set → show cell's submissions */
  selectedCell?: SelectedCellInfo | null;
  /** Full submissions list — used as fallback when no cell is selected */
  submissions?: SubmissionItem[];
}

export default function TopUlokProgressList({
  selectedCell,
  submissions = [],
}: TopUlokProgressListProps) {
  // Determine what to display
  const isCellSelected = !!selectedCell;
  const displayItems: SubmissionItem[] = isCellSelected
    ? selectedCell!.items
    : [...submissions]
        .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
        .slice(0, 6);

  const panelTitle = isCellSelected
    ? selectedCell!.label
    : 'Top Usulan';

  const panelSub = isCellSelected
    ? `${selectedCell!.items.length} usulan ditemukan`
    : 'Klik sel Activity untuk filter · skor tertinggi';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-full transition-colors duration-300 overflow-hidden">

      {/* ── CARD HEADER ── */}
      <div
        className={`px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 transition-colors duration-300 ${
          isCellSelected ? 'bg-[#142B4D]/5 dark:bg-slate-800/40' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {isCellSelected ? (
                <MapPin className="w-3.5 h-3.5 text-[#142B4D] dark:text-blue-400 shrink-0" />
              ) : (
                <MousePointerClick className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {panelTitle}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-tight">
              {panelSub}
            </p>
          </div>

          {isCellSelected && (
            <span className="shrink-0 text-[10px] font-black text-[#142B4D] dark:text-blue-400 bg-[#142B4D]/10 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
              {selectedCell!.items.length}
            </span>
          )}
        </div>
      </div>

      {/* ── ITEM LIST ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-slate-50 dark:divide-slate-800/60">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <MousePointerClick className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isCellSelected ? 'Tidak ada usulan di slot ini' : 'Belum ada usulan lokasi'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {isCellSelected
                ? 'Coba klik sel lain di grid Activity'
                : 'Klik sel pada heatmap Activity untuk melihat detailnya'}
            </p>
          </div>
        ) : (
          displayItems.map((item, idx) => {
            const nama = item.nama_lokasi || item.toko_name || 'Lokasi Usulan';
            const kat =
              item.kategori_usulan ||
              item.jenis_usulan ||
              (item.jenis_badan_hukum ? `Toko Baru (${item.jenis_badan_hukum})` : 'Toko Baru');
            const route = getFormRoute(item.jenis_badan_hukum, item.id);
            const statusKey = item.status in STATUS_CFG ? item.status : 'Draft';
            const cfg = STATUS_CFG[statusKey];
            const score = item.final_score ? Number(item.final_score) : null;

            return (
              <Link
                key={item.id || idx}
                href={route}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
              >
                {/* Rank / Dot */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors truncate leading-tight">
                    {nama}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                    {kat}
                  </p>
                </div>

                {/* Right: Status badge + Score */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.badge}`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </span>
                  {score !== null && (
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 tabular-nums">
                      {score.toFixed(2)}
                    </span>
                  )}
                </div>

                <ExternalLink className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors shrink-0" />
              </Link>
            );
          })
        )}
      </div>

      {/* ── FOOTER ── */}
      {!isCellSelected && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Link
            href="/admin/cabang/usulan-lokasi"
            className="flex items-center justify-between text-xs font-bold text-[#142B4D] dark:text-blue-400 hover:underline"
          >
            <span>Lihat Semua Usulan Lokasi</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
