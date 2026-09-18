'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile, logoutAction } from '@/actions/auth';
import { getNotificationsAction } from '@/actions/superadmin';

interface HeaderTopbarProps {
  onToggleSidebar?: () => void;
}

export default function HeaderTopbar({ onToggleSidebar }: HeaderTopbarProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determine active page title based on pathname
  const getPageTitle = () => {
    if (pathname === '/admin/super-admin') return 'Dashboard';
    if (pathname.includes('/daftaruser/admincabang')) return 'Daftar Admin Cabang';
    if (pathname.includes('/daftaruser/assessor')) return 'Daftar Assessor';
    if (pathname.includes('/riwayat-login')) return 'User Activity Log';
    if (pathname.includes('/recyclebin')) return 'Recycle Bin';
    if (pathname.includes('/profile')) return 'Profil Super Admin';
    if (pathname.includes('/notification')) return 'Notifikasi';
    if (pathname.includes('/branches')) return 'Manajemen Cabang';
    return 'Dashboard';
  };

  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'S';

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <header className="h-16 bg-white dark:bg-[#0D0D0D] border-b border-gray-200 dark:border-gray-800 px-4 md:px-8 flex items-center justify-between shadow-xs sticky top-0 z-30 transition-colors duration-200">
      {/* === LEFT: SIDEBAR TOGGLE & PAGE TITLE === */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        )}
        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* === RIGHT: ROLE BADGE, PROFILE DROPDOWN & NOTIFICATION === */}
      <div className="flex items-center space-x-4">
        {/* Role label indicator */}
        <span className="hidden sm:inline-block text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">
          Super Admin
        </span>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2.5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-full bg-[#142B4D] text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border border-gray-300 dark:border-gray-700">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>
            <span className="hidden md:inline-block text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
              {profile?.full_name ? profile.full_name.split(' ')[0] : 'Super Admin'}
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#142B4D] rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 z-50 text-gray-800 dark:text-gray-100 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Profile Card Header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initialLetter}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-bold truncate text-gray-900 dark:text-white">
                    {profile?.full_name || 'Super Admin'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
                    {profile?.nik || 'superadmin@prisma.com'}
                  </p>
                </div>
              </div>

              {/* Links */}
              <div className="py-1">
                <Link
                  href="/admin/super-admin/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2.5 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Account Settings
                </Link>
              </div>

              {/* Logout Action */}
              <div className="border-t border-gray-100 dark:border-slate-700 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                >
                  <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <Link
          href="/admin/super-admin/notification"
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative flex items-center justify-center"
          title="Notifikasi"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1 border border-white dark:border-gray-900 shadow-xs animate-pulse">
              {unreadCount > 15 ? '15+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
