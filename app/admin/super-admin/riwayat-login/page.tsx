'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getLoginHistoryAction, GetLoginHistoryParams } from '@/actions/superadmin';
import { getCurrentProfile } from '@/actions/auth';
import {
  Search,
  Filter,
  RotateCcw,
  Clock,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
  Laptop,
  Globe,
  Users
} from 'lucide-react';

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return '-';
  }
};

const calculateSessionDuration = (
  loginAt: string,
  logoutAt: string | null,
  status: 'active' | 'expired' | 'logout'
) => {
  try {
    const loginTime = new Date(loginAt).getTime();
    if (isNaN(loginTime)) return '-';

    if (status === 'logout' && logoutAt) {
      const logoutTime = new Date(logoutAt).getTime();
      const diffMs = Math.max(0, logoutTime - loginTime);
      const mins = Math.floor(diffMs / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      if (mins >= 60) {
        const hours = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `${hours}j ${remMins}m`;
      }
      return `${mins}m ${secs}d`;
    }

    if (status === 'active') {
      const now = Date.now();
      const diffMs = Math.max(0, now - loginTime);
      const mins = Math.floor(diffMs / (1000 * 60));
      return `${mins}m berjalan`;
    }

    if (status === 'expired') {
      return '30m (Batas Sesi)';
    }

    return '-';
  } catch {
    return '-';
  }
};

const parseBrowserInfo = (ua: string | null | undefined) => {
  if (!ua || ua === '-') return 'Browser Standar';
  if (ua.includes('Edg/')) return 'Microsoft Edge';
  if (ua.includes('Chrome/')) return 'Google Chrome';
  if (ua.includes('Firefox/')) return 'Mozilla Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Apple Safari';
  if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera';
  return 'Web Browser';
};

export default function RiwayatLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    activeCount: 0,
    expiredCount: 0,
    logoutCount: 0,
  });

  const [roleFilter, setRoleFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Verifikasi role Super Admin pada mount
  useEffect(() => {
    async function checkAuth() {
      const res = await getCurrentProfile();
      if (!res.success || res.profile?.role !== 'super_admin') {
        router.push('/login');
        return;
      }
      setIsSuperAdmin(true);
    }
    checkAuth();
  }, [router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params: GetLoginHistoryParams = {
      roleFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: search.trim() || undefined,
      page,
      limit: 15,
    };

    const res = await getLoginHistoryAction(params);
    if (res.success) {
      setLogs(res.data);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
      if (res.stats) {
        setStats(res.stats);
      }
    }
    setLoading(false);
  }, [roleFilter, startDate, endDate, search, page]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLogs();
    }
  }, [isSuperAdmin, fetchLogs]);

  const handleResetFilters = () => {
    setRoleFilter('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-[#D91E2E] dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
            Super Admin
          </span>
        );
      case 'admin_cabang':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-[#3365A6] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
            Admin Cabang
          </span>
        );
      case 'assessor':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60">
            Assessor
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {role || '-'}
          </span>
        );
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-[#142B4D] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold">Memverifikasi otoritas Super Admin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* === HEADER HALAMAN === */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Riwayat Aktivitas Login & Logout
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pantau sesi login, durasi aktif, dan catatan waktu logout seluruh pengguna sistem PRISMA.
          </p>
        </div>
        <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 bg-[#142B4D] hover:bg-[#1a3863] dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition active:scale-95 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* === SUMMARY CARDS: STATISTIK CEPAT === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sesi Hari Ini */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              Sesi Hari Ini
            </span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {stats.totalToday}
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#3365A6] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Sedang Aktif */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Masih Aktif
            </span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {stats.activeCount}
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Logout Normal */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              Logout Normal
            </span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {stats.logoutCount}
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Sesi Expired */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Sesi Expired
            </span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {stats.expiredCount}
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-[#F28705] dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* === FILTER & PENCARIAN === */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Input Pencarian */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Nama / NIK..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs md:text-sm border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#142B4D]/10"
            />
          </div>

          {/* Filter Role */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
            >
              <option value="all">Semua Role</option>
              <option value="admin_cabang">Admin Cabang</option>
              <option value="assessor">Assessor</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {/* Filter Tanggal Mulai */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              title="Tanggal Mulai"
              className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
            />
          </div>

          {/* Filter Tanggal Selesai & Reset */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              title="Tanggal Selesai"
              className="w-full px-3.5 py-2 rounded-xl text-xs md:text-sm border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
            />
            {(roleFilter !== 'all' || startDate !== '' || endDate !== '' || search !== '') && (
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset Semua Filter"
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition active:scale-95 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* === TABEL LOG RIWAYAT LOGIN === */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-[#142B4D] dark:bg-slate-900 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-300 shrink-0" />
            <h2 className="font-bold text-sm md:text-base tracking-wide">
              Log Akses Pengguna
            </h2>
          </div>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full font-semibold">
            Total: {totalCount} Sesi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Cabang</th>
                <th className="py-3.5 px-4">Waktu Masuk</th>
                <th className="py-3.5 px-4">Waktu Keluar / Status</th>
                <th className="py-3.5 px-4">Durasi Sesi</th>
                <th className="py-3.5 px-4">Perangkat / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs md:text-sm text-gray-700 dark:text-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-800 rounded mx-auto"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-1"></div>
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-28 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      <p className="font-semibold text-sm">Tidak ada riwayat login yang sesuai dengan filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((item, idx) => {
                  const itemIndex = (page - 1) * 15 + idx + 1;
                  const initial = item.userName ? item.userName.charAt(0).toUpperCase() : 'U';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                        {itemIndex}
                      </td>

                      {/* Pengguna */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                            {item.userAvatar ? (
                              <img
                                src={item.userAvatar}
                                alt={item.userName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{initial}</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white block leading-tight">
                              {item.userName}
                            </span>
                            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                              NIK: {item.userNik}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(item.userRole)}
                      </td>

                      {/* Cabang */}
                      <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300">
                        {item.branchName}
                      </td>

                      {/* Waktu Masuk */}
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-800 dark:text-gray-200">
                        {formatDateTime(item.loginAt)}
                      </td>

                      {/* Waktu Keluar / Status */}
                      <td className="py-3.5 px-4">
                        {item.sessionStatus === 'logout' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              <LogOut className="w-3 h-3 text-gray-500" />
                              Logout
                            </span>
                            <span className="block font-mono text-[11px] text-gray-500 dark:text-gray-400">
                              {formatDateTime(item.logoutAt)}
                            </span>
                          </div>
                        ) : item.sessionStatus === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Masih Aktif
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-[#F28705] dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                              <Clock className="w-3 h-3 text-[#F28705]" />
                              Sesi Berakhir (Token Expired)
                            </span>
                            {item.estimatedExpiredAt && (
                              <span className="block font-mono text-[10px] text-amber-700/80 dark:text-amber-400/70" title="Estimasi batas sesi 30 menit dari login">
                                Exp: {formatDateTime(item.estimatedExpiredAt)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Durasi Sesi */}
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                        {calculateSessionDuration(item.loginAt, item.logoutAt, item.sessionStatus)}
                      </td>

                      {/* Perangkat / IP */}
                      <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-28" title={item.userAgent}>
                            {parseBrowserInfo(item.userAgent)}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-gray-400 dark:text-gray-500 block">
                          IP: {item.ipAddress}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* === PAGINATION CONTROLS === */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Halaman <span className="font-bold text-gray-800 dark:text-gray-200">{page}</span> dari <span className="font-bold text-gray-800 dark:text-gray-200">{totalPages}</span> ({totalCount} total sesi)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
