'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getCurrentProfile, updateAvatarAction, logoutAction } from '@/actions/auth'; // Impor logoutAction di sini bray
import { useRouter } from 'next/navigation'; // Untuk mengarahkan user kembali ke halaman login setelah logout

export default function ProfileGlobal() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter(); // Inisialisasi router Next.js

  // Load data profil saat komponen dipasang
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

  // Trigger klik pada input file yang disembunyikan
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle perubahan file (Proses Upload)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', files[0]);

    const res = await updateAvatarAction(formData);
    if (res && res.success) {
      setProfile((prev: any) => ({ ...prev, avatar_url: res.avatarUrl }));
      alert('Foto profil berhasil diperbarui! 🎉');
    } else {
      alert(`Gagal upload: ${res.error}`);
    }
    setUploading(false);
  };

  // Handle Fungsi Keluar / Logout Akun
  const handleLogout = async () => {
    const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar dari aplikasi PRIOLO?");
    if (!confirmLogout) return;

    const res = await logoutAction();
    if (res && res.success) {
      // Jika berhasil logout, langsung tendang ke halaman login utama bray
      router.push('/');
      router.refresh();
    } else {
      alert(`Gagal logout: ${res.error}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-sm text-gray-500">
        Memuat data profil...
      </div>
    );
  }

  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';

  const formatRole = (role: string) => {
    if (role === 'admin_cabang') return 'Admin Cabang';
    if (role === 'assessor') return 'Assessor / Penilai';
    if (role === 'super_admin') return 'Super Admin';
    return role;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      {/* SEKTOR ATAS: AVATAR & RINGKASAN */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Foto Profil" 
              className="h-24 w-24 rounded-full object-cover border-2 border-gray-200 group-hover:opacity-70 transition-all shadow-md"
            />
          ) : (
            <div className="h-24 w-24 bg-[#142B4D] text-white rounded-full flex items-center justify-center font-black text-3xl group-hover:bg-slate-700 transition-all shadow-md">
              {initialLetter}
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? 'Uploading...' : 'Ganti Foto'}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="text-center sm:text-left">
          <h3 className="text-xl font-bold text-gray-800">{profile?.full_name}</h3>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border">
            {formatRole(profile?.role)}
          </span>
          <p className="text-xs text-gray-400 mt-2">Klik foto untuk melakukan perubahan gambar profile.</p>
        </div>
      </div>

      {/* SEKTOR TENGAH: DATA FORM FIELD (DISABLED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</label>
          <input 
            type="text" 
            value={profile?.full_name || ''} 
            disabled 
            className="w-full text-xs md:text-sm bg-gray-50 text-gray-500 border border-gray-200 px-4 py-2.5 rounded-lg cursor-not-allowed font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Nomor Induk Karyawan (NIK)</label>
          <input 
            type="text" 
            value={profile?.nik || ''} 
            disabled 
            className="w-full text-xs md:text-sm bg-gray-50 text-gray-500 border border-gray-200 px-4 py-2.5 rounded-lg cursor-not-allowed font-medium"
          />
        </div>
      </div>
      
      <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium">
        ℹ️ Akun Anda dikelola oleh sistem pusat. Perubahan data NIK dan nama hanya dapat diajukan melalui tim Super Admin.
      </div>

      {/* SEKTOR BAWAH: TOMBOL LOGOUT AMAN */}
      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm rounded-lg transition-colors shadow-sm flex items-center gap-2"
        >
          👋 Keluar dari Akun
        </button>
      </div>
    </div>
  );
}