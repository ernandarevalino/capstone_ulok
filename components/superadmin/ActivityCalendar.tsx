'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Activity,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Table,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileEdit,
  MousePointerClick,
  ExternalLink,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type UlokStatus = 'In Review' | 'Approved' | 'Rejected' | 'Revisi' | 'Draft';
type ViewMode = 'week' | 'month';
type ActiveTab = 'calendar' | 'info';

interface UlokEvent {
  id: string;
  namaLokasi: string;
  kelengkapanDokumen: number;
  status: UlokStatus;
  cabang: string;
  date: string; // ISO YYYY-MM-DD
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────
const DUMMY_EVENTS: UlokEvent[] = [
  { id: 'ULK-001', namaLokasi: 'Alfamidi Sudirman',      kelengkapanDokumen: 85,  status: 'In Review', cabang: 'Jakarta Pusat',   date: '2026-09-03' },
  { id: 'ULK-002', namaLokasi: 'Alfamidi Gatot Subroto', kelengkapanDokumen: 100, status: 'Approved',  cabang: 'Jakarta Selatan', date: '2026-09-09' },
  { id: 'ULK-003', namaLokasi: 'Alfamidi Kuningan',      kelengkapanDokumen: 72,  status: 'In Review', cabang: 'Jakarta Selatan', date: '2026-09-09' },
  { id: 'ULK-004', namaLokasi: 'Alfamidi Cilandak',      kelengkapanDokumen: 60,  status: 'Revisi',    cabang: 'Jakarta Selatan', date: '2026-09-15' },
  { id: 'ULK-005', namaLokasi: 'Alfamidi Kemayoran',     kelengkapanDokumen: 40,  status: 'Rejected',  cabang: 'Jakarta Utara',   date: '2026-09-18' },
  { id: 'ULK-006', namaLokasi: 'Alfamidi Mangga Dua',    kelengkapanDokumen: 90,  status: 'Approved',  cabang: 'Jakarta Utara',   date: '2026-09-18' },
  { id: 'ULK-007', namaLokasi: 'Alfamidi Kebon Jeruk',   kelengkapanDokumen: 78,  status: 'In Review', cabang: 'Jakarta Barat',   date: '2026-09-22' },
  { id: 'ULK-008', namaLokasi: 'Alfamidi Depok Timur',   kelengkapanDokumen: 55,  status: 'Revisi',    cabang: 'Depok',           date: '2026-09-26' },
  { id: 'ULK-009', namaLokasi: 'Alfamidi Bintaro',       kelengkapanDokumen: 95,  status: 'Approved',  cabang: 'Tangerang',       date: '2026-10-01' },
  { id: 'ULK-010', namaLokasi: 'Alfamidi Bekasi Barat',  kelengkapanDokumen: 30,  status: 'Draft',     cabang: 'Bekasi',          date: '2026-10-01' },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES_FULL  = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const DAY_LABELS        = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function toMonFirstIdx(getDay: number): number {
  return getDay === 0 ? 6 : getDay - 1;
}

// ─── Heat Color (same palette as ActivityHeatmapCabang) ───────────────────────
// Light blue #DBEAFE → Dark navy #142B4D
function getCellStyle(count: number, max: number, isSelected: boolean): React.CSSProperties {
  if (isSelected) {
    return {
      backgroundColor: '#142B4D',
      boxShadow: '0 0 0 2px #142B4D, 0 0 0 5px rgba(20,43,77,0.25)',
    };
  }
  if (count === 0) return {};
  const t = Math.pow(Math.min(count / Math.max(max, 1), 1), 0.55);
  const r = Math.round(219 + (20 - 219) * t);
  const g = Math.round(234 + (43 - 234) * t);
  const b = Math.round(254 + (77 - 254) * t);
  return { backgroundColor: `rgb(${r},${g},${b})` };
}

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<UlokStatus, { dot: string; badge: string; label: string; icon: React.ReactNode }> = {
  Draft: {
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    label: 'Draft',
    icon: <FileEdit className="w-3 h-3" />,
  },
  'In Review': {
    dot: 'bg-[#F28705]',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    label: 'In Review',
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

// ─── Forecast / Informasi summary data ───────────────────────────────────────
const MONTH_SHORT = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGU','SEP','OKT','NOV','DES'];
const FORECAST_ROWS = [
  { label: 'Berkas Masuk',    data: [12,14,18,15,22,19,25,28,24,0,0,0], color: '#142B4D' },
  { label: 'Disetujui',       data: [8, 10,12,11,15,14,18,20,17,0,0,0], color: '#10b981' },
  { label: 'Dalam Tinjauan',  data: [3,  2, 4, 3, 5, 3, 4, 5, 4,0,0,0], color: '#F28705' },
  { label: 'Perlu Revisi',    data: [1,  2, 2, 1, 2, 2, 3, 3, 3,0,0,0], color: '#f97316' },
  { label: 'Ditolak',         data: [0,  0, 0, 0, 0, 0, 0, 0, 0,0,0,0], color: '#D91E2E' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ActivityCalendar() {
  const today = useMemo(() => new Date(), []);

  const [viewMode, setViewMode]       = useState<ViewMode>('week');
  const [activeTab, setActiveTab]     = useState<ActiveTab>('calendar');
  const [statusFilter, setStatusFilter] = useState('all');
  const [navOffset, setNavOffset]     = useState(0);
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const [selectedCellItems, setSelectedCellItems] = useState<UlokEvent[]>([]);
  const [selectedCellLabel, setSelectedCellLabel] = useState<string>('');

  // ── Filtered Events ─────────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? DUMMY_EVENTS
        : DUMMY_EVENTS.filter((e) => e.status === statusFilter),
    [statusFilter]
  );

  // ── Week dates (Mon-first) ───────────────────────────────────────────────────
  const weekDates = useMemo(() => {
    const pivot = new Date(today);
    pivot.setDate(today.getDate() + navOffset * 7);
    const dow = pivot.getDay();
    const monOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(pivot);
    monday.setDate(pivot.getDate() + monOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [today, navOffset]);

  // ── Month info ──────────────────────────────────────────────────────────────
  const monthInfo = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + navOffset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [today, navOffset]);

  // ── Matrices ─────────────────────────────────────────────────────────────────
  const weekMatrix = useMemo(() => {
    const m: Record<string, UlokEvent[]> = {};
    filtered.forEach((item) => {
      if (!item.date) return;
      if (!m[item.date]) m[item.date] = [];
      m[item.date].push(item);
    });
    return m;
  }, [filtered]);

  const monthMatrix = useMemo(() => {
    const m: Record<string, UlokEvent[]> = {};
    filtered.forEach((item) => {
      if (!item.date) return;
      const d = new Date(item.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!m[key]) m[key] = [];
      m[key].push(item);
    });
    return m;
  }, [filtered]);

  // ── Max count for intensity ──────────────────────────────────────────────────
  const maxCount = useMemo(() => {
    const vals =
      viewMode === 'week'
        ? weekDates.map((d) => (weekMatrix[d.toISOString().slice(0, 10)] || []).length)
        : (() => {
            const { year, month } = monthInfo;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            return Array.from({ length: daysInMonth }, (_, i) => {
              return (monthMatrix[`${year}-${month}-${i + 1}`] || []).length;
            });
          })();
    return Math.max(...vals, 1);
  }, [viewMode, weekDates, weekMatrix, monthInfo, monthMatrix]);

  // ── Month calendar cells ─────────────────────────────────────────────────────
  const monthCells = useMemo(() => {
    if (viewMode !== 'month') return [];
    const { year, month } = monthInfo;
    const firstDow = toMonFirstIdx(new Date(year, month, 1).getDay());
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
    return Array.from({ length: totalCells }, (_, i) => {
      const dn = i - firstDow + 1;
      return dn >= 1 && dn <= daysInMonth ? dn : null;
    });
  }, [viewMode, monthInfo]);

  // ── Nav Label ────────────────────────────────────────────────────────────────
  const navLabel = useMemo(() => {
    if (viewMode === 'week') {
      const f = weekDates[0], l = weekDates[6];
      const sameMonth = f.getMonth() === l.getMonth();
      return sameMonth
        ? `${f.getDate()} – ${l.getDate()} ${MONTH_NAMES_FULL[l.getMonth()]} ${l.getFullYear()}`
        : `${f.getDate()} ${MONTH_NAMES_SHORT[f.getMonth()]} – ${l.getDate()} ${MONTH_NAMES_SHORT[l.getMonth()]} ${l.getFullYear()}`;
    }
    return `${MONTH_NAMES_FULL[monthInfo.month]} ${monthInfo.year}`;
  }, [viewMode, weekDates, monthInfo]);

  // ── Cell click ───────────────────────────────────────────────────────────────
  const handleClick = useCallback(
    (key: string, label: string, items: UlokEvent[]) => {
      if (items.length === 0) {
        setSelectedCellKey(null);
        setSelectedCellItems([]);
        setSelectedCellLabel('');
        return;
      }
      setSelectedCellKey(key);
      setSelectedCellItems(items);
      setSelectedCellLabel(label);
      setActiveTab('info');
    },
    []
  );

  // ── Informasi Panel items ────────────────────────────────────────────────────
  const infoItems = selectedCellKey ? selectedCellItems : DUMMY_EVENTS.slice(0, 6);
  const infoTitle = selectedCellKey ? selectedCellLabel : 'Semua Aktivitas';
  const infoSub   = selectedCellKey
    ? `${selectedCellItems.length} usulan ditemukan`
    : 'Klik sel kalender untuk filter · terbaru';

  return (
    <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col transition-colors duration-300 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-[#142B4D] dark:text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
              Activity
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Frekuensi aktivitas ULOK — klik sel untuk lihat detail
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setNavOffset(0);
                setSelectedCellKey(null);
                setSelectedCellItems([]);
              }}
              className="pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">Semua</option>
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
              <option value="Revisi">Revisi</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Tab switcher: Calendar | Informasi */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-[#142B4D] dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Kalender
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                activeTab === 'info'
                  ? 'bg-white dark:bg-slate-700 text-[#142B4D] dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Informasi
            </button>
          </div>

          {/* Week/Month view switcher (only in calendar tab) */}
          {activeTab === 'calendar' && (
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-semibold">
              {(['week', 'month'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => { setViewMode(v); setNavOffset(0); setSelectedCellKey(null); setSelectedCellItems([]); }}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    viewMode === v
                      ? 'bg-white dark:bg-slate-700 text-[#142B4D] dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  {v === 'week' ? 'Minggu' : 'Bulan'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── TABS CONTENT ── */}
      {activeTab === 'calendar' ? (
        <div className="flex-1 flex flex-col p-4 sm:p-5 min-h-0">

          {/* Nav Row */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <button
              onClick={() => setNavOffset((p) => p - 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 select-none">
              {navLabel}
            </span>
            <button
              onClick={() => setNavOffset((p) => p + 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grid Body */}
          <div className="flex-1 flex flex-col justify-center">

            {/* ═══ WEEK VIEW ═══ */}
            {viewMode === 'week' && (
              <div className="w-full">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center">
                      {d}
                    </div>
                  ))}
                </div>

                {/* 7 square cells */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDates.map((date) => {
                    const iso = date.toISOString().slice(0, 10);
                    const items = weekMatrix[iso] || [];
                    const cnt = items.length;
                    const isSelected = selectedCellKey === iso;
                    const isEmpty = cnt === 0;
                    const isToday = date.toDateString() === today.toDateString();
                    const bgStyle = getCellStyle(cnt, maxCount, isSelected);
                    const dateLabel = `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]}`;

                    return (
                      <button
                        key={iso}
                        title={cnt > 0 ? `${dateLabel} — ${cnt} usulan` : dateLabel}
                        onClick={() => handleClick(iso, dateLabel, items)}
                        style={bgStyle}
                        className={[
                          'aspect-square rounded-xl flex flex-col items-center justify-center border transition-all duration-200',
                          isEmpty
                            ? 'bg-slate-100/80 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/40 cursor-default'
                            : 'border-transparent hover:scale-105 hover:shadow-lg cursor-pointer active:scale-95',
                          isToday && !isSelected ? 'ring-2 ring-[#F28705]/60' : '',
                          isSelected ? 'ring-2 ring-[#142B4D]/40' : '',
                        ].join(' ')}
                      >
                        <span className={`text-[13px] font-black leading-none ${
                          isSelected ? 'text-white'
                            : isEmpty ? 'text-slate-400 dark:text-slate-600'
                            : cnt / maxCount > 0.5 ? 'text-white' : 'text-[#142B4D]'
                        }`}>
                          {date.getDate()}
                        </span>
                        <span className={`text-[9px] font-semibold mt-0.5 leading-none ${
                          isSelected ? 'text-white/70'
                            : isEmpty ? 'text-slate-300 dark:text-slate-700'
                            : cnt / maxCount > 0.5 ? 'text-white/70' : 'text-[#142B4D]/60'
                        }`}>
                          {DAY_LABELS[toMonFirstIdx(date.getDay())]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Week summary */}
                <div className="mt-4 flex items-center justify-center gap-6">
                  {weekDates.map((date) => {
                    const iso = date.toISOString().slice(0, 10);
                    const cnt = (weekMatrix[iso] || []).length;
                    if (cnt === 0) return null;
                    return (
                      <div key={iso} className="text-center">
                        <div className="text-[10px] text-slate-400 font-medium">
                          {DAY_LABELS[toMonFirstIdx(date.getDay())]}
                        </div>
                        <div className="text-xs font-black text-[#142B4D] dark:text-blue-400">{cnt}</div>
                      </div>
                    );
                  })}
                  {weekDates.every((d) => (weekMatrix[d.toISOString().slice(0, 10)] || []).length === 0) && (
                    <p className="text-[11px] text-slate-400 italic">Tidak ada aktivitas minggu ini</p>
                  )}
                </div>
              </div>
            )}

            {/* ═══ MONTH VIEW ═══ */}
            {viewMode === 'month' && (
              <div className="w-full">
                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 gap-1 mb-1.5">
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {monthCells.map((dateNum, i) => {
                    if (dateNum === null) return <div key={`e-${i}`} />;

                    const { year, month } = monthInfo;
                    const key = `${year}-${month}-${dateNum}`;
                    const items = monthMatrix[key] || [];
                    const cnt = items.length;
                    const isSelected = selectedCellKey === key;
                    const isEmpty = cnt === 0;
                    const isToday =
                      today.getFullYear() === year &&
                      today.getMonth() === month &&
                      today.getDate() === dateNum;
                    const bgStyle = getCellStyle(cnt, maxCount, isSelected);
                    const dateLabel = `${dateNum} ${MONTH_NAMES_FULL[month]}`;

                    return (
                      <button
                        key={key}
                        title={cnt > 0 ? `${dateLabel} — ${cnt} usulan` : dateLabel}
                        onClick={() => handleClick(key, dateLabel, items)}
                        style={bgStyle}
                        className={[
                          'aspect-square rounded-lg flex flex-col items-center justify-center border transition-all duration-150 relative',
                          isEmpty
                            ? 'bg-slate-100/80 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/40 cursor-default'
                            : 'border-transparent hover:scale-110 hover:shadow-md cursor-pointer active:scale-95',
                          isToday && !isSelected ? 'ring-2 ring-[#F28705]/60' : '',
                          isSelected ? 'ring-2 ring-[#142B4D]/40' : '',
                        ].join(' ')}
                      >
                        <span className={`text-[11px] font-black leading-none ${
                          isSelected ? 'text-white'
                            : isEmpty ? 'text-slate-400 dark:text-slate-600'
                            : cnt / maxCount > 0.5 ? 'text-white' : 'text-[#142B4D]'
                        }`}>
                          {dateNum}
                        </span>
                        {cnt > 0 && (
                          <span className={`text-[8px] font-extrabold leading-none mt-0.5 ${
                            isSelected || cnt / maxCount > 0.5 ? 'text-white/75' : 'text-[#142B4D]/60'
                          }`}>
                            {cnt}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <span className="text-[10px] text-slate-400 font-medium mr-1">Sedikit</span>
            {[0.1, 0.3, 0.5, 0.7, 1.0].map((t) => {
              const r = Math.round(219 + (20 - 219) * Math.sqrt(t));
              const g = Math.round(234 + (43 - 234) * Math.sqrt(t));
              const b = Math.round(254 + (77 - 254) * Math.sqrt(t));
              return (
                <div
                  key={t}
                  className="w-3.5 h-3.5 rounded-sm"
                  style={{ backgroundColor: `rgb(${r},${g},${b})` }}
                />
              );
            })}
            <span className="text-[10px] text-slate-400 font-medium ml-1">Banyak</span>
          </div>
        </div>
      ) : (
        /* ── INFORMASI TAB (matches TopUlokProgressList style) ── */
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Panel Header */}
          <div className={`px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 transition-colors duration-300 ${
            selectedCellKey ? 'bg-[#142B4D]/5 dark:bg-slate-800/40' : ''
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {selectedCellKey ? (
                    <MapPin className="w-3.5 h-3.5 text-[#142B4D] dark:text-blue-400 shrink-0" />
                  ) : (
                    <MousePointerClick className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight truncate">
                    {infoTitle}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-tight">
                  {infoSub}
                </p>
              </div>

              {selectedCellKey && (
                <span className="shrink-0 text-[10px] font-black text-[#142B4D] dark:text-blue-400 bg-[#142B4D]/10 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
                  {selectedCellItems.length}
                </span>
              )}
            </div>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto [scrollbar-width:thin] divide-y divide-slate-50 dark:divide-slate-800/60">
            {infoItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <MousePointerClick className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Tidak ada aktivitas di slot ini
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Coba klik sel lain di grid kalender
                </p>
              </div>
            ) : (
              infoItems.map((item, idx) => {
                const statusKey = item.status in STATUS_CFG ? item.status : 'Draft';
                const cfg = STATUS_CFG[statusKey];
                const dateFormatted = item.date
                  ? new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '';

                return (
                  <div
                    key={item.id || idx}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Status dot */}
                    <div className="shrink-0">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors truncate leading-tight">
                        {item.namaLokasi}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                        {item.cabang} · {dateFormatted}
                      </p>
                    </div>

                    {/* Right: Status badge + doc completion */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.badge}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                        {item.kelengkapanDokumen}% dokumen
                      </span>
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-[#142B4D] dark:group-hover:text-blue-400 transition-colors shrink-0" />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: Forecast Summary (collapsed table) */}
          {!selectedCellKey && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Forecast Summary 2026
              </p>
              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full text-[10px] text-left min-w-[480px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-1.5 pr-2">Parameter</th>
                      {MONTH_SHORT.map((m) => (
                        <th key={m} className="py-1.5 px-1 text-center">{m}</th>
                      ))}
                      <th className="py-1.5 pl-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-medium">
                    {FORECAST_ROWS.map((row) => {
                      const total = row.data.reduce((a, b) => a + b, 0);
                      return (
                        <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 pr-2 font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                            <span className="text-slate-700 dark:text-slate-200">{row.label}</span>
                          </td>
                          {row.data.map((val, i) => (
                            <td key={i} className="py-2 px-1 text-center text-slate-500 dark:text-slate-400 tabular-nums">
                              {val || '—'}
                            </td>
                          ))}
                          <td className="py-2 pl-2 text-right font-black tabular-nums" style={{ color: row.color }}>
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
        </div>
      )}
    </div>
  );
}
