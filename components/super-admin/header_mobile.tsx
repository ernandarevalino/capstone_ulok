'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth'; // Mengambil data profile dari server action

export default function HeaderMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);

  // Ambil data profil user saat komponen mobile dimuat
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
  const isDaftarUserActive = (subPath: string) => pathname.includes(`/daftaruser/${subPath}`);

  // Logika penentuan inisial nama bray
  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'S';

  return (
    <header className="block md:hidden bg-[#142B4D] text-white shadow-md relative z-50">
      <div className="flex items-center justify-between p-4">
        {/* Logo */}
        <Link href="/admin/super-admin" className="flex items-center">
          <img 
            src="/images/logo-priolo-white.png" 
            alt="Logo Priolo" 
            className="h-9 w-auto object-contain" 
          />
          <span className="text-[9px] bg-blue-600 font-bold px-1.5 py-0.5 rounded ml-1.5 uppercase">
            SA
          </span>
        </Link>

        {/* Notif Icon di Mobile */}
        <div className="flex items-center space-x-2 ml-auto mr-2">
          <Link 
            href="/admin/super-admin/notification" 
            className={`p-2 rounded-full relative ${isActive('/admin/super-admin/notification') ? 'bg-slate-700' : ''}`}
          >
            <img src="/icons/icon-notification.svg" alt="Notif" className="w-5 h-5 brightness-0 invert" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </Link>
        </div>

        {/* Hamburger Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-2xl p-2 focus:outline-none hover:bg-slate-700 rounded transition-colors"
        >
          {isOpen ? '✖' : '☰'}
        </button>
      </div>

      {/* Dropdown Menu Mobile */}
      {isOpen && (
        <nav className="bg-[#142B4D] border-t border-slate-700 p-4 flex flex-col space-y-2 font-semibold text-sm animate-fade-in">
          {/* Dashboard */}
          <Link 
            href="/admin/super-admin" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/super-admin') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Dashboard
          </Link>

          {/* Daftar Admin Cabang */}
          <Link 
            href="/admin/super-admin/daftaruser/admincabang" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isDaftarUserActive('admincabang') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Daftar Admin Cabang
          </Link>

          {/* Daftar Assessor */}
          <Link 
            href="/admin/super-admin/daftaruser/assesor" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isDaftarUserActive('assesor') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Daftar Assessor
          </Link>

          <hr className="border-slate-700 my-2" />

          {/* Bagian Profile Target Mobile */}
          <Link 
            href="/admin/super-admin/profile"
            onClick={() => setIsOpen(false)}
            className={`flex items-center space-x-3 p-2 rounded-md ${
              isActive('/admin/super-admin/profile') ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'
            }`}
          >
            {/* Avatar Bulat */}
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

            {/* Info Nama Teks */}
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold tracking-wide block truncate max-w-37.5">
                {profile?.full_name || 'Loading...'}
              </span>
              <span className="text-[10px] text-gray-400 block">Lihat Profil Super Admin</span>
            </div>
          </Link>
        </nav>
      )}
    </header>
  );
}