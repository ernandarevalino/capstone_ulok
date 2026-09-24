'use client';

import React, { useState, useEffect } from 'react';
import HeaderDesktop from '@/components/super-admin/header_desktop';
import HeaderMobile from '@/components/super-admin/header_mobile';
import HeaderTopbar from '@/components/super-admin/header_topbar';

export default function SuperAdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('superadmin_sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('superadmin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 10) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-[#0E1B2E] dark:bg-[#09111D] text-slate-900 dark:text-slate-100 flex flex-col justify-between pt-2 md:pt-3 px-2 md:pl-2.5 md:pr-4 pb-1.5 md:pb-2.5 transition-colors duration-300 overflow-hidden">
      {/* HEADER MOBILE (Drawer & Top Bar for Mobile View) */}
      <HeaderMobile isScrolled={isScrolled} />

      {/* MAIN LAYOUT WRAPPER (Desktop + Main Card) */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 w-full relative md:rounded-3xl overflow-hidden shadow-2xl">
        {/* SIDEBAR DESKTOP */}
        <HeaderDesktop isCollapsed={isCollapsed} onToggleSidebar={toggleSidebar} />

        {/* MAIN CONTENT CARD (LIGHT / MAIN CONTAINER) */}
        <div className="flex-1 flex flex-col bg-[#F0F4F8] dark:bg-[#131F33] rounded-2xl md:rounded-none min-w-0 overflow-hidden">
          {/* TOP HEADER BAR */}
          <HeaderTopbar isCollapsed={isCollapsed} onToggleSidebar={toggleSidebar} />

          {/* KONTEN UTAMA */}
          <main onScroll={handleScroll} className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* FOOTER GLOBAL */}
      <footer className="mt-2 text-center text-[11px] font-medium text-slate-400/80 dark:text-slate-500 py-0.5 shrink-0">
        © 2026 PRISMA - Sistem Penunjang Keputusan Pemrosesan Dokumen ULOK
      </footer>
    </div>
  );
}
