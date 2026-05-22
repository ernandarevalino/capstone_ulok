'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentProfile, logoutAction, updateProfileNameAction } from '@/actions/auth';

export default function SuperAdminProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Ambil data profil saat halaman dimuat
  useEffect(() => {
  async function loadProfile() {
    setLoading(true);
    const res = await getCurrentProfile();
    
    // Tambahkan res.profile di pengecekan if biar TypeScript aman bray
    if (res && res.success && res.profile) { 
      setProfile(res.profile);
      setFullName(res.profile.full_name || '');
    }
    
    setLoading(false);
  }
  loadProfile();
}, []);

  // Handle proses simpan perubahan nama bray
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await updateProfileNameAction(fullName);
    if (res && res.success) {
      alert('Nama profil Super Admin berhasil diperbarui! 🎉');
      router.refresh(); // Refresh halaman agar layout header ikut ter-update
    } else {
      alert(`Gagal memperbarui profil: ${res.error}`);
    }
    setSaving(false);
  };

  // Handle fungsi Logout akun
  const handleLogout = async () => {
    const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar dari panel Super Admin PRIOLO?");
    if (!confirmLogout) return;

    const res = await logoutAction();
    if (res && res.success) {
      router.push('/');
      router.refresh();
    } else {
      alert(`Gagal logout: ${res.error}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-sm text-gray-500">
        ⚙️ Memuat data profil keamanan Super Admin...
      </div>
    );
  }

  // Ambil huruf pertama sebagai inisial dinamis
  const initialLetter = fullName ? fullName.charAt(0).toUpperCase() : 'S';

  return (
    <div className="space-y-6">
      {/* HEADER PAGE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Pengaturan Profil</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola data personal dan otoritas akun Super Admin Anda.</p>
      </div>

      {/* FORM KONTEN UTAMA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        
        {/* SEKTOR ATAS: INIDIAL AVATAR (TANPA UPLOAD) */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
          <div className="h-24 w-24 bg-[#142B4D] text-white rounded-full flex items-center justify-center font-black text-4xl shadow-md ring-4 ring-slate-100 select-none">
            {initialLetter}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-xl font-black text-gray-900">{profile?.full_name}</h3>
            <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
              Otoritas: Super Admin
            </span>
            <p className="text-xs text-gray-400">Identitas Avatar digenerate otomatis berdasarkan inisial nama Anda.</p>
          </div>
        </div>

        {/* SEKTOR TENGAH: FORM DATA */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nama Lengkap (Dapat Diedit bray!) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Lengkap</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap baru..."
                className="w-full text-xs md:text-sm bg-white text-gray-800 border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            {/* NIK Karyawan (Tetap Terkunci demi keamanan data) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nomor Induk Karyawan (NIK)</label>
              <input 
                type="text" 
                value={profile?.nik || ''} 
                disabled 
                className="w-full text-xs md:text-sm bg-gray-50 text-gray-400 border border-gray-200 px-4 py-2.5 rounded-lg cursor-not-allowed font-medium font-mono"
              />
            </div>

          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-[11px] font-medium leading-relaxed">
            💡 <b>Informasi Sistem:</b> Sebagai Super Admin, Anda berhak mengubah nama display yang muncul pada log cetak dokumen penilaian SAW. NIK terkunci permanen demi validitas audit log database.
          </div>

          {/* TOMBOL SIMPAN DATA NAMA */}
          <div className="flex justify-start pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs md:text-sm rounded-lg transition-colors shadow-sm"
            >
              {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>
        </form>

        {/* SEKTOR BAWAH: TOMBOL LOGOUT */}
        <div className="pt-5 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm rounded-lg transition-colors shadow-sm flex items-center gap-2"
          >
            👋 Keluar Dari Sistem
          </button>
        </div>

      </div>
    </div>
  );
}