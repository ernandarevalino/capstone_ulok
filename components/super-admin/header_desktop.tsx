'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentProfile } from '@/actions/auth';

interface HeaderDesktopProps {
  isCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function HeaderDesktop({ isCollapsed = false }: HeaderDesktopProps) {
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

  const initialLetter = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A';

  // Helper function to check item active state
  const isItemActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Helper to render nav link item with active tab inverse radius curves
  const renderNavItem = ({
    href,
    title,
    icon,
    exact = false,
  }: {
    href: string;
    title: string;
    icon: React.ReactNode;
    exact?: boolean;
  }) => {
    const active = isItemActive(href, exact);

    return (
      <Link
        href={href}
        title={title}
        className={`group relative flex items-center ${
          isCollapsed ? 'justify-center py-2.5 px-2' : 'space-x-3 px-3 py-2.5'
        } ${
          active
            ? 'bg-[#F0F4F8] dark:bg-[#131F33] text-[#0E1B2E] dark:text-white font-bold rounded-l-2xl z-20'
            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white rounded-xl transition-colors ' +
              (isCollapsed ? 'mr-1.5' : 'mr-2')
        }`}
      >
        <span className={`shrink-0 ${active ? 'text-[#0E1B2E] dark:text-blue-400' : 'text-slate-400 group-hover:text-white'}`}>
          {icon}
        </span>
        {!isCollapsed && <span className="truncate text-xs">{title}</span>}

        {active && (
          <>
            {/* Top Inverse Smooth Curve */}
            <span className="absolute -top-4 right-0 w-4 h-4 pointer-events-none text-[#F0F4F8] dark:text-[#131F33]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="w-full h-full">
                <path d="M16 0V16H0C8.83656 16 16 8.83656 16 0Z" fill="currentColor" />
              </svg>
            </span>
            {/* Bottom Inverse Smooth Curve */}
            <span className="absolute -bottom-4 right-0 w-4 h-4 pointer-events-none text-[#F0F4F8] dark:text-[#131F33]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="w-full h-full">
                <path d="M16 16V0H0C8.83656 0 16 7.16344 16 16Z" fill="currentColor" />
              </svg>
            </span>
          </>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`hidden md:flex flex-col ${
        isCollapsed ? 'w-16 pl-1' : 'w-52 pl-1.5'
      } bg-[#0E1B2E] dark:bg-[#09111D] text-slate-200 h-full shrink-0 select-none transition-all duration-300 py-4 pr-0 relative z-30 rounded-l-3xl`}
    >
      {/* === 1. BRAND & LOGO HEADER === */}
      <div className={`h-14 flex items-center ${isCollapsed ? 'justify-center pr-1' : 'px-2'} mb-4 shrink-0 pr-2`}>
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
      <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 space-y-5 text-xs font-semibold tracking-wide pr-0 scrollbar-thin">
        {/* GROUP 1: RINGKASAN */}
        <div>
          {isCollapsed ? (
            <div className="my-2 border-t border-slate-800/80 mr-2" />
          ) : (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              RINGKASAN
            </p>
          )}
          <div className="space-y-1">
            {renderNavItem({
              href: '/admin/super-admin',
              exact: true,
              title: 'Ulok Dashboard',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              ),
            })}
            {renderNavItem({
              href: '/admin/super-admin/clustering',
              title: 'Clustering Dashboard',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              ),
            })}
            {renderNavItem({
              href: '/admin/super-admin/user-dashboard',
              title: 'User Dashboard',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
            })}
          </div>
        </div>

        {/* GROUP 2: ACCOUNT & OVERVIEW */}
        <div>
          {isCollapsed ? (
            <div className="my-2 border-t border-slate-800/80 mr-2" />
          ) : (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              ACCOUNT & OVERVIEW
            </p>
          )}
          <div className="space-y-1">
            {renderNavItem({
              href: '/admin/super-admin/daftaruser/admincabang',
              title: 'Admin Cabang',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            })}
            {renderNavItem({
              href: '/admin/super-admin/daftaruser/assessor',
              title: 'Assessor Legal',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
            })}
          </div>
        </div>

        {/* GROUP 3: ACTIVITY & LOG */}
        <div>
          {isCollapsed ? (
            <div className="my-2 border-t border-slate-800/80 mr-2" />
          ) : (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              ACTIVITY & LOG
            </p>
          )}
          <div className="space-y-1">
            {renderNavItem({
              href: '/admin/super-admin/recyclebin',
              title: 'Recycle Bin',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ),
            })}
            {renderNavItem({
              href: '/admin/super-admin/riwayat-login',
              title: 'User Log',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            })}
          </div>
        </div>

        {/* GROUP 4: PENGATURAN */}
        <div>
          {isCollapsed ? (
            <div className="my-2 border-t border-slate-800/80 mr-2" />
          ) : (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              PENGATURAN
            </p>
          )}
          <div className="space-y-1">
            {renderNavItem({
              href: '/admin/super-admin/branches',
              title: 'Umum',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              ),
            })}
          </div>
        </div>
      </nav>

      {/* === 3. BOTTOM USER ACCOUNT CARD / SWITCHER === */}
      <div className={`pt-2 ${isCollapsed ? 'pr-2' : 'pr-3'} relative shrink-0 mt-auto before:content-[''] before:absolute before:top-0 before:left-0 before:right-3 before:border-t before:border-slate-800/80`} ref={accountMenuRef}>
        {/* Account popover menu */}
        {isAccountMenuOpen && (
          <div className={`absolute bottom-full ${isCollapsed ? 'left-0 w-60' : 'left-0 right-3'} mb-2 bg-[#1A2332] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150`}>
            <div className="px-3 py-2 border-b border-slate-700/60 mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Akun Active</p>
            </div>

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
          title={isCollapsed ? (profile?.full_name || 'Super Admin') : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between p-2.5'} rounded-xl bg-slate-800/60 hover:bg-slate-800 text-left transition-colors border border-slate-700/50 group`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} min-w-0`}>
            <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {profile?.full_name || 'Anastasya'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">Super Admin</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
}
