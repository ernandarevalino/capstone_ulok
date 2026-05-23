'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth';

/**
 * Komponen Navigasi Utama (Header) Modul Assessor untuk Perangkat Desktop.
 * Mengelola kecocokan URL aktif menggunakan Next.js `usePathname` dan memuat
 * data profil assessor secara realtime melalui Server Action.
 */
export default function HeaderDesktop() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);

  /**
   * Mengambil data profil assessor yang sedang aktif saat komponen desktop dimuat.
   * Parameter 'pathname' memicu pembaruan berkala ketika terjadi navigasi halaman.
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
   * Memeriksa status keaktifan menu navigasi berdasarkan perbandingan URL saat ini.
   * @param path - String rute URL tujuan.
   * @returns Nilai boolean penanda rute aktif.
   */
  const isActive = (path: string) => pathname === path;

  /**
   * Menentukan karakter inisial berdasarkan nama pengguna untuk keperluan fallback avatar visual.
   * Menggunakan karakter default 'A' (Assessor) apabila data nama belum termuat dari database.
   */
  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A';

  return (
    <header className="hidden md:flex items-center justify-between bg-[#142B4D] px-8 py-4 shadow-md text-white">
      {/* IDENTITAS BRAND LOGO MODUL ASSESSOR */}
      <Link href="/admin/assessor" className="flex items-center hover:opacity-90 transition-opacity">
        <img 
          src="/images/logo-priolo-white.png" 
          alt="Logo Priolo" 
          className="h-12 w-auto object-contain" 
        />
      </Link>

      {/* STRUKTUR NAVIGASI UTAMA AKUN ASSESSOR */}
      <nav className="flex items-center space-x-8 text-sm font-semibold">
        {/* Menu Dashboard */}
        <Link 
          href="/admin/assessor" 
          className={`pb-1 transition-colors border-b-2 ${
            isActive('/admin/assessor') 
              ? 'text-white border-white' 
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Dashboard
        </Link>

        {/* Menu Penilaian Berkas Usulan */}
        <Link 
          href="/admin/assessor/penilaian" 
          className={`pb-1 transition-colors border-b-2 ${
            isActive('/admin/assessor/penilaian') 
              ? 'text-white border-white' 
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Penilaian
        </Link>

        {/* Menu Histori Rekam Jejak Penilaian */}
        <Link 
          href="/admin/assessor/histori" 
          className={`pb-1 transition-colors border-b-2 ${
            isActive('/admin/assessor/histori') 
              ? 'text-white border-white' 
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Histori
        </Link>

        {/* Menu Peringkat Hasil SPK / Evaluasi Akhir */}
        <Link 
          href="/admin/assessor/peringkat" 
          className={`pb-1 transition-colors border-b-2 ${
            isActive('/admin/assessor/peringkat') 
              ? 'text-white border-white' 
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Peringkat
        </Link>
      </nav>

      {/* SEKTOR INTEGRASI INFORMASI AKUN DAN NOTIFIKASI */}
      <div className="flex items-center space-x-5">
        {/* Navigasi Menu Pusat Notifikasi Assessor */}
        <Link 
          href="/admin/assessor/notification" 
          className={`p-2 rounded-full transition-colors flex items-center justify-center relative group ${
            isActive('/admin/assessor/notification') ? 'bg-slate-700' : 'hover:bg-slate-700/50'
          }`}
        >
          <img 
            src="/icons/icon-notification.svg" 
            alt="Notification Icon" 
            className="w-6 h-6 object-contain brightness-0 invert" 
          />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </Link>

        {/* Navigasi Halaman Pengaturan Profil Komponen Avatar */}
        <Link 
          href="/admin/assessor/profile"
          className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm border-2 transition-all hover:scale-105 ${
            isActive('/admin/assessor/profile') 
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