'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileEdit,
  MousePointerClick,
  Calendar as CalendarIcon,
  ListFilter,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export type UlokStatus = 'Draft' | 'In Review' | 'Revisi' | 'Approved' | 'Rejected';

export interface SubmissionItem {
  id: string;
  nama_lokasi?: string;
  toko_name?: string;
  status: UlokStatus | string;
  final_score?: number | null;
  created_at?: string;
  updated_at?: string;
  kategori_usulan?: string;
  jenis_usulan?: string;
  jenis_badan_hukum?: string;
  [key: string]: any;
}

interface ActivityCalendarCabangProps {
  submissions?: SubmissionItem[];
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; dot: string; icon: React.ReactNode; label: string }
> = {
  Draft: {
    color: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-500',
    icon: <FileEdit className="w-3 h-3" />,
    label: 'Draf Tersimpan',
  },
  'In Review': {
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50',
    dot: 'bg-[#FE9A00]',
    icon: <Clock className="w-3 h-3" />,
    label: 'Dalam Review',
  },
  Revisi: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50',
    dot: 'bg-[#D11A22]',
    icon: <AlertTriangle className="w-3 h-3" />,
    label: 'Butuh Revisi',
  },
  Approved: {
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50',
    dot: 'bg-[#10B981]',
    icon: <CheckCircle2 className="w-3 h-3" />,
    label: 'Approved (Selesai)',
  },
  Rejected: {
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-700',
    icon: <XCircle className="w-3 h-3" />,
    label: 'Ditolak',
  },
};

