import React from 'react';
import HeaderDesktop from '@/components/super-admin/header_desktop';
import HeaderMobile from '@/components/super-admin/header_mobile';
import FooterGlobal from '@/components/footer_global';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 transition-colors duration-300">
      {/* === HEADER DESKTOP === */}
      <HeaderDesktop />

      {/* === HEADER MOBILE === */}
      <HeaderMobile />

      {/* === KONTEN UTAMA === */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {children}
      </main>

      {/* === FOOTER === */}
      <FooterGlobal />
    </div>
  );
}
