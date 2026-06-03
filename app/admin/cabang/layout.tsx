import React, { Suspense } from 'react';
import HeaderDesktop from '@/components/cabang/header_desktop';
import HeaderMobile from '@/components/cabang/header_mobile';
import FooterGlobal from '@/components/footer_global';

export default function CabangLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 transition-colors duration-300">
      {/* === UTAMA: HEADER DESKTOP === */}
      <HeaderDesktop />

      {/* === UTAMA: HEADER MOBILE === */}
      <HeaderMobile />

      {/* === KONTEN: HALAMAN === */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <Suspense fallback={<div className="p-6 text-center text-gray-500 dark:text-gray-400">Memuat halaman...</div>}>
          {children}
        </Suspense>
      </main>

      {/* === FOOTER GLOBAL === */}
      <FooterGlobal />
    </div>
  );
}
