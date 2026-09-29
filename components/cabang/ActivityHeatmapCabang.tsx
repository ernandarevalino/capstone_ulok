'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Activity, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export interface SubmissionItem {
  id: string;
  nama_lokasi?: string;
  toko_name?: string;
  status: string;
  final_score?: number | null;
  created_at?: string;
  updated_at?: string;
  kategori_usulan?: string;
  jenis_usulan?: string;
  jenis_badan_hukum?: string;
  [key: string]: any;
}

export interface SelectedCellInfo {
  label: string;
  sublabel: string;
  items: SubmissionItem[];
}

interface ActivityHeatmapCabangProps {
  submissions?: SubmissionItem[];
  onCellSelect?: (info: SelectedCellInfo | null) => void;
  selectedCellKey?: string | null;
}

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_LABELS_MON_FIRST = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
// getDay(): 0=Sun,1=Mon,...,6=Sat → Mon-first index: Mon=0,...,Sun=6
function toMonFirstIdx(getDay: number): number {
  return getDay === 0 ? 6 : getDay - 1;
}

type ViewMode = 'week' | 'month';

// ── HEAT COLOR (CSS-in-JS interpolation) ──────────────────────────────────────
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

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function ActivityHeatmapCabang({
  submissions = [],
  onCellSelect,
  selectedCellKey,
}: ActivityHeatmapCabangProps) {
  const today = useMemo(() => new Date(), []);

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [statusFilter, setStatusFilter] = useState('all');
  const [navOffset, setNavOffset] = useState(0);

  // ── FILTERED DATA ────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? submissions
        : submissions.filter((s) => s.status === statusFilter),
    [submissions, statusFilter]
  );

  // ── WEEK: 7 dates of the selected week (Mon-based) ──────────────────────────
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

  // ── MONTH: year + month of the selected month ────────────────────────────────
  const monthInfo = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + navOffset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [today, navOffset]);

  // ── MATRICES ─────────────────────────────────────────────────────────────────
  // Week matrix: key = ISO date (YYYY-MM-DD)
  const weekMatrix = useMemo(() => {
    const m: Record<string, SubmissionItem[]> = {};
    filtered.forEach((item) => {
      const ds = item.updated_at || item.created_at;
      if (!ds) return;
      const d = new Date(ds);
      if (isNaN(d.getTime())) return;
      const iso = d.toISOString().slice(0, 10);
      if (!m[iso]) m[iso] = [];
      m[iso].push(item);
    });
    return m;
  }, [filtered]);

  // Month matrix: key = `${year}-${month}-${date}`
  const monthMatrix = useMemo(() => {
    const m: Record<string, SubmissionItem[]> = {};
    filtered.forEach((item) => {
      const ds = item.updated_at || item.created_at;
      if (!ds) return;
      const d = new Date(ds);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!m[key]) m[key] = [];
      m[key].push(item);
    });
    return m;
  }, [filtered]);

  // Max count across current view for intensity normalization
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

  // ── MONTH CALENDAR GRID ────────────────────────────────────────────────────────
  const monthCells = useMemo(() => {
    if (viewMode !== 'month') return [];
    const { year, month } = monthInfo;
    const firstDow = toMonFirstIdx(new Date(year, month, 1).getDay()); // Mon-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
    return Array.from({ length: totalCells }, (_, i) => {
      const dn = i - firstDow + 1;
      return dn >= 1 && dn <= daysInMonth ? dn : null;
    });
  }, [viewMode, monthInfo]);

  // ── CELL CLICK ────────────────────────────────────────────────────────────────
  const handleClick = useCallback(
    (key: string, label: string, sublabel: string, items: SubmissionItem[]) => {
      if (items.length === 0) { onCellSelect?.(null); return; }
      onCellSelect?.({ label, sublabel, items });
    },
    [onCellSelect]
  );

  // ── NAV LABEL ─────────────────────────────────────────────────────────────────
  const navLabel = useMemo(() => {
    if (viewMode === 'week') {
      const f = weekDates[0], l = weekDates[6];
      const sameMonth = f.getMonth() === l.getMonth();
      return sameMonth
        ? `${f.getDate()} – ${l.getDate()} ${MONTH_NAMES_FULL[l.getMonth()]} ${l.getFullYear()}`
        : `${f.getDate()} ${MONTH_NAMES_SHORT[f.getMonth()]} – ${l.getDate()} ${MONTH_NAMES_SHORT[l.getMonth()]} ${l.getFullYear()}`;
    }
    return `${MONTH_NAMES_FULL[monthInfo.month]} ${monthInfo.year}`;
  }, [viewMode, navOffset, weekDates, monthInfo]);

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col h-full transition-colors duration-300">

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-[#142B4D] dark:text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
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
              onChange={(e) => { setStatusFilter(e.target.value); setNavOffset(0); onCellSelect?.(null); }}
              className="pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">Semua</option>
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
              <option value="Revisi">Revisi</option>
              <option value="Approved">Approved</option>
            </select>
          </div>

          {/* View switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-semibold">
            {(['week', 'month'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => { setViewMode(v); setNavOffset(0); onCellSelect?.(null); }}
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
        </div>
      </div>

      {/* ── NAV ROW ── */}
      <div className="flex items-center justify-between pt-3 pb-2">
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

      {/* ── GRID BODY ── */}
      <div className="flex-1 flex flex-col justify-center">

        {/* ═══ WEEK VIEW: 7 squares in a row ═══ */}
        {viewMode === 'week' && (
          <div className="w-full">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAY_LABELS_MON_FIRST.map((d) => (
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
                    onClick={() => handleClick(iso, dateLabel, `${cnt} usulan`, items)}
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
                      {DAY_LABELS_MON_FIRST[toMonFirstIdx(date.getDay())]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Week summary row */}
            <div className="mt-4 flex items-center justify-center gap-6">
              {weekDates.map((date) => {
                const iso = date.toISOString().slice(0, 10);
                const cnt = (weekMatrix[iso] || []).length;
                if (cnt === 0) return null;
                return (
                  <div key={iso} className="text-center">
                    <div className="text-[10px] text-slate-400 font-medium">
                      {DAY_LABELS_MON_FIRST[toMonFirstIdx(date.getDay())]}
                    </div>
                    <div className="text-xs font-black text-[#142B4D] dark:text-blue-400">
                      {cnt}
                    </div>
                  </div>
                );
              })}
              {weekDates.every((d) => (weekMatrix[d.toISOString().slice(0, 10)] || []).length === 0) && (
                <p className="text-[11px] text-slate-400 italic">Tidak ada aktivitas minggu ini</p>
              )}
            </div>
          </div>
        )}

        {/* ═══ MONTH VIEW: calendar grid ═══ */}
        {viewMode === 'month' && (
          <div className="w-full">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {DAY_LABELS_MON_FIRST.map((d) => (
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
                    onClick={() =>
                      handleClick(key, dateLabel, `${cnt} usulan`, items)
                    }
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

      {/* ── LEGEND ── */}
      <div className="flex items-center justify-end gap-1.5 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
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
  );
}
