import React from 'react';
import HeaderDesktop from '@/components/super-admin/header_desktop';
import HeaderMobile from '@/components/super-admin/header_mobile';
import HeaderTopbar from '@/components/super-admin/header_topbar';
import FooterGlobal from '@/components/footer_global';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manajemen Pengguna - Super Admin',
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#0D0D0D] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* === SIDEBAR DESKTOP === */}
      <HeaderDesktop />

      {/* === HEADER MOBILE (Drawer & Top Bar for Mobile View) === */}
      <HeaderMobile />

      {/* === MAIN CONTENT AREA === */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* === TOP HEADER BAR (Title, User Dropdown, Notifications) === */}
        <HeaderTopbar />

        {/* === KONTEN UTAMA === */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </main>

        {/* === FOOTER GLOBAL === */}
        <FooterGlobal />
      </div>
    </div>
  );
}
