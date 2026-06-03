'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentProfile, logoutAction, updateProfileNameAction } from '@/actions/auth';
import { User, Shield, Info, LogOut, Save, Lock } from 'lucide-react';

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
      setSuccessMessage('Nama profil Super Admin berhasil diperbarui! 🎉');
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
      <div className="bg-white dark:bg-gray-900 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/80 text-center text-sm text-gray-400 dark:text-gray-500 italic">
        <div className="w-6 h-6 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Memuat data profil keamanan Super Admin...
      </div>
    );
  }

  const initialLetter = fullName ? fullName.charAt(0).toUpperCase() : 'S';

  return (
    <div className="space-y-6">

      {/* === HEADER PAGE === */}
      <div className="mx-auto mb-10 mt-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          Pengaturan Profil Super Admin
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
          Kelola data personal dan otoritas akun Super Admin Anda.
        </p>
      </div>
      
      {/* === KONTEN UTAMA === */}
      <div className="mb-15 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/80 overflow-hidden space-y-0 transition-colors">
        
        {/* === HEADER PANEL === */}
        <div className="bg-[#142B4D] dark:bg-slate-900 p-5 flex items-center justify-between transition-colors">
          <h3 className="text-white font-bold text-base flex items-center gap-2.5">
            <User className="w-5 h-5 text-blue-400 dark:text-blue-300" /> 
            Informasi Profil Otoritas Keamanan
          </h3>
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-3 py-1 rounded-full font-bold tracking-wider uppercase">
            Otoritas Penuh
          </span>
        </div>

        {/* === BODY KONTEN === */}
        <div className="p-6 space-y-8">
          
          {/* === PROFIL: DATA AVATAR === */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800/60">
            <div className="relative overflow-hidden rounded-full ring-4 ring-gray-100 dark:ring-gray-800/50 shrink-0 select-none">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Foto Profil" 
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 bg-linear-to-br from-[#142B4D] to-slate-700 text-white rounded-full flex items-center justify-center font-black text-3xl shadow-inner">
                  {initialLetter}
                </div>
              )}
            </div>

            <div className="text-center sm:text-left space-y-1.5">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                {profile?.full_name}
              </h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                <Shield className="w-3.5 h-3.5" />
                Super Admin
              </span>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
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
                    className="w-full text-xs md:text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 font-semibold transition-colors shadow-xs"
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
                    className="w-full text-xs md:text-sm bg-gray-50/70 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800/80 pl-10 pr-4 py-3 rounded-xl cursor-not-allowed font-semibold transition-colors shadow-inner font-mono"
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
          <div className="pt-5 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-end gap-3">
            
            <button
              type="submit"
              form="super-admin-profile-form"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs md:text-sm rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>

            <button
              type="button"
              onClick={handleLogoutTrigger}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-red-600/10 hover:shadow-red-600/20 flex items-center gap-2"
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
            <img src="/icons/icon-hand.svg" alt="Confirm Logout" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              Apakah Anda yakin ingin keluar dari panel Super Admin PRIOLO?
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
            <img src="/icons/icon-check.svg" alt="Success" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm md:text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}