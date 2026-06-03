'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth'; 
import { getNotificationsAction } from '@/actions/cabang';

export default function HeaderMobile() {
  const [isOpen, setIsOpen] = useState(false);
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
  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="block md:hidden bg-[#142B4D] text-white shadow-md relative z-50">
      <div className="flex items-center justify-between p-4">
        {/* === UTAMA: LOGO === */}
        <Link href="/admin/cabang" className="flex items-center">
          <img 
            src="/images/logo-priolo-white.png" 
            alt="Logo Priolo" 
            className="h-9 w-auto object-contain" 
          />
        </Link>

        {/* === AKSES: NOTIFIKASI === */}
        <div className="flex items-center space-x-2 ml-auto mr-2">
          <Link 
            href="/admin/cabang/notification" 
            className={`p-2 rounded-full relative ${isActive('/admin/cabang/notification') ? 'bg-slate-700' : ''}`}
          >
            <img src="/icons/icon-notification.svg" alt="Notif" className="w-5 h-5 brightness-0 invert" />
            {/* === NOTIFIKASI: BADGE === */}
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center px-0.5 border border-slate-900 shadow-sm animate-pulse">
                {unreadCount > 15 ? '15+' : unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* === PENGENDALI: HAMBURGER === */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-2xl p-2 focus:outline-none hover:bg-slate-700 rounded transition-colors"
        >
          {isOpen ? '✖' : '☰'}
        </button>
      </div>

      {/* === DROPDOWN: NAVIGASI MOBILE === */}
      {isOpen && (
        <nav className="bg-[#142B4D] border-t border-slate-700 p-4 flex flex-col space-y-2 font-semibold text-sm animate-fade-in">
          <Link 
            href="/admin/cabang" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/cabang') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Dashboard
          </Link>

          <Link 
            href="/admin/cabang/usulan-lokasi" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/cabang/usulan-lokasi') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Usulan Lokasi
          </Link>

          <Link 
            href="/admin/cabang/feedback" 
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-md transition-colors ${
              isActive('/admin/cabang/feedback') ? 'bg-slate-700 text-white font-bold' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Feedback
          </Link>

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

          {/* === SEKTOR: AVATAR PROFIL === */}
          <Link 
            href="/admin/cabang/profile"
            onClick={() => setIsOpen(false)}
            className={`flex items-center space-x-3 p-2 rounded-md ${
              isActive('/admin/cabang/profile') ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'
            }`}
          >
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
