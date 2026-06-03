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
    branchId: string;
    deleteAvatar: boolean;
    password?: string;
    avatarUrl?: string | null; 
  }>({ id: '', fullName: '', nik: '', branchId: '', deleteAvatar: false, password: '', avatarUrl: null });

  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchUsers();
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

    startTransition(async () => {
      const res = await createUserAction({ 
        ...formData, 
        role: 'admin_cabang', 
        branchId: formData.branchId ? parseInt(formData.branchId) : null 
      });
      
      if (res.success) {
        setIsCreateOpen(false);
        setSuccessMessage(`Admin Cabang '${formData.fullName}' berhasil dibuat! 🎉`);
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
    
    startTransition(async () => {
      const res = await updateUserAction({ 
        id: editData.id, 
        fullName: editData.fullName,
        nik: editData.nik, 
        deleteAvatar: editData.deleteAvatar, 
        branchId: editData.branchId ? parseInt(editData.branchId) : null, 
        password: editData.password || undefined 
      });
      
      if (res.success) {
        setIsEditOpen(false);
        setSuccessMessage(`Data '${editData.fullName}' berhasil diperbarui! 💾`);
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
        <img
          src="/icons/icon-filter-2.svg"
          alt="Sort"
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isDesc ? 'rotate-180' : ''}`}
        />
      </button>
    );
  };

  const displayUsers = [...users];
  if (sortColumn && sortDirection) {
    displayUsers.sort((a, b) => {
      let valA = sortColumn === 'nama' ? a.full_name : sortColumn === 'nik' ? a.nik : (a.branches?.nama_cabang || '');
      let valB = sortColumn === 'nama' ? b.full_name : sortColumn === 'nik' ? b.nik : (b.branches?.nama_cabang || '');
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      
      {/* === HEADER SECTION === */}
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-12">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Daftar Admin Cabang</h1>
          <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total terdaftar: <span className="font-bold text-blue-600 dark:text-blue-400">{totalCount} pengguna</span> Admin Cabang
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:shrink-0">
          {/* === INPUT PENCARIAN === */}
          <div className="relative flex items-center w-full sm:w-60">
            <img 
              src="/icons/icon_sharp-search.svg" 
              alt="Search" 
              className="absolute left-3 w-4 h-4 pointer-events-none dark:brightness-0 dark:invert" 
            />
            <input 
              type="text" 
              placeholder="Search Nama / NIK Admin" 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-950 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-950/10 w-full transition-all duration-300 shadow-sm"
            />
          </div>

          {/* === DROPDOWN FILTER WILAYAH === */}
          <div className="relative flex items-center w-full sm:w-60">
            <img 
              src="/icons/icon-filter.svg" 
              alt="Filter" 
              className="absolute left-3 w-4 h-4 pointer-events-none opacity-60 dark:brightness-0 dark:invert" 
            />
            <select
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
              className="pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-950 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-950/10 w-full transition-all duration-300 shadow-sm appearance-none"
            >
              <option value="">Semua Wilayah Kantor Cabang</option>
              {branches.map((br) => (
                <option key={br.id} value={br.id}>{br.nama_cabang} ({br.kabupaten_kota})</option>
              ))}
            </select>
          </div>

          {/* === TOMBOL TAMBAH ADMIN === */}
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-950 dark:bg-blue-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-900 dark:hover:bg-blue-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <img src="/icons/icon-form.svg" alt="" className="w-4 h-4 brightness-0 invert" />
            Tambah Admin
          </button>
        </div>
      </div>

      {/* === TABEL DATA UTAMA === */}
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#142B4D] dark:bg-slate-900 text-white dark:text-gray-400 font-semibold text-xs border-b border-gray-100 dark:border-gray-800">
                <th className="p-4 pl-6 w-16">Foto</th>
                <th className="p-4"><div className="flex items-center">Nama Admin {renderSortButton('nama')}</div></th>
                <th className="p-4"><div className="flex items-center">NIK / Email {renderSortButton('nik')}</div></th>
                <th className="p-4"><div className="flex items-center">Kantor Cabang {renderSortButton('cabang')}</div></th>
                <th className="p-4">Provinsi</th>
                <th className="p-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Memuat data...</td></tr>
              ) : displayUsers.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Tidak ada admin cabang ditemukan.</td></tr>
              ) : (
                displayUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-4 pl-6">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover border dark:border-gray-700" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                          {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-gray-700 dark:text-gray-200 text-sm">{user.full_name}</td>
                    <td className="p-4 text-sm">
                      <div className="font-mono font-bold text-gray-800 dark:text-gray-300">{user.nik}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{user.nik}@alfamidi.com</div>
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
                              branchId: user.branch_id ? user.branch_id.toString() : (user.branches?.id ? user.branches.id.toString() : ''), 
                              deleteAvatar: false, 
                              password: '',
                              avatarUrl: user.avatar_url 
                            });
                            setIsEditOpen(true);
                          }}
                          className="p-2 rounded-lg bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-950 dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
                          title="Edit Admin"
                        >
                          <img src="/icons/icon-nama.svg" alt="Edit" className="w-4 h-4 dark:brightness-0 dark:invert" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: user.id, namaAdmin: user.full_name })}
                          disabled={isPending}
                          className="p-2 rounded-lg bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                          title="Hapus Admin"
                        >
                          <img src="/icons/icon-remove.svg" alt="Delete" className="w-4 h-4" />
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
            <img src="/icons/icon-hand.svg" alt="Confirm" className="w-16 h-16 mx-auto mb-2" />
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
            <img src="/icons/icon-check.svg" alt="Success" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* === MODAL: TAMBAH ADMIN === */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-80 space-y-3 animate-[scaleUp_0.2s_ease-out]">
            <div className="bg-linear-to-r from-blue-950 to-slate-900 text-white p-4 font-bold flex items-center justify-between rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <img src="/icons/icon-family.svg" alt="" className="w-5 h-4 brightness-0 invert" /> Tambah Admin Baru
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="hover:bg-white/15 p-1 rounded-lg">
                <img src="/icons/icon-close.svg" alt="Batal" className="w-4 h-4 brightness-0 invert" />
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
              <form id="form-create-admin" onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">NIK KARYAWAN</label>
                  <input 
                    type="text" required value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})}
                    placeholder="Contoh: 12605011"
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-mono font-bold focus:outline-none focus:border-blue-950" 
                  />
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 italic">Email otomatis: {formData.nik || 'NIK'}@alfamidi.com</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">PASSWORD</label>
                  <input 
                    type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimal 6 karakter"
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-950" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">NAMA LENGKAP</label>
                  <input 
                    type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Nama display admin"
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-950" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">PENUGASAN WILAYAH</label>
                  <select 
                    required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-950"
                  >
                    <option value="">Pilih Kantor Cabang Tugas</option>
                    {branches.map(br => (
                      <option key={br.id} value={br.id}>{br.nama_cabang} ({br.kabupaten_kota})</option>
                    ))}
                  </select>
                </div>
              </form>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" form="form-create-admin" disabled={isPending}
                className="bg-linear-to-r from-blue-950 to-slate-900 text-white px-32 py-3 mt-1 rounded-lg font-bold text-sm hover:bg-blue-900 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                <img src="/icons/icon-add.svg" alt="" className="w-4 h-4 brightness-0 invert" />
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: EDIT ADMIN === */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-80 space-y-3 animate-[scaleUp_0.2s_ease-out]">
            <div className="bg-linear-to-r from-blue-950 to-slate-900 text-white p-4 font-bold flex items-center justify-between rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <img src="/icons/icon-location.svg" alt="" className="w-5 h-4 brightness-0 invert" /> Edit Profil Admin
              </div>
              <button onClick={() => setIsEditOpen(false)} className="hover:bg-white/15 p-1 rounded-lg">
                <img src="/icons/icon-close.svg" alt="Batal" className="w-4 h-4 brightness-0 invert" />
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
              <form id="form-edit-admin" onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">NIK KARYAWAN</label>
                  <input 
                    type="text" required value={editData.nik} onChange={e => setEditData({...editData, nik: e.target.value})}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-mono font-bold focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">NAMA LENGKAP</label>
                  <input 
                    type="text" required value={editData.fullName} onChange={e => setEditData({...editData, fullName: e.target.value})}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">PENUGASAN WILAYAH BARU</label>
                  <select 
                    required value={editData.branchId} onChange={e => setEditData({...editData, branchId: e.target.value})}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none"
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
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none" 
                  />
                </div>

                {editData.avatarUrl && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <input 
                      type="checkbox" 
                      id="deleteAvatarCheckbox"
                      checked={editData.deleteAvatar} 
                      onChange={e => setEditData({...editData, deleteAvatar: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-950 focus:ring-slate-900 border-gray-300 dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
                    />
                    <label htmlFor="deleteAvatarCheckbox" className="text-xs font-bold text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                      Hapus Foto Profil / Avatar
                    </label>
                  </div>
                )}
              </form>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" form="form-edit-admin" disabled={isPending}
                className="bg-linear-to-r from-blue-950 to-slate-900 text-white px-32 py-3 rounded-lg font-bold text-sm hover:brightness-110 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                <img src="/icons/icon-add.svg" alt="" className="w-4 h-4 brightness-0 invert" />
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}