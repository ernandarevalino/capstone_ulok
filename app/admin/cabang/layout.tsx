import React, { Suspense } from 'react';
import HeaderDesktop from '@/components/cabang/header_desktop';
import HeaderMobile from '@/components/cabang/header_mobile';
import FooterGlobal from '@/components/footer_global';

export default function CabangLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 1. Header Desktop (Muncul di PC) */}
      <HeaderDesktop />

      {/* 2. Header Mobile (Muncul di HP) */}
      <HeaderMobile />

      {/* 3. Area Konten Halaman */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <Suspense fallback={<div className="p-6 text-center text-gray-500">Memuat halaman...</div>}>
          {children}
        </Suspense>
      </main>

      {/* 4. Footer Global */}
      <FooterGlobal />
    </div>
  );
}