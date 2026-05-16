'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HeaderDesktop() {
  const pathname = usePathname();

  // Helper function untuk cek status active menu utama
  const isActive = (path: string) => pathname === path;

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

        {/* Profile Avatar */}
        <Link 
          href="/admin/cabang/profile"
          className={`w-10 h-10 rounded-full bg-slate-500 overflow-hidden flex items-center justify-center font-bold text-sm border-2 transition-all hover:scale-105 ${
            isActive('/admin/cabang/profile') ? 'border-white ring-2 ring-blue-400' : 'border-gray-400'
          }`}
        >
          AN
        </Link>
      </div>
    </header>
  );
}