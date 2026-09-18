'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile, logoutAction } from '@/actions/auth';
import { getNotificationsAction } from '@/actions/superadmin';

export default function HeaderMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    async function loadProfile() {
      const res = await getCurrentProfile();
      if (res && res.success) {
        setProfile(res.profile);
      }
    }

    async function loadUnreadNotifications() {
      const res = await getNotificationsAction();
      if (res && res.success) {
        const unreadItems = res.data.filter((item: any) => !item.is_read);
        setUnreadCount(unreadItems.length);
      }
    }

    loadProfile();
    loadUnreadNotifications();

    const intervalId = setInterval(() => {
      loadUnreadNotifications();
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [pathname]);

  const isActive = (path: string) => pathname === path;
  const isDaftarUserActive = (subPath: string) => pathname.includes(`/daftaruser/${subPath}`);
  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'S';

  const handleLogout = async () => {
    setIsOpen(false);
    await logoutAction();
  };

  return (
    <>
      {/* === MOBILE TOP HEADER BAR === */}
      <header className="block md:hidden bg-[#142B4D] text-white shadow-md relative z-40 h-16">
        <div className="flex items-center justify-between px-4 h-full">
          {/* LOGO & SA BADGE */}
          <Link href="/admin/super-admin" className="flex items-center space-x-2">
            <img
              src="/images/prisma-white-navbar.png"
              alt="Logo PRISMA"
              className="h-5 w-auto object-contain"
            />
            <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              SA
            </span>
          </Link>

          {/* RIGHT UTILITIES */}
          <div className="flex items-center space-x-2">
            {/* NOTIFICATION BELL */}
            <Link
              href="/admin/super-admin/notification"
              className={`p-2 rounded-full relative flex items-center justify-center ${
                isActive('/admin/super-admin/notification') ? 'bg-slate-700' : ''
              }`}
            >
              <img src="/icons/icon-notification.svg" alt="Notif" className="w-5 h-5 brightness-0 invert" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[14px] h-[14px] bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center px-0.5 border border-slate-900 shadow-xs animate-pulse">
                  {unreadCount > 15 ? '15+' : unreadCount}
                </span>
              )}
            </Link>

            {/* HAMBURGER TOGGLE BUTTON */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-xl focus:outline-hidden hover:bg-slate-700 rounded-lg transition-colors text-slate-200"
              aria-label="Toggle Menu"
            >
              {isOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* === MOBILE SIDEBAR DRAWER OVERLAY === */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Sidebar Content */}
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-[#142B4D] text-slate-200 h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <Link
                href="/admin/super-admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2"
              >
                <img
                  src="/images/prisma-white-navbar.png"
                  alt="Logo PRISMA"
                  className="h-5 w-auto object-contain"
                />
                <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  SA
                </span>
              </Link>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 text-xs font-semibold tracking-wide">
              {/* GROUP 1: RINGKASAN */}
              <div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  RINGKASAN
                </p>
                <div className="space-y-1">
                  <Link
                    href="/admin/super-admin"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive('/admin/super-admin')
                        ? 'bg-[#1D3557] text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Ulok Dashboard</span>
                  </Link>

                  <Link
                    href="/admin/super-admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <span>Clustering Dashboard</span>
                  </Link>

                  <Link
                    href="/admin/super-admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  >
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
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive('/admin/super-admin')
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Super Admin</span>
                  </Link>

                  <Link
                    href="/admin/super-admin/daftaruser/admincabang"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isDaftarUserActive('admincabang')
                        ? 'bg-[#1D3557] text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Admin Cabang</span>
                  </Link>

                  <Link
                    href="/admin/super-admin/daftaruser/assessor"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isDaftarUserActive('assessor')
                        ? 'bg-[#1D3557] text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
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
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive('/admin/super-admin/recyclebin')
                        ? 'bg-[#1D3557] text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Recycle Bin</span>
                  </Link>

                  <Link
                    href="/admin/super-admin/riwayat-login"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive('/admin/super-admin/riwayat-login')
                        ? 'bg-[#1D3557] text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
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
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive('/admin/super-admin/branches')
                        ? 'bg-[#1D3557] text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Umum</span>
                  </Link>

                  <a
                    href="#about"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
                  >
                    <span>Tentang</span>
                  </a>
                </div>
              </div>
            </nav>

            {/* Bottom Profile & Actions */}
            <div className="p-4 border-t border-slate-800 space-y-2">
              <Link
                href="/admin/super-admin/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initialLetter}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Anastasya'}</p>
                  <p className="text-[10px] text-slate-400">Pengaturan Akun</p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
