'use client';

import React, { useState, useEffect } from 'react';
import { 
  getUsersByRoleAction, 
  createUserAction, 
  updateUserAction, 
  deleteUserAction,
  getAllBranchesAction 
} from '@/actions/superadmin';

export default function DaftarAdminCabangPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // States Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form States (Tanpa field email tunggal bray)
  const [formData, setFormData] = useState({ password: '', fullName: '', nik: '', branchId: '' });
  const [editData, setEditData] = useState({ fullName: '', nik: '', branchId: '', deleteAvatar: false });
  const [actionLoading, setActionLoading] = useState(false);

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
      limit: 7, // Maksimal 7 baris data per halaman
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
    setActionLoading(true);
    const res = await createUserAction({ 
      ...formData, 
      role: 'admin_cabang',
      branchId: formData.branchId ? parseInt(formData.branchId) : null 
    });
    if (res.success) {
      alert('Admin Cabang baru berhasil dibuat! 🎉 Email login dibuat otomatis dari NIK.');
      setIsCreateOpen(false);
      setFormData({ password: '', fullName: '', nik: '', branchId: '' });
      fetchUsers();
    } else {
      alert(`Gagal membuat user: ${res.error}`);
    }
    setActionLoading(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await updateUserAction({ 
      id: selectedUser.id, 
      fullName: editData.fullName,
      nik: editData.nik,
      deleteAvatar: editData.deleteAvatar,
      branchId: editData.branchId ? parseInt(editData.branchId) : null 
    });
    if (res.success) {
      alert('Data Admin Cabang berhasil diperbarui! 💾 Kredensial diselaraskan otomatis.');
      setIsEditOpen(false);
      fetchUsers();
    } else {
      alert(`Gagal edit data: ${res.error}`);
    }
    setActionLoading(false);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await deleteUserAction(selectedUser.id);
    if (res.success) {
      alert('Akun pengguna berhasil dihapus permanen! 🗑️');
      setIsDeleteOpen(false);
      fetchUsers();
    } else {
      alert(`Gagal menghapus user: ${res.error}`);
    }
    setActionLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* SEKTOR TOP CONTROL */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Daftar Admin Cabang</h1>
          <p className="text-sm text-gray-500 mt-1">Total terdaftar: <span className="font-bold text-blue-600">{totalCount} pengguna</span></p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
          {/* Input Search dengan Kustom SVG Icon */}
          <div className="relative w-full sm:w-64">
            <input 
              type="text"
              placeholder="Cari Nama / NIK..."
              className="pl-10 pr-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <img 
              src="/icons/icon_sharp-search.svg" 
              alt="Search" 
              className="absolute left-3 top-2.5 h-4 w-4 opacity-60"
            />
          </div>

          {/* Dropdown Filter Wilayah Cabang dengan Kustom SVG Icon */}
          <div className="relative w-full sm:w-64">
            <select
              className="pl-10 pr-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 appearance-none bg-white"
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
            >
              <option value="">Semua Wilayah Kantor Cabang</option>
              {branches.map((br) => (
                <option key={br.id} value={br.id}>{br.nama_cabang} ({br.kabupaten_kota})</option>
              ))}
            </select>
            <img 
              src="/icons/icon-filter.svg" 
              alt="Filter" 
              className="absolute left-3 top-2.5 h-4 w-4 opacity-60"
            />
          </div>

          <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-4 py-2 rounded-lg shadow-sm transition-colors shrink-0 w-full sm:w-auto"
          >
            ➕ Tambah Admin
          </button>
        </div>
      </div>

      {/* TABEL VIEW */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4 pl-6">Foto</th>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">NIK / Email Login</th>
                <th className="p-4">Kantor Cabang (Kab/Kota)</th>
                <th className="p-4">Provinsi</th>
                <th className="p-4">Tanggal Gabung</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Memuat data...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Tidak ada admin cabang ditemukan.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover border" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-gray-900">{user.full_name}</td>
                    <td className="p-4">
                      <div className="font-mono text-gray-800 font-bold">{user.nik}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{user.nik}@alfamidi.com</div>
                    </td>
                    <td className="p-4">
                      {user.branches ? (
                        <span className="font-medium text-gray-800">
                          {user.branches.nama_cabang} <span className="text-gray-400 text-xs">({user.branches.kabupaten_kota})</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Belum Diatur</span>
                      )}
                    </td>
                    <td className="p-4">
                      {user.branches ? (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 border text-xs font-medium">
                          {user.branches.provinsi}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400">{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 text-center space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setEditData({ 
                            fullName: user.full_name, 
                            nik: user.nik, 
                            branchId: user.branch_id ? user.branch_id.toString() : '',
                            deleteAvatar: false 
                          });
                          setIsEditOpen(true);
                        }}
                        className="text-amber-600 hover:bg-amber-50 px-2 py-1 rounded border border-amber-200 text-xs font-bold transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(user); setIsDeleteOpen(true); }}
                        className="text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 text-xs font-bold transition-colors"
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 bg-gray-50 border-t flex items-center justify-between text-xs font-semibold text-gray-600">
          <div>Halaman {page} dari {totalPages || 1}</div>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1 || loading} className="px-3 py-1.5 bg-white border rounded-md shadow-sm disabled:opacity-50">⬅️ Prev</button>
            <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages || totalPages === 0 || loading} className="px-3 py-1.5 bg-white border rounded-md shadow-sm disabled:opacity-50">Next ➡️</button>
          </div>
        </div>
      </div>

      {/* ==================== MODAL POP-UP 1: CREATE USER ==================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden border">
            <div className="bg-[#142B4D] px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm md:text-base">➕ Tambah Admin Cabang Baru</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-white hover:text-gray-300 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">NIK Karyawan</label>
                <input required type="text" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 font-mono font-bold" placeholder="Contoh: 12605011" />
                <p className="text-[10px] text-blue-600 italic">💡 Email login digenerate otomatis: <b>{formData.nik ? formData.nik : 'NIK'}@alfamidi.com</b></p>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800" placeholder="Minimal 6 karakter..." />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800" placeholder="Nama display karyawan..." />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Penugasan Wilayah Kantor Cabang</label>
                <select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white">
                  <option value="">-- Pilih Kantor Cabang Tugas --</option>
                  {branches.map(br => (
                    <option key={br.id} value={br.id}>{br.nama_cabang} - {br.provinsi} ({br.kabupaten_kota})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 border rounded-lg text-gray-500 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{actionLoading ? 'Menyimpan...' : 'Simpan Akun'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL POP-UP 2: EDIT USER ==================== */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden border">
            <div className="bg-amber-600 px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm md:text-base">✏️ Edit Profil Admin Cabang</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-white hover:text-gray-300 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">NIK Karyawan</label>
                <input required type="text" value={editData.nik} onChange={e => setEditData({...editData, nik: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg text-gray-800 font-mono font-bold focus:ring-2 focus:ring-amber-500" />
                <p className="text-[10px] text-amber-700 italic">⚠️ Mengubah NIK otomatis mengubah email login: <b>{editData.nik}@alfamidi.com</b></p>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                <input required type="text" value={editData.fullName} onChange={e => setEditData({...editData, fullName: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg text-gray-800 font-semibold focus:ring-2 focus:ring-amber-500" />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Penugasan Wilayah Kantor Cabang</label>
                <select required value={editData.branchId} onChange={e => setEditData({...editData, branchId: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg focus:ring-2 focus:ring-amber-500 text-gray-800 bg-white">
                  <option value="">-- Pilih Kantor Cabang Tugas --</option>
                  {branches.map(br => (
                    <option key={br.id} value={br.id}>{br.nama_cabang} - {br.provinsi} ({br.kabupaten_kota})</option>
                  ))}
                </select>
              </div>
              
              {selectedUser?.avatar_url && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <input type="checkbox" id="delAvatar" checked={editData.deleteAvatar} onChange={e => setEditData({...editData, deleteAvatar: e.target.checked})} className="h-4 w-4 rounded text-amber-600" />
                  <label htmlFor="delAvatar" className="text-xs font-bold text-amber-800 cursor-pointer select-none">Hapus / Reset Foto Profil Pengguna</label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border rounded-lg text-gray-500 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">{actionLoading ? 'Memperbarui...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL POP-UP 3: CONFIRM DELETE ==================== */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl overflow-hidden border p-6 space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 text-red-600 text-2xl flex items-center justify-center font-bold">⚠️</div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-gray-800">Hapus Akun Pengguna?</h4>
              <p className="text-xs text-gray-500">Tindakan ini permanen. Akun <b>{selectedUser?.full_name}</b> beserta seluruh akses loginnya akan dihapus total dari database PRIOLO.</p>
            </div>
            <div className="flex justify-center gap-3 font-bold text-xs pt-2">
              <button onClick={() => setIsDeleteOpen(false)} disabled={actionLoading} className="w-24 py-2 border rounded-lg text-gray-500 hover:bg-gray-50">Tidak</button>
              <button onClick={handleDeleteSubmit} disabled={actionLoading} className="w-24 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{actionLoading ? 'Hapus...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}