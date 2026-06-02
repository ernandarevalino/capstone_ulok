'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getCurrentProfile, updateAvatarAction, logoutAction } from '@/actions/auth'; 
import { useRouter } from 'next/navigation'; 
import { User, Shield, MapPin, Building, Info, LogOut, Camera } from 'lucide-react';

export default function ProfileGlobal() {
  // Deklarasi State Komponen
  const [profile, setProfile] = useState<any>(null);          
  const [loading, setLoading] = useState(true);               
  const [uploading, setUploading] = useState(false);           
  const fileInputRef = useRef<HTMLInputElement>(null);        
  const router = useRouter();                                

  // State Baru untuk Custom Modal & Loading Animasi
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  async function fetchProfileData() {
    setLoading(true);
    const res = await getCurrentProfile();
    if (res && res.success) {
      setProfile(res.profile);
    }
    setLoading(false);
  }

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', files[0]); 

    const res = await updateAvatarAction(formData);
    if (res && res.success) {
      setProfile((prev: any) => ({ ...prev, avatar_url: res.avatarUrl }));
      setSuccessMessage('Foto profil berhasil diperbarui! 🎉');
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1500);
    } else {
      alert(`Gagal upload: ${res.error}`);
    }
    setUploading(false);
  };

  // Pemicu awal ketika button Keluar diklik
  const handleLogoutTrigger = () => {
    setShowLogoutConfirm(true);
  };

  // Eksekusi Log Out dari Sistem dengan Custom Modal Animasi
  const executeLogout = async () => {
    setIsLoggingOut(true);
    
    const res = await logoutAction();
    if (res && res.success) {
      setShowLogoutConfirm(false);
      setSuccessMessage(`Berhasil keluar. Sampai jumpa kembali, ${profile?.full_name || 'User'}!`);
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

  // State loading premium (Sinkron dengan Notification Page)
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/80 text-center text-sm text-gray-400 dark:text-gray-500 italic">
        <div className="w-6 h-6 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Memuat data profil pengguna...
      </div>
    );
  }

  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';

  // Format Role Dinamis untuk Semua Level Hak Akses
  const formatRole = (role: string) => {
    if (role === 'admin_cabang') return 'Admin Cabang';
    if (role === 'assessor') return 'Assessor';
    if (role === 'super_admin' || role === 'superadmin') return 'Super Admin';
    return role ? role.toUpperCase() : 'User';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/80 overflow-hidden space-y-0 transition-colors">
      
      {/* HEADER CARD NAVY BLUE */}
      <div className="bg-[#142B4D] dark:bg-slate-900 p-5 flex items-center justify-between transition-colors">
        <h3 className="text-white font-bold text-base flex items-center gap-2.5">
          <User className="w-5 h-5 text-blue-400 dark:text-blue-300" /> 
          Informasi Profil & Keanggotaan
        </h3>
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-3 py-1 rounded-full font-bold tracking-wider uppercase">
          Akun Aktif
        </span>
      </div>

      {/* BODY KONTEN */}
      <div className="p-6 space-y-8">
        
        {/* SEKTOR ATAS: DETAIL FOTO PROFIL & RINGKASAN DATA AKUN */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800/60">
          <div 
            className="relative group cursor-pointer overflow-hidden rounded-full ring-4 ring-gray-100 dark:ring-gray-800/50 hover:ring-blue-500/30 transition-all duration-300 hover:scale-105 active:scale-95 shrink-0" 
            onClick={handleAvatarClick}
          >
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Foto Profil" 
                className="h-24 w-24 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="h-24 w-24 bg-linear-to-br from-[#142B4D] to-slate-700 text-white rounded-full flex items-center justify-center font-black text-3xl group-hover:opacity-90 transition-all shadow-inner">
                {initialLetter}
              </div>
            )}
            
            {/* Overlay Efek Hover Modern dengan Ikon Kamera */}
            <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="w-4 h-4 mb-1 animate-bounce" />
              <span>{uploading ? 'Uploading...' : 'Ganti Foto'}</span>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              {profile?.full_name}
            </h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
              <Shield className="w-3.5 h-3.5" />
              {formatRole(profile?.role)}
            </span>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Klik pada lingkaran foto untuk memperbarui gambar avatar profile Anda.
            </p>
          </div>
        </div>

        {/* SEKTOR TENGAH: GRID FIELDS FORMULIR (PREMIUM DISABLED LOOK) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Field Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
              Nama Lengkap Karyawan
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                value={profile?.full_name || ''} 
                disabled 
                className="w-full text-xs md:text-sm bg-gray-50/70 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800/80 pl-10 pr-4 py-3 rounded-xl cursor-not-allowed font-semibold transition-colors shadow-inner"
              />
            </div>
          </div>

          {/* Field Nomor Induk Karyawan (NIK) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
              Nomor Induk Karyawan (NIK)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Shield className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                value={profile?.nik || ''} 
                disabled 
                className="w-full text-xs md:text-sm bg-gray-50/70 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800/80 pl-10 pr-4 py-3 rounded-xl cursor-not-allowed font-semibold transition-colors shadow-inner"
              />
            </div>
          </div>

          {/* FIELD KONDISIONAL: HANYA MUNCUL JIKA USER ADALAH ADMIN CABANG */}
          {profile?.role === 'admin_cabang' && (
            <>
              {/* Field Nama Unit Cabang */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  Penugasan Kantor Cabang
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <Building className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={profile?.branches ? `${profile.branches.nama_cabang} - ${profile.branches.kabupaten_kota}` : 'Belum Ditentukan'} 
                    disabled 
                    className="w-full text-xs md:text-sm bg-gray-50/70 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800/80 pl-10 pr-4 py-3 rounded-xl cursor-not-allowed font-semibold transition-colors shadow-inner"
                  />
                </div>
              </div>

              {/* Field Cakupan Provinsi */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  Cakupan Wilayah Provinsi
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={profile?.branches?.provinsi || 'Belum Ditentukan'} 
                    disabled 
                    className="w-full text-xs md:text-sm bg-gray-50/70 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800/80 pl-10 pr-4 py-3 rounded-xl cursor-not-allowed font-semibold transition-colors shadow-inner"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* KOTAK INFORMASI KEBIJAKAN (Teks Menyesuaikan Role Secara Dinamis) */}
        <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 rounded-2xl text-xs flex items-start gap-3 leading-relaxed font-medium shadow-xs">
          <Info className="w-4 h-4 shrink-0 text-blue-500 dark:text-blue-400 mt-0.5" />
          <span>
            Akun Anda sepenuhnya dikelola oleh sistem pusat keamanan PRIOLO. Perubahan data krusial seperti NIK, nama lengkap, serta {profile?.role === 'admin_cabang' ? 'mutasi wilayah penugasan kantor cabang' : 'tingkat otorisasi hak akses penilai'} hanya dapat diproses secara resmi melalui koordinasi langsung dengan tim <strong>Super Admin</strong>.
          </span>
        </div>

        {/* SEKTOR BAWAH: AKSI SESSION KELUAR */}
        <div className="pt-5 border-t border-gray-100 dark:border-gray-800/60 flex justify-end">
          <button
            onClick={handleLogoutTrigger}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-red-600/10 hover:shadow-red-600/20 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Keluar dari Sistem
          </button>
        </div>
        
      </div>

      {/* ========================================================================= */}
      {/* CUSTOM MODAL KONFIRMASI KELUAR (LOGOUT) */}
      {/* ========================================================================= */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <img src="/icons/icon-hand.svg" alt="Confirm Logout" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              Apakah Anda yakin ingin keluar dari aplikasi PRIOLO?
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                No
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
                  'Yes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOM MODAL SUKSES (UNIVERSAL UNTUK LOGOUT / AVATAR UPDATE) */}
      {/* ========================================================================= */}
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