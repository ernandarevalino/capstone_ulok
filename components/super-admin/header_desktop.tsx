'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth'; 

/**
 * Komponen Navigasi Utama (Header) untuk Perangkat Desktop.
 * Menggunakan direktif 'use client' karena bergantung pada hooks navigasi (usePathname)
 * dan manajemen state lokal untuk menampilkan informasi profil pengguna secara dinamis.
 */
export default function HeaderDesktop() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);

  /**
   * Mengambil data profil pengguna yang sedang aktif setiap kali terjadi perubahan pola URL (pathname).
   * Hal ini memastikan data foto profil atau nama terbaharui secara konsisten.
   */
  useEffect(() => {
    async function loadProfile() {
      const res = await getCurrentProfile();
      if (res && res.success) {
        setProfile(res.profile);
      }
    }
    loadProfile();
  }, [pathname]);

  /**
   * Fungsi helper untuk memvalidasi status keaktifan menu berdasarkan URL saat ini.
   * @param path - String rute URL tujuan.
   * @returns Nilai boolean yang menandakan kecocokan URL.
   */
  const isActive = (path: string) => pathname === path;
  
  /**
   * Fungsi helper khusus untuk mendeteksi segmentasi sub-halaman pada modul manajemen pengguna.
   * @param subPath - String segmentasi URL setelah folder '/daftaruser/'.
   * @returns Nilai boolean.
   */
  const isDaftarUserActive = (subPath: string) => pathname.includes(`/daftaruser/${subPath}`);

  /**
   * Menentukan karakter inisial berdasarkan nama pengguna untuk keperluan fallback avatar visual.
   * Menggunakan karakter default 'S' (Super Admin) apabila data nama belum termuat dari database.
   */
  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'S';

  return (
    <header className="hidden md:flex items-center justify-between bg-[#142B4D] px-8 py-4 shadow-md text-white">
      {/* IDENTITAS APLIKASI (BRAND LOGO) */}
      <Link href="/admin/super-admin" className="flex items-center hover:opacity-90 transition-opacity">
        <img 
          src="/images/logo-priolo-white.png" 
          alt="Logo Priolo" 
          className="h-12 w-auto object-contain" 
        />
      </Link>

      {/* STRUKTUR NAVIGASI UTAMA SUPER ADMIN */}
      <nav className="flex items-center space-x-8 text-sm font-semibold">
        {/* Menu Dashboard */}
        <Link 
          href="/admin/super-admin" 
          className={`pb-1 transition-colors border-b-2 ${
            isActive('/admin/super-admin') 
              ? 'text-white border-white' 
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Dashboard
        </Link>

        {/* Menu Manajemen Data Admin Cabang */}
        <Link 
          href="/admin/super-admin/daftaruser/admincabang" 
          className={`pb-1 transition-colors border-b-2 ${
            isDaftarUserActive('admincabang') 
              ? 'text-white border-white' 
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Admin Cabang
        </Link>

        {/* Menu Manajemen Data Assessor */}
        <Link 
          href="/admin/super-admin/daftaruser/assessor" 
          className={`pb-1 transition-colors border-b-2 ${
            isDaftarUserActive('assessor') 
              ? 'text-white border-white' 
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Assessor
        </Link>
      </nav>

      {/* SEKTOR INFORMASI PENGGUNA DAN NOTIFIKASI */}
      <div className="flex items-center space-x-5">
        {/* Navigasi Pusat Notifikasi Sistem */}
        <Link 
          href="/admin/super-admin/notification" 
          className={`p-2 rounded-full transition-colors flex items-center justify-center relative group ${
            isActive('/admin/super-admin/notification') ? 'bg-slate-700' : 'hover:bg-slate-700/50'
          }`}
        >
          <img 
            src="/icons/icon-notification.svg" 
            alt="Notification Icon" 
            className="w-6 h-6 object-contain brightness-0 invert" 
          />
          {/* Indikator Titik Merah (Badge Notifikasi Baru) */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </Link>

        {/* Navigasi Pengaturan Profil Komponen Avatar */}
        <Link 
          href="/admin/super-admin/profile"
          className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm border-2 transition-all hover:scale-105 ${
            isActive('/admin/super-admin/profile') 
              ? 'border-white ring-2 ring-blue-400' 
              : 'border-gray-400'
          } ${!profile?.avatar_url ? 'bg-slate-500 text-white' : ''}`}
        >
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initialLetter}</span>
          )}
        </Link>
      </div>
    </header>
  );
}