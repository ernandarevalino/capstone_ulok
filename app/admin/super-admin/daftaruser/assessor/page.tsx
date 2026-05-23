'use client';

import React, { useState, useEffect } from 'react';
import { getUsersByRoleAction, createUserAction, updateUserAction, deleteUserAction } from '@/actions/superadmin';

export default function DaftarAssessorPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modals Controller bray
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form States
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', nik: '' });
  const [editData, setEditData] = useState({ fullName: '', nik: '', deleteAvatar: false });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  async function fetchUsers() {
    setLoading(true);
    const res = await getUsersByRoleAction({ role: 'assessor', search, page, limit: 15 });
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
    const res = await createUserAction({ ...formData, role: 'assessor' }); // Set role ke assessor bray!
    if (res.success) {
      alert('Tim Assessor baru berhasil didaftarkan! 🎉');
      setIsCreateOpen(false);
      setFormData({ email: '', password: '', fullName: '', nik: '' });
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
    const res = await updateUserAction({ id: selectedUser.id, ...editData });
    if (res.success) {
      alert('Data Assessor berhasil diperbarui! 💾');
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
      alert('Akun Assessor berhasil dihapus permanen! 🗑️');
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Daftar Tim Assessor</h1>
          <p className="text-sm text-gray-500 mt-1">Total terdaftar: <span className="font-bold text-purple-600">{totalCount} penilai</span></p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input 
            type="text"
            placeholder="🔍 Cari Nama / NIK..."
            className="px-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs md:text-sm px-4 py-2 rounded-lg shadow-sm transition-colors shrink-0"
          >
            ➕ Tambah Assessor Baru
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
                <th className="p-4">NIK</th>
                <th className="p-4">Tanggal Gabung</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Memuat data...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Tidak ada assessor ditemukan.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover border" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-gray-900">{user.full_name}</td>
                    <td className="p-4 font-mono text-gray-600">{user.nik}</td>
                    <td className="p-4 text-gray-400">{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 text-center space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setEditData({ fullName: user.full_name, nik: user.nik, deleteAvatar: false });
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
              <h3 className="font-bold text-sm md:text-base">➕ Tambah Tim Assessor Baru</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-white hover:text-gray-300 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Email Login</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-800" placeholder="contoh: assessor1@alfamidi.com" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-800" placeholder="Minimal 6 karakter..." />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-800" placeholder="Nama lengkap penilai..." />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">NIK Karyawan</label>
                <input required type="text" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-800" placeholder="Nomor Induk Karyawan..." />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 border rounded-lg text-gray-500 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">{actionLoading ? 'Menyimpan...' : 'Simpan Akun'}</button>
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
              <h3 className="font-bold text-sm md:text-base">✏️ Edit Profil Assessor</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-white hover:text-gray-300 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                <input required type="text" value={editData.fullName} onChange={e => setEditData({...editData, fullName: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg text-gray-800 font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">NIK Karyawan</label>
                <input required type="text" value={editData.nik} onChange={e => setEditData({...editData, nik: e.target.value})} className="w-full text-xs md:text-sm border px-3 py-2 rounded-lg text-gray-800 font-semibold" />
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
              <p className="text-xs text-gray-500">Tindakan ini permanen. Akun assessor <b>{selectedUser?.full_name}</b> beserta seluruh akses loginnya akan dihapus total dari database PRIOLO.</p>
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