'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Table,
  Calendar as CalendarIcon,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type UlokStatus = 'In Review' | 'Approved' | 'Rejected' | 'Revisi';

interface UlokEvent {
  id: string;
  namaLokasi: string;
  kelengkapanDokumen: number;
  status: UlokStatus;
  cabang: string;
}

interface DayEvent {
  date: number;
  month: number;
  year: number;
  events: UlokEvent[];
}

// ─── Dummy Data (pre-populated for September 2026) ────────────────────────────
const DUMMY_EVENTS: DayEvent[] = [
  {
    date: 3, month: 8, year: 2026,
    events: [
      { id: 'ULK-001', namaLokasi: 'Alfamidi Sudirman', kelengkapanDokumen: 85, status: 'In Review', cabang: 'Jakarta Pusat' },
    ],
  },
  {
    date: 9, month: 8, year: 2026,
    events: [
      { id: 'ULK-002', namaLokasi: 'Alfamidi Gatot Subroto', kelengkapanDokumen: 100, status: 'Approved', cabang: 'Jakarta Selatan' },
      { id: 'ULK-003', namaLokasi: 'Alfamidi Kuningan', kelengkapanDokumen: 72, status: 'In Review', cabang: 'Jakarta Selatan' },
    ],
  },
  {
    date: 15, month: 8, year: 2026,
    events: [
      { id: 'ULK-004', namaLokasi: 'Alfamidi Cilandak', kelengkapanDokumen: 60, status: 'Revisi', cabang: 'Jakarta Selatan' },
    ],
  },
  {
    date: 18, month: 8, year: 2026,
    events: [
      { id: 'ULK-005', namaLokasi: 'Alfamidi Kemayoran', kelengkapanDokumen: 40, status: 'Rejected', cabang: 'Jakarta Utara' },
      { id: 'ULK-006', namaLokasi: 'Alfamidi Mangga Dua', kelengkapanDokumen: 90, status: 'Approved', cabang: 'Jakarta Utara' },
    ],
  },
  {
    date: 22, month: 8, year: 2026,
    events: [
      { id: 'ULK-007', namaLokasi: 'Alfamidi Kebon Jeruk', kelengkapanDokumen: 78, status: 'In Review', cabang: 'Jakarta Barat' },
    ],
  },
  {
    date: 26, month: 8, year: 2026,
    events: [
      { id: 'ULK-008', namaLokasi: 'Alfamidi Depok Timur', kelengkapanDokumen: 55, status: 'Revisi', cabang: 'Depok' },
    ],
  },
];

// Yearly forecast summary dummy data (matching Image 4 reference)
const FORECAST_SUMMARY_2026 = [
  { label: 'Berkas Masuk', data: [12, 14, 18, 15, 22, 19, 25, 28, 24, 0, 0, 0], color: '#142B4D' },
  { label: 'Disetujui',    data: [8,  10, 12, 11, 15, 14, 18, 20, 17, 0, 0, 0], color: '#10b981' },
  { label: 'Dalam Tinjauan', data: [3, 2,  4,  3,  5,  3,  4,  5,  4, 0, 0, 0], color: '#F28705' },
  { label: 'Perlu Revisi', data: [1,  2,  2,  1,  2,  2,  3,  3,  3, 0, 0, 0], color: '#f97316' },
  { label: 'Ditolak',      data: [0,  0,  0,  0,  0,  0,  0,  0,  0, 0, 0, 0], color: '#D91E2E' },
];

