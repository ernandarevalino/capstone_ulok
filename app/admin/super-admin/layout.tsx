import React from 'react';
import HeaderDesktop from '@/components/super-admin/header_desktop';
import HeaderMobile from '@/components/super-admin/header_mobile';
import FooterGlobal from '@/components/footer_global';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 1. Header Desktop Super Admin (Muncul di PC) */}
      <HeaderDesktop />

      {/* 2. Header Mobile Super Admin (Muncul di HP) */}
      <HeaderMobile />

      {/* 3. Area Konten Halaman (Dashboard, Daftar User, Profil, dll) */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {children}
      </main>

      {/* 4. Footer Global */}
      <FooterGlobal />
    </div>
  );
}