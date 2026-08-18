'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentProfile, logoutAction, updateProfileNameAction } from '@/actions/auth';
import { User, Shield, Info, LogOut, Save, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SuperAdminProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const res = await getCurrentProfile();
      
      if (res && res.success && res.profile) { 
        setProfile(res.profile);
        setFullName(res.profile.full_name || '');
      }
      
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);

    const res = await updateProfileNameAction(fullName);
    if (res && res.success) {
      setSuccessMessage('Nama profil Super Admin berhasil diperbarui!');
      setShowSuccessModal(true);
      router.refresh(); 
      
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1500);
    } else {
      alert(`Gagal memperbarui profil: ${res.error}`);
    }
    setSaving(false);
  };

  const handleLogoutTrigger = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    setIsLoggingOut(true);
    
    const res = await logoutAction();
    if (res && res.success) {
      setShowLogoutConfirm(false);
      setSuccessMessage(`Berhasil keluar. Sampai jumpa kembali, ${profile?.full_name || 'Super Admin'}!`);
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        router.push('/');
        router.refresh();
      }, 1800);
    } else {
      alert(`Gagal logout: ${res.error}`);
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full overflow-x-hidden space-y-4 md:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8">
        {/* Page Header Title/Subtitle */}
        <div className="mb-6">
          <div className="h-7 md:h-8 w-1/2 md:w-64 bg-slate-300 dark:bg-slate-700 rounded mb-2 animate-pulse"></div>
          <div className="h-3 md:h-4 w-3/4 md:w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>

        {/* Profile Card Main Container */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/80 overflow-hidden">
          {/* Flat neutral header bar */}
          <div className="bg-slate-200 dark:bg-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-pulse">
            <div className="h-5 w-32 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-6 w-24 bg-slate-300 dark:bg-slate-700 rounded-full hidden sm:block"></div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-6 border-b border-gray-100 dark:border-gray-800/60 animate-pulse">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0"></div>
              <div className="text-center sm:text-left space-y-2 w-full max-w-xs">
                <div className="h-5 w-40 bg-slate-300 dark:bg-slate-700 rounded mx-auto sm:mx-0"></div>
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto sm:mx-0"></div>
                <div className="h-3 w-56 bg-slate-100 dark:bg-slate-800/50 rounded mx-auto sm:mx-0"></div>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-28 bg-slate-300 dark:bg-slate-700 rounded"></div>
                  <div className="h-11 md:h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 text-slate-400 rounded-2xl flex items-start gap-3 animate-pulse">
              <div className="h-4 w-4 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0"></div>
              <div className="space-y-2 w-full">
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="pt-5 border-t border-gray-100 dark:border-gray-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 animate-pulse">
              <div className="h-11 w-full sm:w-36 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-11 w-full sm:w-36 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  const initialLetter = fullName ? fullName.charAt(0).toUpperCase() : 'S';

  return (
    <div className="w-full overflow-x-hidden space-y-4 md:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100">
      <div className="space-y-6">

        {/* === HEADER PAGE === */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          Profil Pengguna
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
          Kelola data personal dan otoritas akun Super Admin Anda.
        </p>
      </div>
      
      {/* === KONTEN UTAMA === */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden space-y-0">
        
        {/* === HEADER PANEL === */}
        <div className="bg-[#142B4D] dark:bg-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors">
          <h3 className="text-white font-bold text-base flex items-center gap-2.5">
            <User className="w-5 h-5 text-blue-400 dark:text-blue-300" /> 
            Informasi Profil Otoritas Keamanan
          </h3>
          {/* Hidden on mobile, moved to avatar section */}
          <span className="hidden sm:inline-block bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-3 py-1 rounded-full font-bold tracking-wider uppercase">
            Otoritas Penuh
          </span>
        </div>

        {/* === BODY KONTEN === */}
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          
          {/* === PROFIL: DATA AVATAR === */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-6 border-b border-gray-100 dark:border-gray-800/60">
            <div className="relative overflow-hidden rounded-full ring-4 ring-gray-100 dark:ring-gray-800/50 shrink-0 select-none">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Foto Profil" 
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 bg-linear-to-br from-[#142B4D] to-slate-700 text-white rounded-full flex items-center justify-center font-black text-3xl shadow-inner">
                  {initialLetter}
                </div>
              )}
            </div>

            <div className="text-center sm:text-left space-y-1.5 w-full">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                {profile?.full_name}
              </h3>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                  <Shield className="w-3.5 h-3.5" />
                  Super Admin
                </span>
                {/* Mobile Only Badge */}
                <span className="inline-block sm:hidden bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-3 py-1 rounded-full font-bold tracking-wider uppercase mt-1">
                  Otoritas Penuh
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-2">
                Identitas Anda adalah tingkat manajemen tertinggi. Anda tidak diperbolehkan mengganti foto profile.
              </p>
            </div>
          </div>

          {/* === FORM DATA INPUT === */}
          <form id="super-admin-profile-form" onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  Nama Lengkap Anda
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap baru..."
                    required
                    className="w-full h-11 md:h-12 text-xs md:text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 pl-10 pr-4 rounded-xl focus:outline-none focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#142B4D]/10 font-semibold transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  Nomor Induk Karyawan (NIK)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={profile?.nik || ''} 
                    disabled 
                    className="w-full h-11 md:h-12 text-xs md:text-sm bg-gray-50/70 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800/80 pl-10 pr-4 rounded-xl cursor-not-allowed font-semibold transition-colors shadow-inner font-mono"
                  />
                </div>
              </div>

            </div>
          </form>

          {/* === INFO KEBIJAKAN === */}
          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 rounded-2xl text-xs flex items-start gap-3 leading-relaxed font-medium shadow-xs">
            <Info className="w-4 h-4 shrink-0 text-blue-500 dark:text-blue-400 mt-0.5" />
            <span>
              <strong>Informasi Sistem:</strong> Sebagai Super Admin, Anda berhak mengubah nama, mengatur akun admin cabang dan assessor namun anda tidak diperbolehkan mengganti foto profil. Pastikan untuk selalu menjaga kerahasiaan data akun Anda.
            </span>
          </div>

          {/* === PANEL AKSI === */}
          <div className="pt-5 border-t border-gray-100 dark:border-gray-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            
            <button
              type="submit"
              form="super-admin-profile-form"
              disabled={saving}
              className="w-full sm:w-auto px-5 h-11 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs md:text-sm rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>

            <button
              type="button"
              onClick={handleLogoutTrigger}
              className="w-full sm:w-auto px-5 h-11 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-red-600/10 hover:shadow-red-600/20 gap-2"
            >
              <LogOut className="w-4 h-4" />
              Keluar dari Sistem
            </button>

          </div>

        </div>

      </div>

      {/* === MODAL: KONFIRMASI KELUAR === */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <AlertTriangle className="w-16 h-16 mx-auto mb-2 text-amber-500" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              Apakah Anda yakin ingin keluar dari panel Super Admin PRISMA?
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                Tidak
              </button>
              <button
                onClick={executeLogout}
                disabled={isLoggingOut}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 font-bold px-4 py-2 text-sm transition-all flex items-center gap-1.5"
              >
                {isLoggingOut ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Ya, Keluar'
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
            <CheckCircle2 className="w-16 h-16 mx-auto mb-2 text-emerald-500" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm md:text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