// Config for status styles
const STATUS_CONFIG: Record<UlokStatus, { color: string; bg: string; dot: string; icon: React.ReactNode; label: string }> = {
  'In Review':  { color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50',   dot: 'bg-amber-500',              icon: <Clock className="w-3 h-3" />,        label: 'Dalam Tinjauan' },
  'Approved':   { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50', dot: 'bg-[#142B4D] dark:bg-blue-400', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Disetujui'       },
  'Rejected':   { color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50',             dot: 'bg-[#D91E2E]',              icon: <XCircle className="w-3 h-3" />,       label: 'Ditolak'         },
  'Revisi':     { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700/50', dot: 'bg-[#F28705]',              icon: <AlertTriangle className="w-3 h-3" />, label: 'Perlu Revisi'    },
};

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTH_SHORT = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGU','SEP','OKT','NOV','DES'];
const DAY_NAMES   = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function KelengkapanBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tabular-nums w-7 text-right">{pct}%</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ActivityCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [activeTab, setActiveTab] = useState<'calendar' | 'forecast'>('calendar');
  const [selectedDate, setSelectedDate] = useState<{ d: number; m: number; y: number } | null>(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Pad days calculation for previous month
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);
  
  const cells = useMemo(() => {
    const list: { day: number; isCurrentMonth: boolean; month: number; year: number }[] = [];
    
    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      list.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        month: viewMonth === 0 ? 11 : viewMonth - 1,
        year: viewMonth === 0 ? viewYear - 1 : viewYear,
      });
    }
    
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({
        day: d,
        isCurrentMonth: true,
        month: viewMonth,
        year: viewYear,
      });
    }
    
    // Next month padding to complete 5 or 6 rows of 7 days
    const targetLength = list.length > 35 ? 42 : 35;
    let nextDay = 1;
    while (list.length < targetLength) {
      list.push({
        day: nextDay++,
        isCurrentMonth: false,
        month: viewMonth === 11 ? 0 : viewMonth + 1,
        year: viewMonth === 11 ? viewYear + 1 : viewYear,
      });
    }
    
    return list;
  }, [daysInMonth, firstDay, prevMonthDays, viewMonth, viewYear]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const selectedEvents = selectedDate
    ? DUMMY_EVENTS.find(e => e.date === selectedDate.d && e.month === selectedDate.m && e.year === selectedDate.y)?.events ?? []
    : [];

  const isToday = (cell: typeof cells[0]) => 
    cell.isCurrentMonth && cell.day === today.getDate() && cell.month === today.getMonth() && cell.year === today.getFullYear();

  return (
    <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between transition-colors duration-300">
      
      {/* ── HEADER BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-slate-800 shrink-0">
        {/* Title */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#142B4D] dark:text-blue-400" />
          <h3 className="font-bold text-sm text-gray-800 dark:text-slate-100">Kalender Aktivitas ULOK</h3>
        </div>

        {/* View Mode Toggle Tabs (Matching Reference Image 2 & 4!) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-[#142B4D] text-white shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar View
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                activeTab === 'forecast'
                  ? 'bg-[#142B4D] text-white shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Forecast Table
            </button>
          </div>

          {/* Status Legend Dots */}
          <div className="hidden xl:flex items-center gap-2.5 text-[10px] font-semibold text-gray-500 dark:text-slate-400">
            {(Object.keys(STATUS_CONFIG) as UlokStatus[]).map(s => (
              <span key={s} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                {STATUS_CONFIG[s].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      {activeTab === 'calendar' ? (
        <div className="flex-1 flex flex-col p-4 sm:p-5 min-h-0 justify-between">
          
          {/* Controls & Nav Bar */}
          <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={goToday}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
              >
                Hari Ini
              </button>
            </div>

            <h4 className="text-base sm:text-lg font-black text-gray-800 dark:text-slate-100 tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h4>
          </div>

          {/* Day Headers (7 equal columns) */}
          <div className="grid grid-cols-7 gap-1.5 text-center mb-1 shrink-0">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Full Grid (Matching Reference Image 2 & 3!) */}
          <div className="grid grid-cols-7 gap-1.5 flex-1">
            {cells.map((cell, idx) => {
              const dayEvents = DUMMY_EVENTS.find(
                e => e.date === cell.day && e.month === cell.month && e.year === cell.year
              )?.events ?? [];
              const hasEvents = dayEvents.length > 0;
              const todayFlag = isToday(cell);
              const isSel = selectedDate?.d === cell.day && selectedDate?.m === cell.month && selectedDate?.y === cell.year;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (hasEvents) {
                      setSelectedDate({ d: cell.day, m: cell.month, y: cell.year });
                    }
                  }}
                  className={`
                    group relative p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all duration-200 min-h-[50px] sm:min-h-[56px]
                    ${!cell.isCurrentMonth
                      ? 'bg-slate-50/50 dark:bg-slate-900/40 border-gray-100 dark:border-slate-800/40 opacity-30'
                      : isSel
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#142B4D] dark:border-blue-500 ring-2 ring-[#142B4D]/20'
                      : todayFlag
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50'
                      : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                    }
                    ${hasEvents ? 'cursor-pointer' : ''}
                  `}
                >
                  {/* Top line: Date number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`
                        text-xs font-bold w-5.5 h-5.5 flex items-center justify-center rounded-full tabular-nums
                        ${todayFlag
                          ? 'bg-[#142B4D] text-white font-black shadow-xs'
                          : !cell.isCurrentMonth
                          ? 'text-gray-400 dark:text-slate-600'
                          : 'text-gray-700 dark:text-slate-200'
                        }
                      `}
                    >
                      {cell.day}
                    </span>

                    {/* Event count indicator if multiple */}
                    {dayEvents.length > 1 && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        +{dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Cell Events (Mini Badges - Image 2 & 3 style!) */}
                  {hasEvents && (
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const cfg = STATUS_CONFIG[ev.status];
                        return (
                          <div
                            key={ev.id}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 ${cfg.bg} ${cfg.color}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                            <span className="truncate">{ev.namaLokasi}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* ── FORECAST SUMMARY TABLE VIEW (Matching Reference Image 4!) ── */
        <div className="flex-1 p-4 sm:p-5 overflow-x-auto">
          <div className="min-w-[650px] space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-slate-100">Forecast Summary 2026</h4>
              <p className="text-xs text-gray-400 dark:text-slate-500">Ringkasan estimasi &amp; histori berkas ULOK per bulan</p>
            </div>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">PARAMETER</th>
                  {MONTH_SHORT.map(m => (
                    <th key={m} className="py-2.5 px-2 text-center">{m}</th>
                  ))}
                  <th className="py-2.5 px-3 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 font-medium">
                {FORECAST_SUMMARY_2026.map((row) => {
                  const total = row.data.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                        <span className="text-gray-800 dark:text-slate-200">{row.label}</span>
                      </td>
                      {row.data.map((val, idx) => (
                        <td key={idx} className="py-3 px-2 text-center font-semibold tabular-nums text-gray-600 dark:text-slate-300">
                          {val || '—'}
                        </td>
                      ))}
                      <td className="py-3 px-3 text-right font-black tabular-nums" style={{ color: row.color }}>
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EVENT DETAIL MODAL (If date with events is clicked) ── */}
      {selectedDate && selectedEvents.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Detail Aktivitas ULOK</p>
                <h4 className="text-base font-black text-gray-800 dark:text-slate-100">
                  {selectedDate.d} {MONTH_NAMES[selectedDate.m]} {selectedDate.y}
                </h4>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {selectedEvents.map(ev => {
                const cfg = STATUS_CONFIG[ev.status];
                return (
                  <div key={ev.id} className={`rounded-xl p-3 flex flex-col gap-2 ${cfg.bg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black tracking-wider text-gray-600 dark:text-slate-300">{ev.id}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${cfg.color}`}>
                        {cfg.icon} {ev.status}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-800 dark:text-slate-100">{ev.namaLokasi}</p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">{ev.cabang}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <FileCheck2 className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">Kelengkapan Dokumen</span>
                      </div>
                      <KelengkapanBar pct={ev.kelengkapanDokumen} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
