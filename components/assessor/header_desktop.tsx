'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth';
import { getNotificationsAction } from '@/actions/assessor';

export default function HeaderDesktop() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let intervalId: any;

    async function loadData() {
      const res = await getCurrentProfile();
      if (res && res.success && res.profile) {
        setProfile(res.profile);
        const uId = res.profile.id;

        const fetchUnread = async () => {
          const resNotif = await getNotificationsAction(uId);
          if (resNotif && resNotif.success) {
            const unreadItems = resNotif.data.filter((item: any) => !item.is_read);
            setUnreadCount(unreadItems.length);
          }
        };

        await fetchUnread();

        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(fetchUnread, 10000);
      }
    }

    loadData();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pathname]);

  const isActive = (path: string) => pathname === path;
  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A';

  return (
    <header className="hidden md:flex items-center justify-between bg-[#142B4D] px-8 py-4 shadow-md text-white">
      {/* === UTAMA: LOGO === */}
      <Link href="/admin/assessor" className="flex items-center hover:opacity-90 transition-opacity">
        <img 
          src="/images/logo-priolo-white.png" 
          alt="Logo Priolo" 
          className="h-12 w-auto object-contain" 
        />
      </Link>

      {/* === NAVIGASI: MENU AKUN ASSESSOR === */}
      <nav className="flex items-center space-x-8 text-sm font-semibold">
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

      {/* === PANEL: INFORMASI PENGGUNA === */}
      <div className="flex items-center space-x-5">
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
          {/* === NOTIFIKASI: BADGE === */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center px-1 border border-slate-900 shadow-sm animate-pulse">
              {unreadCount > 15 ? '15+' : unreadCount}
            </span>
          )}
        </Link>

        {/* === SEKTOR: AVATAR PROFIL === */}
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
