'use client';

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth'; // Ambil data profil dari server action

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

  // Logika penentuan inisial nama bray
  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="block md:hidden bg-[#142B4D] text-white shadow-md relative z-50">
      <div className="flex items-center justify-between p-4">
        {/* Logo */}
        <Link href="/admin/cabang" className="flex items-center">
          <img 
            src="/images/logo-priolo-white.png" 
            alt="Logo Priolo" 
            className="h-9 w-auto object-contain" 
          />
        </Link>

        {/* Notif Icon di Mobile (Biar user tahu ada notif masuk tanpa buka burger menu) */}
        <div className="flex items-center space-x-2 ml-auto mr-2">
          <Link 
            href="/admin/cabang/notification" 
            className={`p-2 rounded-full relative ${isActive('/admin/cabang/notification') ? 'bg-slate-700' : ''}`}
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
            href="/admin/cabang" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/cabang') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Dashboard
          </Link>

          {/* Usulan Lokasi */}
          <Link 
            href="/admin/cabang/usulan-lokasi" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/cabang/usulan-lokasi') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Usulan Lokasi
          </Link>

          {/* Feedback */}
          <Link 
            href="/admin/cabang/feedback" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/cabang/feedback') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Feedback
          </Link>

          {/* Peringkat */}
          <Link 
            href="/admin/cabang/peringkat" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/cabang/peringkat') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Peringkat
          </Link>

          <hr className="border-slate-700 my-2" />

          {/* Bagian Profile Target Mobile */}
          <Link 
            href="/admin/cabang/profile"
            onClick={() => setIsOpen(false)}
            className={`flex items-center space-x-3 p-2 rounded-md ${
              isActive('/admin/cabang/profile') ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'
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
              <span className="text-[10px] text-gray-400 block">Lihat Profil</span>
            </div>
          </Link>
        </nav>
      )}
    </header>
  );
}