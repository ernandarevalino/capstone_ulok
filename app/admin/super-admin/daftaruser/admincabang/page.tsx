'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getUsersByRoleAction, 
  createUserAction, 
  updateUserAction, 
  deleteUserAction,
  getAllBranchesAction 
} from '@/actions/superadmin';
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Building2,
  AlertTriangle,
  CheckCircle2,
  X,
  UserPlus,
  ArrowUpDown,
  ChevronDown,
  UserCheck,
  RotateCcw
} from 'lucide-react';

export default function DaftarAdminCabangPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Custom Modal Alerts State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; namaAdmin: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form States
  const [formData, setFormData] = useState({ password: '', fullName: '', nik: '', branchId: '' });
  
  const [editData, setEditData] = useState<{
    id: string;
    fullName: string;
    nik: string;
    email: string;
    branchId: string;
    deleteAvatar: boolean;
    password?: string;
    avatarUrl?: string | null; 
  }>({ id: '', fullName: '', nik: '', email: '', branchId: '', deleteAvatar: false, password: '', avatarUrl: null });

  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  const activeFilterCount = branchFilter !== '' ? 1 : 0;
  const handleResetFilters = () => {
    setBranchFilter('');
    setPage(1);
  };

  useEffect(() => {
    async function init() {
      await Promise.all([
        fetchBranches(),
        fetchUsers()
      ]);
      setInitialLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!initialLoading) {
      fetchUsers();
    }
  }, [page, search, branchFilter]);

  async function fetchBranches() {
    const res = await getAllBranchesAction();
    if (res.success) {
      setBranches(res.data);
    }
  }

  async function fetchUsers() {
    setLoading(true);
    const res = await getUsersByRoleAction({ 
      role: 'admin_cabang', 
      search, 
      page, 
      limit: 7, 
      branchFilter 
    });
    
    if (res && res.success) {
      setUsers(res.data);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    }
    setLoading(false);
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nik || !formData.password || !formData.fullName || !formData.branchId) return;

    const parsedNik = parseInt(formData.nik, 10);
    if (isNaN(parsedNik)) {
      alert("Gagal menyimpan: NIK harus berupa angka murni!");
      return;
    }

    startTransition(async () => {
      const res = await createUserAction({ 
        password: formData.password,
        fullName: formData.fullName,
        nik: parsedNik,
        role: 'admin_cabang', 
        branchId: formData.branchId ? parseInt(formData.branchId) : null 
      });
      
      if (res.success) {
        setIsCreateOpen(false);
        setSuccessMessage(`Admin Cabang '${formData.fullName}' berhasil dibuat!`);
        setShowSuccessModal(true);
        setFormData({ password: '', fullName: '', nik: '', branchId: '' });
        fetchUsers();
        setTimeout(() => setShowSuccessModal(false), 1500);
      } else {
        alert(`Gagal membuat user: ${res.error}`);
      }
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.id || !editData.fullName || !editData.nik) return;

    const parsedNik = parseInt(String(editData.nik), 10);
    if (isNaN(parsedNik)) {
      alert("Gagal memperbarui: NIK harus berupa angka murni!");
      return;
    }
    
    startTransition(async () => {
      const res = await updateUserAction({ 
        id: editData.id, 
        fullName: editData.fullName,
        nik: parsedNik, 
        deleteAvatar: editData.deleteAvatar, 
        branchId: editData.branchId ? parseInt(editData.branchId) : null, 
        password: editData.password || undefined,
        email: editData.email
      });
      
      if (res.success) {
        setIsEditOpen(false);
        setSuccessMessage(`Data '${editData.fullName}' berhasil diperbarui!`);
        setShowSuccessModal(true);
        fetchUsers();
        setTimeout(() => setShowSuccessModal(false), 1500);
      } else {
        alert(`Gagal edit data: ${res.error}`);
      }
    });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { id, namaAdmin } = deleteTarget;

    startTransition(async () => {
      const res = await deleteUserAction(id);
      if (res.success) {
        setSuccessMessage(`User Admin '${namaAdmin}' berhasil dihapus`);
        setShowSuccessModal(true);
        setDeleteTarget(null);
        fetchUsers();
        setTimeout(() => setShowSuccessModal(false), 1500);
      } else {
        alert(`Gagal menghapus user: ${res.error}`);
      }
    });
  };

  const handleSortCycle = (column: string) => {
    if (sortColumn !== column) {
      setSortColumn(column);
      setSortDirection('asc');
    } else {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    }
  };

  const renderSortButton = (column: string) => {
    const isActive = sortColumn === column;
    const isDesc = isActive && sortDirection === 'desc';

    return (
      <button
        type="button"
        onClick={() => handleSortCycle(column)}
        className={`ml-1.5 inline-flex items-center justify-center p-0.5 rounded hover:bg-gray-200/80 dark:hover:bg-gray-700/50 transition-all ${
          isActive ? 'opacity-100 bg-blue-100/50 dark:bg-blue-950/50' : 'opacity-40 hover:opacity-85'
        }`}
      >
        <ArrowUpDown
          className={`w-3.5 h-3.5 text-current transition-transform duration-200 ${isDesc ? 'rotate-180' : ''}`}
        />
      </button>
    );
  };

  const displayUsers = [...users];
  if (sortColumn && sortDirection) {
    displayUsers.sort((a, b) => {
      let valA = sortColumn === 'nama' ? (a.full_name || '') : sortColumn === 'nik' ? (a.nik || '') : (a.branches?.nama_cabang || '');
      let valB = sortColumn === 'nama' ? (b.full_name || '') : sortColumn === 'nik' ? (b.nik || '') : (b.branches?.nama_cabang || '');
      
      const strA = String(valA);
      const strB = String(valB);

      return sortDirection === 'asc' 
        ? strA.localeCompare(strB, undefined, { numeric: true }) 
        : strB.localeCompare(strA, undefined, { numeric: true });
    });
  }

  if (initialLoading) {
    return (
      <div className="w-full overflow-x-hidden space-y-4 md:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100">
        {/* Page Header Skeleton */}
        <div className="mb-6">
          <div className="h-8 md:h-9 w-1/2 md:w-64 bg-slate-300 dark:bg-slate-700 rounded mb-2 animate-pulse"></div>
          <div className="h-3 md:h-4 w-3/4 md:w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>

        {/* Search + Actions Skeleton */}
        <div className="max-w-7xl mx-auto mb-6 flex flex-row items-center gap-2">
          <div className="h-11 md:h-10 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          <div className="h-11 md:h-10 w-11 sm:w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          <div className="h-11 md:h-10 w-11 sm:w-36 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
        </div>

        {/* Table Container Skeleton */}
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">
          {/* Table Header Skeleton */}
          <div className="bg-slate-200 dark:bg-slate-800 p-5 flex items-center justify-between animate-pulse border-b border-gray-100 dark:border-gray-800/60">
            <div className="h-5 w-24 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-5 w-32 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-5 w-28 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-5 w-24 bg-slate-300 dark:bg-slate-700 rounded"></div>
          </div>

          {/* Table Rows Skeleton */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-8 w-8 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 bg-slate-300 dark:bg-slate-700 rounded"></div>
                    <div className="h-3.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded hidden md:block"></div>
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded hidden sm:block"></div>
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center animate-pulse">
            <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* === HEADER SECTION === */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Daftar Admin Cabang</h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
          Total terdaftar: <span className="font-bold text-[#142B4D] dark:text-blue-400">{totalCount} pengguna</span> Admin Cabang
        </p>
      </div>

      {/* === SEARCH + ACTIONS === */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-row items-center gap-2 relative z-50">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Nama / NIK Admin..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4D] dark:focus:ring-blue-500 transition-all shadow-sm h-11 md:h-10"
          />
        </div>

        {/* Filter */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowFilterPopover(!showFilterPopover)}
            className={`relative w-11 h-11 sm:w-auto sm:h-10 sm:px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-900 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-95 ${
              activeFilterCount > 0
                ? 'border-[#142B4D] text-[#142B4D] dark:border-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            title="Filter Data"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 md:relative md:top-0 md:right-0" />
            )}
          </button>

          {showFilterPopover && (
            <div className="absolute right-0 mt-2 w-74 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-5 z-50 space-y-4 animate-[fadeIn_0.15s_ease-out]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#142B4D] dark:text-blue-400" />
                  Filter Admin
                </h4>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* Asal Cabang */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                  Asal Cabang
                </label>
                <select
                  value={branchFilter}
                  onChange={(e) => {
                    setBranchFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500"
                >
                  <option value="">Semua Wilayah Kantor Cabang</option>
                  {branches.map((br) => (
                    <option key={br.id} value={br.id}>
                      {br.nama_cabang} ({br.kabupaten_kota})
                    </option>
                  ))}
                </select>
              </div>

              {/* Terapkan Filter */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowFilterPopover(false)}
                  className="w-full py-2 bg-[#142B4D] hover:bg-[#1a3863] text-white font-bold text-xs rounded-xl shadow transition-all active:scale-[0.98]"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tambah Admin */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#142B4D] hover:bg-[#1a3863] dark:bg-[#142B4D] dark:hover:bg-[#1a3863] text-white flex h-11 w-11 shrink-0 sm:h-10 sm:w-auto items-center justify-center gap-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md sm:px-4"
          title="Tambah Admin"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="hidden sm:inline text-sm font-semibold">Tambah Admin</span>
        </button>
      </div>

      {/* === TABEL DATA UTAMA === */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#142B4D] dark:bg-slate-900 text-white font-semibold text-[12px] border-b border-gray-100 dark:border-gray-800">
                <th className="p-6 pl-6 w-16">Foto</th>
                <th className="p-4"><div className="flex items-center">Nama Admin {renderSortButton('nama')}</div></th>
                <th className="p-4"><div className="flex items-center">NIK / Email {renderSortButton('nik')}</div></th>
                <th className="p-4"><div className="flex items-center">Kantor Cabang {renderSortButton('cabang')}</div></th>
                <th className="p-4">Provinsi</th>
                <th className="p-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-gray-700">
              {loading ? (
                [...Array(7)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800/60 animate-pulse">
                    {/* Foto */}
                    <td className="p-4 pl-6">
                      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    </td>
                    {/* Nama Admin */}
                    <td className="p-4">
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </td>
                    {/* NIK / Email */}
                    <td className="p-4 space-y-1.5">
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-3.5 w-36 bg-slate-150 dark:bg-slate-800 rounded"></div>
                    </td>
                    {/* Kantor Cabang */}
                    <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                      <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </td>
                    {/* Provinsi */}
                    <td className="p-4">
                      <div className="h-5 w-20 bg-slate-150 dark:bg-slate-800 rounded"></div>
                    </td>
                    {/* Aksi */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="h-8 w-8 bg-slate-150 dark:bg-slate-800 rounded-lg"></div>
                        <div className="h-8 w-8 bg-slate-150 dark:bg-slate-800 rounded-lg"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : displayUsers.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Tidak ada admin cabang ditemukan.</td></tr>
              ) : (
                displayUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-4 pl-6">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover border dark:border-gray-700" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 text-[#142B4D] dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                          {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-gray-700 dark:text-gray-200 text-sm">{user.full_name}</td>
                    <td className="p-4 text-sm">
                      <div className="font-mono font-bold text-gray-800 dark:text-gray-300">{user.nik}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{user.email || `${user.nik}@mu.co.id`}</div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                      {user.branches ? (
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {user.branches.nama_cabang} <span className="text-gray-400 text-xs">({user.branches.kabupaten_kota})</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Belum Diatur</span>
                      )}
                    </td>
                    <td className="p-4">
                      {user.branches ? (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-xs font-medium">
                          {user.branches.provinsi}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => {
                            setEditData({ 
                              id: user.id, 
                              fullName: user.full_name, 
                              nik: user.nik, 
                              email: user.email || `${user.nik}@mu.co.id`,
                              branchId: user.branch_id ? user.branch_id.toString() : (user.branches?.id ? user.branches.id.toString() : ''), 
                              deleteAvatar: false, 
                              password: '',
                              avatarUrl: user.avatar_url 
                            });
                            setIsEditOpen(true);
                          }}
                          className="p-2 rounded-lg bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#142B4D] dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
                          title="Edit Admin"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: user.id, namaAdmin: user.full_name })}
                          disabled={isPending}
                          className="p-2 rounded-lg bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                          title="Hapus Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* === KONTROL PAGINASI === */}
        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
          >
            Prev
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Halaman {page} dari {totalPages || 1}
          </span>
          <button
            disabled={page === totalPages || totalPages === 0 || loading}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
          >
            Next
          </button>
        </div>
      </div>

      {/* === MODAL: KONFIRMASI HAPUS === */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              Apakah Anda yakin ingin menghapus admin "{deleteTarget.namaAdmin}"?
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
              >
                No
              </button>
              <button
                onClick={executeDelete}
                disabled={isPending}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 font-bold px-4 py-2 text-sm transition-all flex items-center gap-1.5"
              >
                {isPending ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Yes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: SUKSES === */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* === MODAL: TAMBAH ADMIN === */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out] p-4">
          <div className="w-full max-w-sm space-y-2 animate-[scaleUp_0.2s_ease-out]">
            {/* Header Modal */}
            <div className="bg-[#142B4D] text-white p-4 font-bold flex items-center justify-between rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-white shrink-0" />
                <span>Tambah Admin</span>
              </div>
            </div>
            
            {/* Form Input */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
              <form id="form-create-admin" onSubmit={handleCreateSubmit} className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">NIK KARYAWAN</label>
                  <input 
                    type="text" required value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})}
                    placeholder="Contoh: 12605011"
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-mono font-bold focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200" 
                  />
                  <p className="text-[10px] text-[#142B4D] dark:text-blue-400 mt-1 italic">Email otomatis: {formData.nik || 'NIK'}@mu.co.id</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">PASSWORD</label>
                  <input 
                    type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimal 6 karakter"
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">NAMA LENGKAP</label>
                  <input 
                    type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Nama display admin"
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">PENUGASAN WILAYAH</label>
                  <select 
                    required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200"
                  >
                    <option value="">Pilih Kantor Cabang Tugas</option>
                    {branches.map(br => (
                      <option key={br.id} value={br.id}>{br.nama_cabang} ({br.kabupaten_kota})</option>
                    ))}
                  </select>
                </div>
              </form>
            </div>

            {/* Footer Modal Action Buttons */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 flex items-center gap-1.5 p-1.5">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
              >
                Batal
              </button>
              <button
                type="submit"
                form="form-create-admin"
                disabled={isPending}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-[#142B4D] hover:bg-[#1a3863] transition-all duration-200 active:scale-95 shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: EDIT ADMIN === */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out] p-4">
          <div className="w-full max-w-sm space-y-2 animate-[scaleUp_0.2s_ease-out]">
            {/* Header Modal */}
            <div className="bg-[#142B4D] text-white p-4 font-bold flex items-center justify-between rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-white shrink-0" />
                <span>Edit Profil Admin</span>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)} 
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            {/* Form Input */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
              <form id="form-edit-admin" onSubmit={handleEditSubmit} className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">NIK KARYAWAN</label>
                  <input 
                    type="text" required value={editData.nik} onChange={e => setEditData({...editData, nik: e.target.value})}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-mono font-bold focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">EMAIL PENGGUNA</label>
                  <input 
                    type="email" required value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})}
                    placeholder="Contoh: user@gmail.com"
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-mono focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">NAMA LENGKAP</label>
                  <input 
                    type="text" required value={editData.fullName} onChange={e => setEditData({...editData, fullName: e.target.value})}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">PENUGASAN WILAYAH BARU</label>
                  <select 
                    required value={editData.branchId} onChange={e => setEditData({...editData, branchId: e.target.value})}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200"
                  >
                    <option value="">Pilih Kantor Cabang Tugas</option>
                    {branches.map(br => (
                      <option key={br.id} value={br.id}>{br.nama_cabang} ({br.kabupaten_kota})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">KATA SANDI BARU (OPSIONAL)</label>
                  <input 
                    type="password" placeholder="••••••••" value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200" 
                  />
                </div>

                {editData.avatarUrl && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <input 
                      type="checkbox" 
                      id="deleteAvatarCheckbox"
                      checked={editData.deleteAvatar} 
                      onChange={e => setEditData({...editData, deleteAvatar: e.target.checked})}
                      className="w-4 h-4 rounded text-[#142B4D] focus:ring-slate-900 border-gray-300 dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
                    />
                    <label htmlFor="deleteAvatarCheckbox" className="text-xs font-bold text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                      Hapus Foto Profil / Avatar
                    </label>
                  </div>
                )}
              </form>
            </div>

            {/* Footer Modal Action Buttons */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 flex items-center gap-1.5 p-1.5">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
              >
                Batal
              </button>
              <button
                type="submit"
                form="form-edit-admin"
                disabled={isPending}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-[#142B4D] hover:bg-[#1a3863] transition-all duration-200 active:scale-95 shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
