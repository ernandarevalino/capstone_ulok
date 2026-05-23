'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth';

/**
 * Komponen Navigasi Utama (Header) Modul Assessor untuk Perangkat Mobile.
 * Menyediakan tampilan responsif berbasis dropdown hamburger menu pada resolusi (md:hidden).
 */
export default function HeaderMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);

  /**
   * Sinkronisasi data profil pengguna disesuaikan dengan transisi navigasi rute aktif mobile.
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

  const isActive = (path: string) => pathname === path;

  /**
   * Menentukan karakter inisial berdasarkan nama pengguna untuk keperluan fallback avatar visual mobile.
   * Menggunakan karakter default 'A' (Assessor) apabila data nama belum termuat dari database.
   */
  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A';

  return (
    <header className="block md:hidden bg-[#142B4D] text-white shadow-md relative z-50">
      <div className="flex items-center justify-between p-4">
        {/* LOGO UTAMA DAN BADGE INTEGRASI ROLE (MOBILE VIEW) */}
        <Link href="/admin/assessor" className="flex items-center">
          <img 
            src="/images/logo-priolo-white.png" 
            alt="Logo Priolo" 
            className="h-9 w-auto object-contain" 
          />
          <span className="text-[9px] bg-emerald-600 font-bold px-1.5 py-0.5 rounded ml-1.5 uppercase">
            AS
          </span>
        </Link>

        {/* INDIKATOR NOTIFIKASI SECARA LANGSUNG PADA MOBILE HEADER */}
        <div className="flex items-center space-x-2 ml-auto mr-2">
          <Link 
            href="/admin/assessor/notification" 
            className={`p-2 rounded-full relative ${isActive('/admin/assessor/notification') ? 'bg-slate-700' : ''}`}
          >
            <img src="/icons/icon-notification.svg" alt="Notif" className="w-5 h-5 brightness-0 invert" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </Link>
        </div>

        {/* PEMICU AKSI MEMBUKA / MENUTUP DROP-DOWN HAMBURGER MENU */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-2xl p-2 focus:outline-none hover:bg-slate-700 rounded transition-colors"
        >
          {isOpen ? '✖' : '☰'}
        </button>
      </div>

      {/* DROPDOWN KONTEN NAVIGASI RESPONSIVE MOBILE */}
      {isOpen && (
        <nav className="bg-[#142B4D] border-t border-slate-700 p-4 flex flex-col space-y-2 font-semibold text-sm animate-fade-in">
          {/* Tautan Dashboard */}
          <Link 
            href="/admin/assessor" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/assessor') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Dashboard
          </Link>

          {/* Tautan Menu Penilaian */}
          <Link 
            href="/admin/assessor/penilaian" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/assessor/penilaian') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Penilaian
          </Link>

          {/* Tautan Menu Histori */}
          <Link 
            href="/admin/assessor/histori" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/assessor/histori') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Histori
          </Link>

          {/* Tautan Menu Peringkat */}
          <Link 
            href="/admin/assessor/peringkat" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/assessor/peringkat') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Peringkat
          </Link>

          {/* Batas Garis Horisontal Menu */}
          <hr className="border-slate-700 my-2" />

          {/* SEKTOR RINGKASAN DATA PROFIL AKUN PADA BAGIAN BAWAH MENU MOBILE */}
          <Link 
            href="/admin/assessor/profile"
            onClick={() => setIsOpen(false)}
            className={`flex items-center space-x-3 p-2 rounded-md ${
              isActive('/admin/assessor/profile') ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'
            }`}
          >
            {/* Wadah Tampilan Bulat Gambar Avatar Pengguna */}
            <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs text-white border border-gray-400 shrink-0 ${!profile?.avatar_url ? 'bg-slate-500' : ''}`}>
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile Mobile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>

            {/* Blok Informasi Nama Lengkap Assessor */}
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold tracking-wide block truncate max-w-37.5">
                {profile?.full_name || 'Loading...'}
              </span>
              <span className="text-[10px] text-gray-400 block">Lihat Profil Assessor</span>
            </div>
          </Link>
        </nav>
      )}
    </header>
  );
}