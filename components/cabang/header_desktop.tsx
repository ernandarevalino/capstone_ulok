'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth'; // Ambil data profil dari server action

export default function HeaderDesktop() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);

  // Ambil data profil user saat komponen desktop dimuat
  useEffect(() => {
    async function loadProfile() {
      const res = await getCurrentProfile();
      if (res && res.success) {
        setProfile(res.profile);
      }
    }
    loadProfile();
  }, [pathname]); // pathname dimasukkan agar ikut me-refresh data saat user berpindah halaman

  const isActive = (path: string) => pathname === path;

  // Logika penentuan inisial nama bray
  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="hidden md:flex items-center justify-between bg-[#142B4D] px-8 py-4 shadow-md text-white">
      {/* Brand Logo */}
      <Link href="/admin/cabang" className="flex items-center hover:opacity-90 transition-opacity">
        <img 
          src="/images/logo-priolo-white.png" 
          alt="Logo Priolo" 
          className="h-12 w-auto object-contain" 
        />
      </Link>

      {/* Menu Navigasi Desktop dengan Logika Aktif */}
      <nav className="flex items-center space-x-8 text-sm font-semibold">
        {/* Dashboard */}
        <Link 
          href="/admin/cabang" 
          className={`pb-1 transition-colors border-b-2 ${
            isActive('/admin/cabang') 
              ? 'text-white border-white' 
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Dashboard
        </Link>

        {/* Usulan Lokasi */}
        <Link 
          href="/admin/cabang/usulan-lokasi" 
          className={`pb-1 transition-colors border-b-2 ${
            isActive('/admin/cabang/usulan-lokasi') 
              ? 'text-white border-white' 
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Usulan Lokasi
        </Link>

        {/* Feedback */}
        <Link 
          href="/admin/cabang/feedback" 
          className={`pb-1 transition-colors border-b-2 ${
            isActive('/admin/cabang/feedback') 
              ? 'text-white border-white' 
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Feedback
        </Link>

        {/* Peringkat */}
        <Link 
          href="/admin/cabang/peringkat" 
          className={`pb-1 transition-colors border-b-2 ${
            isActive('/admin/cabang/peringkat') 
              ? 'text-white border-white' 
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Peringkat
        </Link>
      </nav>

      {/* Profile & Notif */}
      <div className="flex items-center space-x-5">
        {/* Tombol Notifikasi */}
        <Link 
          href="/admin/cabang/notification" 
          className={`p-2 rounded-full transition-colors flex items-center justify-center relative group ${
            isActive('/admin/cabang/notification') ? 'bg-slate-700' : 'hover:bg-slate-700/50'
          }`}
        >
          <img 
            src="/icons/icon-notification.svg" 
            alt="Notification Icon" 
            className="w-6 h-6 object-contain brightness-0 invert" 
          />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </Link>

        {/* Bagian Profile Avatar */}
        <Link 
          href="/admin/cabang/profile"
          className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm border-2 transition-all hover:scale-105 ${
            isActive('/admin/cabang/profile') 
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