'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getUsersByRoleAction, 
  createUserAction, 
  updateUserAction, 
  deleteUserAction 
} from '@/actions/superadmin';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  UserPlus,
  ArrowUpDown,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export default function DaftarAssessorPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; namaAssessor: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form States
  const [formData, setFormData] = useState({ password: '', fullName: '', nik: '' });
  const [editData, setEditData] = useState<{
    id: string;
    fullName: string;
    nik: string;
    email: string;
    deleteAvatar: boolean;
    password?: string;
  }>({ id: '', fullName: '', nik: '', email: '', deleteAvatar: false, password: '' });

  // Client-side UI Sorting Cycle State
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  async function fetchUsers() {
    setLoading(true);
    const res = await getUsersByRoleAction({ 
      role: 'assessor', 
      search, 
      page, 
      limit: 7 
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
    if (!formData.nik || !formData.password || !formData.fullName) return;

    startTransition(async () => {
      const res = await createUserAction({ 
        password: formData.password,
        fullName: formData.fullName,
        nik: parseInt(formData.nik, 10),
        role: 'assessor'
      });
      
      if (res.success) {
        setIsCreateOpen(false);
        setSuccessMessage(`Tim Assessor '${formData.fullName}' berhasil didaftarkan!`);
        setShowSuccessModal(true);
        setFormData({ password: '', fullName: '', nik: '' });
        fetchUsers();
        setTimeout(() => setShowSuccessModal(false), 1500);
      } else {
        alert(`Gagal membuat user: ${res.error}`);
      }
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.id) return;
    
    startTransition(async () => {
      const res = await updateUserAction({ 
        id: editData.id,
        fullName: editData.fullName,
        nik: parseInt(editData.nik, 10), 
        deleteAvatar: editData.deleteAvatar,
        password: editData.password || undefined,
        email: editData.email
      });
      
      if (res.success) {
        setIsEditOpen(false);
        setSuccessMessage(`Data Assessor '${editData.fullName}' berhasil diperbarui!`);
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
    const { id, namaAssessor } = deleteTarget;

    startTransition(async () => {
      const res = await deleteUserAction(id);
      if (res.success) {
        setSuccessMessage(`Akun Assessor '${namaAssessor}' berhasil dihapus`);
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
      let valA = sortColumn === 'nama' ? a.full_name : sortColumn === 'nik' ? a.nik : (a.created_at || '');
      let valB = sortColumn === 'nama' ? b.full_name : sortColumn === 'nik' ? b.nik : (b.created_at || '');
      
      if (sortColumn === 'tanggal') {
        return sortDirection === 'asc' 
          ? new Date(valA).getTime() - new Date(valB).getTime()
          : new Date(valB).getTime() - new Date(valA).getTime();
      }
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      
      {/* === HEADER SECTION === */}
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Daftar Tim Assessor</h1>
          <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total terdaftar: <span className="font-bold text-[#142B4D] dark:text-blue-400">{totalCount} pengguna</span> Tim Assessor
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:shrink-0">
          {/* === INPUT PENCARIAN === */}
          <div className="relative flex items-center w-full sm:w-60">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search Nama / NIK Assessor" 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4D] dark:focus:ring-blue-500 transition-all shadow-sm h-11 md:h-10"
            />
          </div>

          {/* === TOMBOL TAMBAH ASSESSOR === */}
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#142B4D] hover:bg-[#1a3863] dark:bg-[#142B4D] dark:hover:bg-[#1a3863] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md flex items-center gap-2 w-full sm:w-auto justify-center h-11 md:h-10"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Assessor</span>
          </button>
        </div>
      </div>

      {/* === TABEL DATA UTAMA === */}
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#142B4D] dark:bg-slate-900 text-white font-semibold text-xs border-b border-gray-100 dark:border-gray-800">
                <th className="p-4 pl-6 w-16">Foto</th>
                <th className="p-4"><div className="flex items-center">Nama Assessor {renderSortButton('nama')}</div></th>
                <th className="p-4"><div className="flex items-center">NIK / Email {renderSortButton('nik')}</div></th>
                <th className="p-4"><div className="flex items-center">Tanggal Gabung {renderSortButton('tanggal')}</div></th>
                <th className="p-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Memuat data...</td></tr>
              ) : displayUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Tidak ada anggota assessor ditemukan.</td></tr>
              ) : (
                displayUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-4 pl-6">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover border dark:border-gray-700" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                          {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-gray-700 dark:text-gray-200 text-sm">{user.full_name}</td>
                    <td className="p-4 text-sm">
                      <div className="font-mono font-bold text-gray-800 dark:text-gray-300">{user.nik}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{user.email || `${user.nik}@mu.co.id`}</div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </td>
                    <td className="p-4 text-center">
                      {/* Button Action */}
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => {
                            setEditData({ 
                              id: user.id,
                              fullName: user.full_name, 
                              nik: user.nik, 
                              email: user.email || `${user.nik}@mu.co.id`,
                              deleteAvatar: false,
                              password: '' 
                            });
                            setIsEditOpen(true);
                          }}
                          className="p-2 rounded-lg bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#142B4D] dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
                          title="Edit Assessor"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: user.id, namaAssessor: user.full_name })}
                          disabled={isPending}
                          className="p-2 rounded-lg bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                          title="Hapus Assessor"
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
              Apakah Anda yakin ingin menghapus akun assessor "{deleteTarget.namaAssessor}"?
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

      {/* === MODAL: TAMBAH ASSESSOR === */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out] p-4">
          <div className="w-full max-w-sm space-y-2 animate-[scaleUp_0.2s_ease-out]">
            {/* Header Modal */}
            <div className="bg-[#142B4D] text-white p-4 font-bold flex items-center justify-between rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-white shrink-0" />
                <span>Tambah Assessor Baru</span>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            {/* Form Input */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
              <form id="form-create-assessor" onSubmit={handleCreateSubmit} className="p-5 space-y-3">
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
                    placeholder="Nama lengkap penilai"
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200" 
                  />
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
                form="form-create-assessor"
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

      {/* === MODAL: EDIT ASSESSOR === */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out] p-4">
          <div className="w-full max-w-sm space-y-2 animate-[scaleUp_0.2s_ease-out]">
            {/* Header Modal */}
            <div className="bg-[#142B4D] text-white p-4 font-bold flex items-center justify-between rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-white shrink-0" />
                <span>Edit Profil Assessor</span>
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
              <form id="form-edit-assessor" onSubmit={handleEditSubmit} className="p-5 space-y-3">
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
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">KATA SANDI BARU (OPSIONAL)</label>
                  <input 
                    type="password" placeholder="••••••••" value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})}
                    className="w-full border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 transition-all duration-200" 
                  />
                  <p className="text-[10px] text-gray-400 italic mt-1">Kosongkan jika tidak ingin merubah password.</p>
                </div>

                {users.find(u => u.id === editData.id)?.avatar_url && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <input 
                      type="checkbox" 
                      id="delAvatar" 
                      checked={editData.deleteAvatar} 
                      onChange={e => setEditData({...editData, deleteAvatar: e.target.checked})} 
                      className="w-4 h-4 rounded text-[#142B4D] focus:ring-slate-900 border-gray-300 dark:border-gray-700 dark:bg-gray-800 cursor-pointer" 
                    />
                    <label htmlFor="delAvatar" className="text-xs font-bold text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                      Hapus / Reset Foto Profil
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
                form="form-edit-assessor"
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