export function getFormRoute(jenisBadanHukum?: string, id?: string) {
  const kelompokPerorangan = ['Perorangan', 'Waris', 'Hibah', 'Kuasa'];
  const isPerorangan = jenisBadanHukum && kelompokPerorangan.includes(jenisBadanHukum);
  const basePath = isPerorangan
    ? '/admin/cabang/usulan-lokasi/form/perorangan'
    : '/admin/cabang/usulan-lokasi/form/badanhukum';
  return id ? `${basePath}?id=${id}` : basePath;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function ActivityCalendarCabang({ submissions = [] }: ActivityCalendarCabangProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [activeView, setActiveView] = useState<'calendar' | 'list'>('calendar');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Group submissions by YYYY-MM-DD based on created_at or updated_at
  const eventsByDate = useMemo(() => {
    const map: Record<string, SubmissionItem[]> = {};

    submissions.forEach((item) => {
      const dateStr = item.updated_at || item.created_at;
      if (!dateStr) return;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
        if (!map[key]) {
          map[key] = [];
        }
        map[key].push(item);
      } catch {
        // ignore invalid dates
      }
    });

    return map;
  }, [submissions]);

  // Determine days grid for the current viewMonth and viewYear
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);

  const cells = useMemo(() => {
    const list: { day: number; isCurrentMonth: boolean; month: number; year: number; dateKey: string }[] = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      list.push({ day: dayNum, isCurrentMonth: false, month: m, year: y, dateKey: key });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      list.push({ day: d, isCurrentMonth: true, month: viewMonth, year: viewYear, dateKey: key });
    }

    // Next month padding to fill grid
    const targetLength = list.length > 35 ? 42 : 35;
    let nextDay = 1;
    while (list.length < targetLength) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
      list.push({ day: nextDay++, isCurrentMonth: false, month: m, year: y, dateKey: key });
    }

    return list;
  }, [daysInMonth, firstDay, prevMonthDays, viewMonth, viewYear]);

  // Navigation handlers
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
    if (eventsByDate[todayKey]) {
      setSelectedDateKey(todayKey);
    }
  };

  // Find latest date key with events if user wants quick jump
  const latestEventDateKey = useMemo(() => {
    const keys = Object.keys(eventsByDate).sort().reverse();
    return keys.length > 0 ? keys[0] : null;
  }, [eventsByDate]);

  const handleJumpToLatest = () => {
    if (latestEventDateKey) {
      const [y, m] = latestEventDateKey.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      setSelectedDateKey(latestEventDateKey);
    }
  };

  const selectedSubmissions = selectedDateKey ? eventsByDate[selectedDateKey] || [] : [];

  const formatSelectedDateLabel = (keyStr: string) => {
    const [y, m, d] = keyStr.split('-').map(Number);
    return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between h-full transition-colors duration-300">
      {/* ── HEADER BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-gray-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#142B4D] dark:text-blue-400 shrink-0" />
          <h3 className="font-bold text-sm text-gray-800 dark:text-slate-100">
            Kalender Aktivitas ULOK
          </h3>
        </div>

        {/* Status Legend Dots */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-gray-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Draf
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FE9A00]" />
            Dalam Review
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D11A22]" />
            Revisi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            Approved
          </span>
        </div>
      </div>

      {/* ── CALENDAR CONTROLS BAR ── */}
      <div className="px-4 sm:px-5 pt-3 pb-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Bulan Sebelumnya"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Bulan Berikutnya"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-xs"
          >
            Hari Ini
          </button>
        </div>

        <h4 className="text-base sm:text-lg font-black text-gray-800 dark:text-slate-100 tracking-tight">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h4>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              activeView === 'calendar'
                ? 'bg-[#142B4D] text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              activeView === 'list'
                ? 'bg-[#142B4D] text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Semua Berkas ({submissions.length})</span>
          </button>
        </div>
      </div>

      {/* ── BODY CONTENT ── */}
      {activeView === 'calendar' ? (
        <div className="p-4 sm:p-5 pt-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 flex-1 min-h-0 items-stretch">
          {/* LEFT SIDE (Calendar Grid - 2 Cols) */}
          <div className="lg:col-span-2 flex flex-col justify-between min-h-[300px]">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1 shrink-0">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1">
              {cells.map((cell, idx) => {
                const dayEvents = eventsByDate[cell.dateKey] || [];
                const hasEvents = dayEvents.length > 0;
                const isSelected = selectedDateKey === cell.dateKey;
                const isTodayFlag =
                  cell.isCurrentMonth &&
                  cell.day === today.getDate() &&
                  cell.month === today.getMonth() &&
                  cell.year === today.getFullYear();

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (hasEvents) {
                        setSelectedDateKey(cell.dateKey);
                      }
                    }}
                    className={`
                      relative p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between transition-all duration-200 min-h-[46px] sm:min-h-[52px] select-none
                      ${
                        !cell.isCurrentMonth
                          ? 'bg-slate-50/40 dark:bg-slate-900/30 border-gray-100 dark:border-slate-800/30 opacity-30'
                          : isSelected
                          ? 'bg-blue-50/90 dark:bg-blue-950/50 border-[#142B4D] dark:border-blue-500 ring-2 ring-[#142B4D]/30 shadow-xs'
                          : isTodayFlag
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600/50'
                          : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }
                      ${hasEvents ? 'cursor-pointer hover:shadow-xs hover:-translate-y-0.5' : ''}
                    `}
                  >
                    {/* Top Row: Date Number */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] sm:text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full tabular-nums ${
                          isTodayFlag
                            ? 'bg-[#142B4D] text-white font-black shadow-xs'
                            : !cell.isCurrentMonth
                            ? 'text-gray-400 dark:text-slate-600'
                            : 'text-gray-700 dark:text-slate-200'
                        }`}
                      >
                        {cell.day}
                      </span>

                      {dayEvents.length > 1 && (
                        <span className="text-[9px] font-extrabold px-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          +{dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Status Indicator Dots / Mini Badges */}
                    {hasEvents && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {dayEvents.slice(0, 3).map((item, i) => {
                          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['Draft'];
                          return (
                            <span
                              key={item.id || i}
                              className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}
                              title={`${item.nama_lokasi || 'ULOK'} (${item.status})`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE (Detail Panel - 1 Col) */}
          <div className="lg:col-span-1 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3.5 sm:p-4 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[260px]">
            {selectedDateKey && selectedSubmissions.length > 0 ? (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60 shrink-0">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Detail Aktivitas ULOK
                    </p>
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {formatSelectedDateLabel(selectedDateKey)}
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold text-[#142B4D] dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    {selectedSubmissions.length} Berkas
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1 flex-1">
                  {selectedSubmissions.map((item) => {
                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['Draft'];
                    const namaLokasi = item.nama_lokasi || item.toko_name || 'Lokasi Usulan';
                    const kategori =
                      item.kategori_usulan ||
                      item.jenis_usulan ||
                      (item.jenis_badan_hukum ? `Toko Baru (${item.jenis_badan_hukum})` : 'Toko Baru');
                    const skor = item.final_score !== null && item.final_score !== undefined
                      ? Number(item.final_score).toFixed(2)
                      : '0.00';

                    const detailRoute = getFormRoute(item.jenis_badan_hukum, item.id);

                    return (
                      <Link
                        key={item.id}
                        href={detailRoute}
                        className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2 hover:border-[#142B4D]/50 dark:hover:border-blue-400/50 hover:shadow-xs transition-all block group cursor-pointer"
                        title="Klik untuk membuka detail form ULOK"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors truncate flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#142B4D] dark:text-blue-400 shrink-0" />
                              <span className="truncate">{namaLokasi}</span>
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                              {kategori}
                            </span>
                          </div>

                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}
                            <span>{item.status === 'Draft' ? 'Draf' : item.status}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-400 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors">
                            <span className="font-semibold text-[10px]">Buka Detail</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                          <span className="font-black text-[#142B4D] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                            SAW: {skor}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#142B4D] dark:text-blue-400 flex items-center justify-center">
                  <MousePointerClick className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pilih tanggal bersimbol
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-[200px]">
                    Klik tanggal yang memiliki titik indikator warna di kalender untuk melihat detail aktivitas ULOK.
                  </p>
                </div>

                {latestEventDateKey && (
                  <button
                    onClick={handleJumpToLatest}
                    className="mt-2 text-[11px] font-bold text-[#142B4D] dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Lihat Aktivitas Terakhir</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── LIST VIEW (Daftar Semua Berkas) ── */
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[360px]">
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 italic">
              Belum ada berkas usulan lokasi yang terdaftar.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {submissions.map((sub, idx) => {
                const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG['Draft'];
                const nama = sub.nama_lokasi || sub.toko_name || 'Lokasi Usulan';
                const kat =
                  sub.kategori_usulan ||
                  sub.jenis_usulan ||
                  (sub.jenis_badan_hukum ? `Toko Baru (${sub.jenis_badan_hukum})` : 'Toko Baru');
                const skor = sub.final_score ? Number(sub.final_score).toFixed(2) : '0.00';
                const detailRoute = getFormRoute(sub.jenis_badan_hukum, sub.id);

                return (
                  <Link
                    key={sub.id || idx}
                    href={detailRoute}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 hover:border-[#142B4D]/50 dark:hover:border-blue-400/50 hover:shadow-xs transition-all block group cursor-pointer"
                    title="Klik untuk membuka detail form ULOK"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors truncate">{nama}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{kat}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                        <span>{sub.status === 'Draft' ? 'Draf' : sub.status}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center gap-1 text-slate-400 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors">
                        <span className="font-semibold text-[10px]">Buka Detail</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                      <span className="font-black text-[#142B4D] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                        SAW: {skor}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
