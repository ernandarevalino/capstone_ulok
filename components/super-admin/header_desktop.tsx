'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth'; 
import { getNotificationsAction } from '@/actions/superadmin';

export default function HeaderDesktop() {
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

  return (
    <header className="hidden md:flex items-center justify-between bg-[#142B4D] px-8 py-4 shadow-md text-white">
      {/* === UTAMA: LOGO === */}
      <Link href="/admin/super-admin" className="flex items-center hover:opacity-90 transition-opacity">
        <img 
          src="/images/logo-priolo-white.png" 
          alt="Logo Priolo" 
          className="h-12 w-auto object-contain" 
        />
      </Link>

      {/* === NAVIGASI: MENU SUPER ADMIN === */}
      <nav className="flex items-center space-x-8 text-sm font-semibold">
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

      {/* === PANEL: INFORMASI PENGGUNA === */}
      <div className="flex items-center space-x-5">
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
          {/* === NOTIFIKASI: BADGE === */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center px-1 border border-slate-900 shadow-sm animate-pulse">
              {unreadCount > 15 ? '15+' : unreadCount}
            </span>
          )}
        </Link>

        {/* === SEKTOR: AVATAR PROFIL === */}
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
