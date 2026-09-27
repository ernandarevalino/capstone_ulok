'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentProfile, logoutAction, updateProfileNameAction } from '@/actions/auth';
import {
  getAllBranchesAction,
  createBranchAction,
  updateBranchAction,
  deleteBranchAction,
} from '@/actions/superadmin';
import {
  User,
  Shield,
  Info,
  LogOut,
  Save,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  RefreshCw,
  X,
  MapPin,
  SlidersHorizontal,
  KeyRound,
} from 'lucide-react';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';

  const [activeTab, setActiveTab] = useState<'profile' | 'branches' | 'system'>(
    initialTab === 'branches' ? 'branches' : initialTab === 'system' ? 'system' : 'profile'
  );

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'branches') setActiveTab('branches');
    else if (tabParam === 'system') setActiveTab('system');
    else if (tabParam === 'profile') setActiveTab('profile');
  }, [searchParams]);

  const handleTabChange = (tab: 'profile' | 'branches' | 'system') => {
    setActiveTab(tab);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tab);
    window.history.pushState({}, '', newUrl.toString());
  };

  // ==================== TAB 1: PROFIL STATES ====================
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ==================== TAB 2: BRANCHES STATES ====================
  const [branches, setBranches] = useState<any[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [searchBranch, setSearchBranch] = useState('');
  const [filterProvinsi, setFilterProvinsi] = useState('all');

  // Modal Branch Add/Edit/Delete
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchModalMode, setBranchModalMode] = useState<'add' | 'edit'>('add');
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [branchForm, setBranchForm] = useState({
    nama_cabang: '',
    kabupaten_kota: '',
    provinsi: '',
  });
  const [savingBranch, setSavingBranch] = useState(false);

  const [showDeleteBranchModal, setShowDeleteBranchModal] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<any>(null);

  // ==================== INITIAL DATA LOAD ====================
  useEffect(() => {
    async function loadProfile() {
      setProfileLoading(true);
      const res = await getCurrentProfile();
      if (res && res.success && res.profile) {
        setProfile(res.profile);
        setFullName(res.profile.full_name || '');
      }
      setProfileLoading(false);
    }

    loadProfile();
    loadBranches();
  }, []);

  async function loadBranches() {
    setBranchesLoading(true);
    const res = await getAllBranchesAction();
    if (res && res.success && res.data) {
      setBranches(res.data);
    }
    setBranchesLoading(false);
  }

  // ==================== HANDLERS: PROFIL ====================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSavingProfile(true);

    const res = await updateProfileNameAction(fullName);
    if (res && res.success) {
      setSuccessMessage('Nama profil Super Admin berhasil diperbarui!');
      setShowSuccessModal(true);
      router.refresh();

      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1500);
    } else {
      alert(`Gagal memperbarui profil: ${res?.error || 'Terjadi kesalahan'}`);
    }
    setSavingProfile(false);
  };

  const executeLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAction();
    } catch {
      // Handled by server redirect
    }
  };

  // ==================== HANDLERS: BRANCHES ====================
  const openAddBranchModal = () => {
    setBranchModalMode('add');
    setSelectedBranch(null);
    setBranchForm({ nama_cabang: '', kabupaten_kota: '', provinsi: '' });
    setShowBranchModal(true);
  };

  const openEditBranchModal = (b: any) => {
    setBranchModalMode('edit');
    setSelectedBranch(b);
    setBranchForm({
      nama_cabang: b.nama_cabang || '',
      kabupaten_kota: b.kabupaten_kota || '',
      provinsi: b.provinsi || '',
    });
    setShowBranchModal(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.nama_cabang.trim()) return;
    setSavingBranch(true);

    if (branchModalMode === 'add') {
      const res = await createBranchAction(branchForm);
      if (res.success) {
        setSuccessMessage('Cabang baru berhasil ditambahkan!');
        setShowSuccessModal(true);
        setShowBranchModal(false);
        loadBranches();
        setTimeout(() => setShowSuccessModal(false), 1500);
      } else {
        alert(`Gagal membuat cabang: ${res.error}`);
      }
    } else {
      if (!selectedBranch) return;
      const res = await updateBranchAction({ id: selectedBranch.id, ...branchForm });
      if (res.success) {
        setSuccessMessage('Data cabang berhasil diperbarui!');
        setShowSuccessModal(true);
        setShowBranchModal(false);
        loadBranches();
        setTimeout(() => setShowSuccessModal(false), 1500);
      } else {
        alert(`Gagal memperbarui cabang: ${res.error}`);
      }
    }
    setSavingBranch(false);
  };

  const openDeleteBranchModal = (b: any) => {
    setBranchToDelete(b);
    setShowDeleteBranchModal(true);
  };

  const executeDeleteBranch = async () => {
    if (!branchToDelete) return;
    setDeletingBranch(true);
    const res = await deleteBranchAction(branchToDelete.id);
    if (res.success) {
      setSuccessMessage(`Cabang ${branchToDelete.nama_cabang} berhasil dihapus!`);
      setShowSuccessModal(true);
      setShowDeleteBranchModal(false);
      setBranchToDelete(null);
      loadBranches();
      setTimeout(() => setShowSuccessModal(false), 1500);
    } else {
      alert(`Gagal menghapus cabang: ${res.error}`);
    }
    setDeletingBranch(false);
  };

  // Filtered branches
  const uniqueProvinces = Array.from(new Set(branches.map((b) => b.provinsi).filter(Boolean)));
  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.nama_cabang?.toLowerCase().includes(searchBranch.toLowerCase()) ||
      b.kabupaten_kota?.toLowerCase().includes(searchBranch.toLowerCase()) ||
      b.provinsi?.toLowerCase().includes(searchBranch.toLowerCase());
    const matchesProv = filterProvinsi === 'all' || b.provinsi === filterProvinsi;
    return matchesSearch && matchesProv;
  });

  const initialLetter = fullName ? fullName.charAt(0).toUpperCase() : 'S';

  return (
    <div className="w-full space-y-6 text-slate-800 dark:text-slate-100 pb-16">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-200 dark:border-slate-800">

        {activeTab === 'branches' && (
          <button
            onClick={openAddBranchModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#142B4D] hover:bg-[#1B3863] text-white text-xs md:text-sm font-semibold rounded-lg transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            Tambah Cabang Baru
          </button>
        )}
      </div>

      {/* HORIZONTAL UNDERLINE TABS (Vercel / Shadcn Style) */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-6 overflow-x-auto text-xs md:text-sm font-semibold">
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 pb-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-[#142B4D] text-[#142B4D] dark:border-blue-400 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil Saya</span>
          </button>

          <button
            onClick={() => handleTabChange('branches')}
            className={`flex items-center gap-2 pb-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'branches'
                ? 'border-[#142B4D] text-[#142B4D] dark:border-blue-400 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Manajemen Cabang</span>
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {branches.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('system')}
            className={`flex items-center gap-2 pb-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'system'
                ? 'border-[#142B4D] text-[#142B4D] dark:border-blue-400 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sistem & Keamanan</span>
          </button>
        </nav>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PROFIL PENGGUNA */}
      {/* ==================================================================== */}
      {activeTab === 'profile' && (
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Informasi Profil</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kelola nama akun dan otoritas Super Admin Anda.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-3 py-1 bg-blue-50 text-[#142B4D] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 rounded-full">
              Super Admin
            </span>
          </div>

          {profileLoading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Avatar Row */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 rounded-full bg-[#142B4D] text-white flex items-center justify-center font-bold text-2xl shrink-0 overflow-hidden border border-slate-300 dark:border-slate-700">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    initialLetter
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {profile?.full_name || fullName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {profile?.nik ? `NIK: ${profile.nik}` : 'Super Admin Account'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Foto profil Super Admin terikat dengan otoritas sistem dan tidak dapat diubah.
                  </p>
                </div>
              </div>

              {/* Form Input */}
              <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama lengkap..."
                      className="w-full h-10 text-xs md:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 rounded-lg focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Nomor Induk Karyawan (NIK)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={profile?.nik || ''}
                      className="w-full h-10 text-xs md:text-sm bg-slate-100 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-3.5 rounded-lg font-mono cursor-not-allowed"
                    />
                  </div>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  form="profile-form"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-[#142B4D] hover:bg-[#1B3863] disabled:opacity-50 text-white font-semibold text-xs md:text-sm rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="px-4 py-2 bg-[#D91E2E] hover:bg-red-700 text-white font-semibold text-xs md:text-sm rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar dari Sistem
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: MANAJEMEN CABANG */}
      {/* ==================================================================== */}
      {activeTab === 'branches' && (
        <div className="w-full space-y-4">
          {/* Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari cabang, kota..."
                value={searchBranch}
                onChange={(e) => setSearchBranch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-[#142B4D]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterProvinsi}
                onChange={(e) => setFilterProvinsi(e.target.value)}
                className="w-full sm:w-auto h-9 text-xs md:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">Semua Provinsi ({uniqueProvinces.length})</option>
                {uniqueProvinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>

              <button
                onClick={loadBranches}
                className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors shrink-0"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${branchesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4 text-center w-16">ID</th>
                    <th className="py-3 px-4">Nama Cabang</th>
                    <th className="py-3 px-4">Kabupaten / Kota</th>
                    <th className="py-3 px-4">Provinsi</th>
                    <th className="py-3 px-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs md:text-sm">
                  {branchesLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5 px-4 text-center"><div className="h-4 w-6 bg-slate-200 dark:bg-slate-800 rounded mx-auto"></div></td>
                        <td className="py-3.5 px-4"><div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="py-3.5 px-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="py-3.5 px-4 text-center"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredBranches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 dark:text-slate-500">
                        <p className="font-semibold text-sm">Tidak ada data cabang</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBranches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">#{b.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{b.nama_cabang}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{b.kabupaten_kota}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{b.provinsi}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditBranchModal(b)}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openDeleteBranchModal(b)}
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: SISTEM & KEAMANAN */}
      {/* ==================================================================== */}
      {activeTab === 'system' && (
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-6 space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Pengaturan Keamanan & Algoritma</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Konfigurasi parameter sistem dan sesi otentikasi.</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <SlidersHorizontal className="w-5 h-5 text-[#142B4D] dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bobot Algoritma SAW</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kalkulasi skor kelayakan lokasi toko (C1, C2, C3).</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded">
                Aktif (Standard)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-[#142B4D] dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Batas Waktu Sesi (Session Timeout)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sesi aktif pengguna sebelum otomatis ter-logout.</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded">
                24 Jam
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT BRANCH */}
      {/* ==================================================================== */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {branchModalMode === 'add' ? 'Tambah Cabang Baru' : 'Edit Cabang'}
              </h3>
              <button onClick={() => setShowBranchModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="p-5 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Nama Cabang
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama cabang..."
                  value={branchForm.nama_cabang}
                  onChange={(e) => setBranchForm({ ...branchForm, nama_cabang: e.target.value })}
                  className="w-full h-9 text-xs md:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 rounded-lg focus:outline-none focus:border-[#142B4D]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  required
                  placeholder="Kabupaten / Kota..."
                  value={branchForm.kabupaten_kota}
                  onChange={(e) => setBranchForm({ ...branchForm, kabupaten_kota: e.target.value })}
                  className="w-full h-9 text-xs md:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 rounded-lg focus:outline-none focus:border-[#142B4D]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Provinsi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Provinsi..."
                  value={branchForm.provinsi}
                  onChange={(e) => setBranchForm({ ...branchForm, provinsi: e.target.value })}
                  className="w-full h-9 text-xs md:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 rounded-lg focus:outline-none focus:border-[#142B4D]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBranch}
                  className="px-4 py-1.5 bg-[#142B4D] hover:bg-[#1B3863] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {savingBranch ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DELETE BRANCH CONFIRMATION */}
      {/* ==================================================================== */}
      {showDeleteBranchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 w-full max-w-sm text-center space-y-3">
            <AlertTriangle className="w-12 h-12 mx-auto text-[#D91E2E]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hapus Cabang?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Hapus <strong>{branchToDelete?.nama_cabang}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setShowDeleteBranchModal(false)}
                disabled={deletingBranch}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={executeDeleteBranch}
                disabled={deletingBranch}
                className="px-4 py-1.5 bg-[#D91E2E] hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                {deletingBranch ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: LOGOUT CONFIRMATION */}
      {/* ==================================================================== */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 w-full max-w-sm text-center space-y-3">
            <AlertTriangle className="w-12 h-12 mx-auto text-[#F28705]" />
            <p className="text-slate-800 dark:text-slate-200 font-bold text-xs md:text-sm">
              Keluar dari panel Super Admin PRISMA?
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="bg-[#142B4D] hover:bg-[#1B3863] text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
              >
                Tidak
              </button>
              <button
                onClick={executeLogout}
                disabled={isLoggingOut}
                className="text-slate-500 dark:text-slate-400 hover:text-[#D91E2E] font-semibold px-3 py-1.5 text-xs"
              >
                {isLoggingOut ? 'Loading...' : 'Ya, Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: SUCCESS TOAST */}
      {/* ==================================================================== */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 w-full max-w-sm text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
            <p className="text-slate-800 dark:text-slate-200 font-semibold text-xs md:text-sm">
              {successMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full p-8 text-center animate-pulse space-y-4">
          <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded-xl"></div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
