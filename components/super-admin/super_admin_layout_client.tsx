'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import HeaderDesktop from '@/components/super-admin/header_desktop';
import HeaderMobile from '@/components/super-admin/header_mobile';
import HeaderTopbar from '@/components/super-admin/header_topbar';
import { getCurrentProfile } from '@/actions/auth';
import { getNotificationsAction } from '@/actions/superadmin';

export default function SuperAdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('superadmin_sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Shared data fetching for Profile and Notifications
  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await getCurrentProfile();
        if (profileRes && profileRes.success) {
          setProfile(profileRes.profile);
        }

        const notifRes = await getNotificationsAction();
        if (notifRes && notifRes.success && Array.isArray(notifRes.data)) {
          const unreadItems = notifRes.data.filter((item: any) => !item.is_read);
          setUnreadCount(unreadItems.length);
        }
      } catch (err) {
        console.error('Error fetching layout data:', err);
      }
    }

    loadData();

    const intervalId = setInterval(() => {
      loadData();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [pathname]);

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
    <div className="h-screen max-h-screen bg-[#0E1B2E] dark:bg-[#09111D] text-slate-900 dark:text-slate-100 flex flex-col justify-between pt-2 md:pt-3 pr-2 md:pr-4 pb-1.5 md:pb-2.5 pl-0 transition-colors duration-300 overflow-hidden">
      {/* HEADER MOBILE (Drawer & Top Bar for Mobile View) */}
      <HeaderMobile isScrolled={isScrolled} profile={profile} unreadCount={unreadCount} />

      {/* MAIN LAYOUT WRAPPER (Desktop Sidebar + Main Content Card) */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 w-full relative md:space-x-0">
        {/* SIDEBAR DESKTOP */}
        <HeaderDesktop
          isCollapsed={isCollapsed}
          onToggleSidebar={toggleSidebar}
          profile={profile}
        />

        {/* MAIN CONTENT CARD (LIGHT / DUAL THEME CONTAINER) */}
        <div className="flex-1 flex flex-col bg-[#F0F4F8] dark:bg-[#131F33] rounded-2xl md:rounded-3xl min-w-0 overflow-hidden shadow-xl border border-slate-200/20 dark:border-slate-800/30">
          {/* TOP HEADER BAR */}
          <HeaderTopbar
            isCollapsed={isCollapsed}
            onToggleSidebar={toggleSidebar}
            profile={profile}
            unreadCount={unreadCount}
          />

          {/* KONTEN UTAMA */}
          <main onScroll={handleScroll} className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* FOOTER GLOBAL */}
      <footer className="mt-2 text-center text-[11px] font-semibold tracking-wide text-slate-400/80 dark:text-slate-400/80 py-0.5 shrink-0">
        © 2026 PRISMA - Sistem Penunjang Keputusan Pemrosesan Dokumen ULOK
      </footer>
    </div>
  );
}
