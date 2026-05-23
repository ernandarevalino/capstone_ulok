'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getCurrentProfile, updateAvatarAction, logoutAction } from '@/actions/auth'; 
import { useRouter } from 'next/navigation'; 

/**
 * Komponen Global untuk Menampilkan dan Mengelola Profil Pengguna.
 * Komponen ini bersifat Client Component ('use client') karena memerlukan interaksi state,
 * hooks efek (useEffect), referensi objek (useRef), dan navigasi router (useRouter).
 * Diperbarui untuk mendukung visualisasi relasi wilayah penugasan Admin Cabang.
 */
export default function ProfileGlobal() {
  // Deklarasi State Komponen
  const [profile, setProfile] = useState<any>(null);          // Menyimpan objek data profil pengguna
  const [loading, setLoading] = useState(true);               // Menandakan status pemuatan data awal
  const [uploading, setUploading] = useState(false);           // Menandakan status proses unggah (upload) foto
  const fileInputRef = useRef<HTMLInputElement>(null);        // Referensi manipulasi DOM untuk input berkas tersembunyi
  const router = useRouter();                                 // Instance router untuk kebutuhan navigasi halaman

  /**
   * Siklus hidup komponen (Lifecycle Method):
   * Mengeksekusi fungsi pengambilan data profil sesaat setelah komponen berhasil dimuat ke dalam DOM.
   */
  useEffect(() => {
    fetchProfileData();
  }, []);

  /**
   * Mengambil data profil terkini beserta data relasi cabang dari database melalui Server Action.
   */
  async function fetchProfileData() {
    setLoading(true);
    const res = await getCurrentProfile();
    if (res && res.success) {
      setProfile(res.profile);
    }
    setLoading(false);
  }

  /**
   * Memicu (trigger) aksi klik secara programatis pada elemen input file HTML yang disembunyikan.
   */
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Menangani perubahan berkas gambar yang dipilih oleh pengguna untuk kemudian
   * diunggah ke storage sistem.
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', files[0]); // Memasukkan berkas ke dalam objek FormData

    // Mengirim data form ke Server Action untuk pemrosesan unggah berkas
    const res = await updateAvatarAction(formData);
    if (res && res.success) {
      // Memperbarui state profil lokal secara reaktif dengan URL avatar baru
      setProfile((prev: any) => ({ ...prev, avatar_url: res.avatarUrl }));
      alert('Foto profil berhasil diperbarui! 🎉');
    } else {
      alert(`Gagal upload: ${res.error}`);
    }
    setUploading(false);
  };

  /**
   * Menangani proses pemutusan sesi autentikasi pengguna (Sign Out).
   */
  const handleLogout = async () => {
    const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar dari aplikasi PRIOLO?");
    if (!confirmLogout) return;

    const res = await logoutAction();
    if (res && res.success) {
      // Mengarahkan pengguna kembali ke halaman root/login dan menyegarkan data router
      router.push('/');
      router.refresh();
    } else {
      alert(`Gagal logout: ${res.error}`);
    }
  };

  // Antarmuka transisi saat data profil masih dalam proses pemuatan (Fetch Sesi)
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-sm text-gray-500">
        Memuat data profil...
      </div>
    );
  }

  // Menentukan huruf inisial berdasarkan nama pengguna, default berupa karakter 'U' jika tidak ditemukan
  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';

  /**
   * Memformat string role pengguna dari database agar lebih representatif di halaman antarmuka.
   */
  const formatRole = (role: string) => {
    if (role === 'admin_cabang') return 'Admin Cabang';
    if (role === 'assessor') return 'Assessor';
    return role;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      
      {/* SEKTOR ATAS: DETAIL FOTO PROFIL & RINGKASAN DATA AKUN */}
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
          
          {/* Overlay Efek Hover untuk Indikator Ganti Gambar */}
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? 'Uploading...' : 'Ganti Foto'}
          </div>

          {/* Elemen Input File (Tersembunyi demi estetika desain antarmuka) */}
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

      {/* SEKTOR TENGAH: FORM FIELD INFORMASI MASTER USER (STATUS UTAMA: DISABLED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field Nama Lengkap */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</label>
          <input 
            type="text" 
            value={profile?.full_name || ''} 
            disabled 
            className="w-full text-xs md:text-sm bg-gray-50 text-gray-500 border border-gray-200 px-4 py-2.5 rounded-lg cursor-not-allowed font-medium"
          />
        </div>

        {/* Field Nomor Induk Karyawan (NIK) */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Nomor Induk Karyawan (NIK)</label>
          <input 
            type="text" 
            value={profile?.nik || ''} 
            disabled 
            className="w-full text-xs md:text-sm bg-gray-50 text-gray-500 border border-gray-200 px-4 py-2.5 rounded-lg cursor-not-allowed font-medium"
          />
        </div>

        {/* FIELD KONDISIONAL: HANYA TAMPIL JIKA USER ADALAH ADMIN CABANG */}
        {profile?.role === 'admin_cabang' && (
          <>
            {/* Field Nama Unit Cabang / Kab-Kota */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Penugasan Cabang / Kota</label>
              <input 
                type="text" 
                value={profile?.branches ? `${profile.branches.nama_cabang} - ${profile.branches.kabupaten_kota}` : 'Belum Ditentukan'} 
                disabled 
                className="w-full text-xs md:text-sm bg-gray-50 text-gray-500 border border-gray-200 px-4 py-2.5 rounded-lg cursor-not-allowed font-medium"
              />
            </div>

            {/* Field Cakupan Provinsi */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Cakupan Wilayah Provinsi</label>
              <input 
                type="text" 
                value={profile?.branches?.provinsi || 'Belum Ditentukan'} 
                disabled 
                className="w-full text-xs md:text-sm bg-gray-50 text-gray-500 border border-gray-200 px-4 py-2.5 rounded-lg cursor-not-allowed font-medium"
              />
            </div>
          </>
        )}
      </div>
      
      {/* Kotak Informasi Aturan Hak Akses Data Terkait Kebijakan RLS / Manajemen DB */}
      <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium">
        Akun Anda dikelola oleh sistem pusat. Perubahan data NIK, nama, serta mutasi perpindahan wilayah cabang hanya dapat diajukan melalui tim Super Admin.
      </div>

      {/* SEKTOR BAWAH: AKSI KELUAR SISTEM (LOGOUT SESSION) */}
      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm rounded-lg transition-colors shadow-sm flex items-center gap-2"
        >
          Logout
        </button>
      </div>
    </div>
  );
}