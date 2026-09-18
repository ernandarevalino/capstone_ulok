'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth';

export default function HeaderDesktop() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProfile() {
      const res = await getCurrentProfile();
      if (res && res.success) {
        setProfile(res.profile);
      }
    }
    loadProfile();
  }, [pathname]);

  // Click outside to close account switcher popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => pathname === path;
  const isDaftarUserActive = (subPath: string) => pathname.includes(`/daftaruser/${subPath}`);

  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A';

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#142B4D] text-slate-200 min-h-screen shrink-0 border-r border-slate-800 select-none transition-all duration-300">
      {/* === 1. BRAND & LOGO HEADER === */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <Link href="/admin/super-admin" className="flex items-center space-x-2.5 group">
          <img
            src="/images/prisma-white-navbar.png"
            alt="Logo PRISMA"
            className="h-6 w-auto object-contain group-hover:scale-105 transition-transform"
          />
          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
            SA
          </span>
        </Link>
      </div>

      {/* === 2. SIDEBAR NAVIGATION GROUPS === */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 text-xs font-semibold tracking-wide">
        {/* GROUP 1: RINGKASAN */}
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            RINGKASAN
          </p>
          <div className="space-y-1">
            <Link
              href="/admin/super-admin"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive('/admin/super-admin')
                  ? 'bg-[#1D3557] text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              {/* Dashboard Icon */}
              <svg className="w-4 h-4 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Ulok Dashboard</span>
            </Link>

            <Link
              href="/admin/super-admin"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              {/* Clustering Icon */}
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Clustering Dashboard</span>
            </Link>

            <Link
              href="/admin/super-admin"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              {/* User Dashboard Icon */}
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>User Dashboard</span>
            </Link>
          </div>
        </div>

        {/* GROUP 2: ACCOUNT & OVERVIEW */}
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            ACCOUNT & OVERVIEW
          </p>
          <div className="space-y-1">
            <Link
              href="/admin/super-admin"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive('/admin/super-admin')
                  ? 'bg-slate-800/90 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              {/* Super Admin Icon */}
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Super Admin</span>
            </Link>

            <Link
              href="/admin/super-admin/daftaruser/admincabang"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isDaftarUserActive('admincabang')
                  ? 'bg-[#1D3557] text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              {/* Admin Cabang Icon */}
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Admin Cabang</span>
            </Link>

            <Link
              href="/admin/super-admin/daftaruser/assessor"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isDaftarUserActive('assessor')
                  ? 'bg-[#1D3557] text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              {/* Assessor Legal Icon */}
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Assessor Legal</span>
            </Link>
          </div>
        </div>

        {/* GROUP 3: ACTIVITY & LOG */}
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            ACTIVITY & LOG
          </p>
          <div className="space-y-1">
            <Link
              href="/admin/super-admin/recyclebin"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive('/admin/super-admin/recyclebin')
                  ? 'bg-[#1D3557] text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              {/* Recycle Bin Icon */}
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Recycle Bin</span>
            </Link>

            <Link
              href="/admin/super-admin/riwayat-login"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive('/admin/super-admin/riwayat-login')
                  ? 'bg-[#1D3557] text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              {/* User Log Icon */}
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>User Log</span>
            </Link>
          </div>
        </div>

        {/* GROUP 4: PENGATURAN */}
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            PENGATURAN
          </p>
          <div className="space-y-1">
            <Link
              href="/admin/super-admin/branches"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive('/admin/super-admin/branches')
                  ? 'bg-[#1D3557] text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              {/* Settings / Gear Icon */}
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              <span>Umum</span>
            </Link>

            <a
              href="#about"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              {/* About Icon */}
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Tentang</span>
            </a>
          </div>
        </div>
      </nav>

      {/* === 3. BOTTOM USER ACCOUNT CARD / SWITCHER === */}
      <div className="p-4 border-t border-slate-800/80 relative" ref={accountMenuRef}>
        {/* Account popover menu */}
        {isAccountMenuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1A2332] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-2 border-b border-slate-700/60 mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Akun Active</p>
            </div>

            {/* Current Active User */}
            <div className="flex items-center space-x-3 p-2.5 bg-slate-800/90 rounded-lg border border-slate-700">
              <div className="w-7 h-7 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Anastasya'}</p>
                <p className="text-[10px] text-slate-400 truncate">{profile?.nik || 'Super Admin'}</p>
              </div>
            </div>

            {/* Switch Account Action */}
            <button
              onClick={() => setIsAccountMenuOpen(false)}
              className="w-full flex items-center space-x-2.5 p-2.5 mt-1 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-medium transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-semibold">+</span>
              <span>Tambah Akun</span>
            </button>
          </div>
        )}

        {/* Trigger Pill at bottom */}
        <button
          onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-left transition-colors border border-slate-700/50 group"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {profile?.full_name || 'Anastasya'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">Super Admin</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
