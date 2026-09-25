'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth';
import {
  SUPER_ADMIN_NAV_GROUPS,
  isNavItemActive,
  NavItemConfig,
} from './super_admin_nav_config';

interface HeaderDesktopProps {
  isCollapsed?: boolean;
  onToggleSidebar?: () => void;
  profile?: any;
}

export default function HeaderDesktop({
  isCollapsed = false,
  profile: propProfile,
}: HeaderDesktopProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(propProfile || null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Sync propProfile or fetch if missing
  useEffect(() => {
    if (propProfile) {
      setProfile(propProfile);
      return;
    }
    async function loadProfile() {
      const res = await getCurrentProfile();
      if (res && res.success) {
        setProfile(res.profile);
      }
    }
    loadProfile();
  }, [propProfile, pathname]);

  // Click outside to close account menu popover
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

  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'S';

  // Icon mapping helper
  const renderNavIcon = (iconType: string, active: boolean) => {
    const iconClass = `w-5 h-5 shrink-0 transition-colors ${
      active ? 'text-[#0E1B2E] dark:text-white' : 'text-slate-400 group-hover:text-slate-200'
    }`;

    switch (iconType) {
      case 'dashboard':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case 'clustering':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'analytics':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'admin-cabang':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'assessor':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'recycle':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'log':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'settings':
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
          </svg>
        );
    }
  };

  const renderNavItem = (item: NavItemConfig) => {
    const active = isNavItemActive(pathname, item.href, item.exact);

    if (isCollapsed) {
      if (active) {
        return (
          <div key={item.id} className="relative group my-0.5 z-20">
            {/* Top-Right Inverse Radius Curve */}
            <div className="absolute -top-4 right-0 w-4 h-4 bg-[#F0F4F8] dark:bg-[#131F33] pointer-events-none z-10">
              <div className="w-full h-full bg-[#0E1B2E] dark:bg-[#09111D] rounded-br-2xl" />
            </div>

            <Link
              href={item.href}
              title={item.title}
              className="relative flex items-center justify-center h-10 w-full bg-[#F0F4F8] dark:bg-[#131F33] text-[#0E1B2E] dark:text-white rounded-l-2xl rounded-r-none transition-all duration-200 z-20 shadow-xs"
            >
              {renderNavIcon(item.icon, true)}
            </Link>

            {/* Bottom-Right Inverse Radius Curve */}
            <div className="absolute -bottom-4 right-0 w-4 h-4 bg-[#F0F4F8] dark:bg-[#131F33] pointer-events-none z-10">
              <div className="w-full h-full bg-[#0E1B2E] dark:bg-[#09111D] rounded-tr-2xl" />
            </div>

            {/* Collapsed Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#14233A] dark:bg-[#0E1828] text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 border border-[#243A5E] dark:border-[#1C2C46] top-1/2 -translate-y-1/2">
              {item.title}
            </div>
          </div>
        );
      }

      return (
        <div key={item.id} className="relative group my-0.5 pr-2">
          <Link
            href={item.href}
            title={item.title}
            className="relative flex items-center justify-center w-10 h-10 mx-auto transition-all duration-200 rounded-xl text-slate-400 hover:bg-[#162740]/70 dark:hover:bg-[#121E30]/70 hover:text-slate-100 font-medium"
          >
            {renderNavIcon(item.icon, false)}
          </Link>

          {/* Collapsed Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#14233A] dark:bg-[#0E1828] text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 border border-[#243A5E] dark:border-[#1C2C46] top-1/2 -translate-y-1/2">
            {item.title}
          </div>
        </div>
      );
    }

    if (active) {
      return (
        <div key={item.id} className="relative my-0.5 z-20">
          {/* Top-Right Inverse Radius Curve */}
          <div className="absolute -top-4 right-0 w-4 h-4 bg-[#F0F4F8] dark:bg-[#131F33] pointer-events-none z-10">
            <div className="w-full h-full bg-[#0E1B2E] dark:bg-[#09111D] rounded-br-2xl" />
          </div>

          <Link
            href={item.href}
            className="relative flex items-center h-10 pl-3.5 pr-4 space-x-3 w-full bg-[#F0F4F8] dark:bg-[#131F33] text-[#0E1B2E] dark:text-white font-bold rounded-l-2xl rounded-r-none transition-all duration-200 z-20 shadow-xs"
          >
            {renderNavIcon(item.icon, true)}
            <span className="truncate text-xs tracking-tight select-none">{item.title}</span>
          </Link>

          {/* Bottom-Right Inverse Radius Curve */}
          <div className="absolute -bottom-4 right-0 w-4 h-4 bg-[#F0F4F8] dark:bg-[#131F33] pointer-events-none z-10">
            <div className="w-full h-full bg-[#0E1B2E] dark:bg-[#09111D] rounded-tr-2xl" />
          </div>
        </div>
      );
    }

    return (
      <div key={item.id} className="relative group my-0.5 pr-3">
        <Link
          href={item.href}
          className="relative flex items-center h-10 px-3.5 space-x-3 w-full transition-all duration-200 rounded-xl text-slate-400 hover:bg-[#162740]/70 dark:hover:bg-[#121E30]/70 hover:text-slate-100 font-medium"
        >
          {renderNavIcon(item.icon, false)}
          <span className="truncate text-xs tracking-tight select-none">{item.title}</span>
        </Link>
      </div>
    );
  };

  return (
    <aside
      className={`hidden md:flex flex-col ${
        isCollapsed ? 'w-20 pl-2.5 pr-0' : 'w-56 pl-3.5 pr-0'
      } bg-[#0E1B2E] dark:bg-[#09111D] text-slate-200 h-full shrink-0 select-none transition-all duration-300 py-3 relative z-30 rounded-l-3xl`}
    >
      {/* === 1. LOGO & BRAND HEADER (Matching Topbar Height h-16) === */}
      <div className={`h-16 flex items-center shrink-0 mb-1 ${isCollapsed ? 'justify-center' : 'px-2 pr-5'}`}>
        <Link href="/admin/super-admin" className="flex items-center space-x-2.5 group overflow-hidden" title="PRISMA Super Admin">
          {isCollapsed ? (
            <span className="text-[11px] bg-emerald-600 text-white font-bold px-2 py-1 rounded-lg uppercase tracking-wider shadow-xs group-hover:scale-110 transition-transform">
              SA
            </span>
          ) : (
            <>
              <img
                src="/images/prisma-white-navbar.png"
                alt="Logo PRISMA"
                className="h-6 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
              />
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs shrink-0">
                SA
              </span>
            </>
          )}
        </Link>
      </div>

      {/* === 2. SIDEBAR NAVIGATION GROUPS === */}
      <nav className="flex-1 min-h-0 overflow-y-auto space-y-3 text-xs font-semibold tracking-wide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {SUPER_ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-0.5">
            {isCollapsed ? (
              <div className="my-2.5 border-t border-[#223859]/60 dark:border-[#1B2B45]/60 mx-1" />
            ) : (
              <p className="px-3 pr-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 pb-1.5">
                {group.groupTitle}
              </p>
            )}
            {group.items.map((item) => renderNavItem(item))}
          </div>
        ))}
      </nav>

      {/* === 3. BOTTOM USER ACCOUNT CARD / SWITCHER === */}
      <div
        className={`pt-2 relative shrink-0 mt-auto ${isCollapsed ? '' : 'pr-3'}`}
        ref={accountMenuRef}
      >
        <div className={`h-[1px] bg-slate-700/30 dark:bg-slate-800/40 mb-3 ${
          isCollapsed 
            ? 'w-[80%] mx-auto' 
            : 'w-[95%] ml-1.5' 
        }`}>
        </div>

        {/* Account popover menu */}
        {isAccountMenuOpen && (
          <div className={`absolute bottom-full ${isCollapsed ? 'left-0 w-56' : 'left-0 right-3'} mb-2 bg-[#0E1B2E] dark:bg-[#09111D] border border-slate-700/50 dark:border-slate-800/60 rounded-xl shadow-2xl p-2.5 z-50 text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150`}>
            <div className="px-2 py-1 border-b border-slate-700/40 dark:border-slate-800/40 mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Akun Aktif</p>
            </div>

            <div className="flex items-center space-x-3 p-2 bg-[#14233A]/80 dark:bg-[#101C2E]/80 rounded-lg border border-slate-700/40 dark:border-slate-800/50">
              <div className="w-7 h-7 rounded-full bg-[#1A3054] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-600/40">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Super Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{profile?.nik || 'superadmin@prisma.com'}</p>
              </div>
            </div>

            <button
              onClick={() => setIsAccountMenuOpen(false)}
              className="w-full flex items-center space-x-2.5 p-2 mt-1 rounded-lg text-slate-300 hover:bg-[#14233A] dark:hover:bg-[#101C2E] hover:text-white text-xs font-medium transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-[#1A3054] text-slate-300 flex items-center justify-center text-xs font-semibold">+</span>
              <span>Tambah Akun</span>
            </button>
          </div>
        )}

        {/* Trigger Pill at bottom */}
        <button
          onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
          title={isCollapsed ? (profile?.full_name || 'Super Admin') : undefined}
          className={`flex items-center rounded-xl bg-transparent hover:bg-[#14233A]/60 dark:hover:bg-[#101C2E]/60 text-left transition-colors border border-slate-700/30 dark:border-slate-800/40 group ${
            isCollapsed 
              ? 'w-14 h-14 mx-auto justify-center p-2' 
              : 'w-full h-14 justify-between p-2.5' 
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} min-w-0`}>
            <div className="w-7 h-7 rounded-full bg-[#1A3054] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-600/40">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {profile?.full_name || 'Super Admin'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">Super Admin</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
}
