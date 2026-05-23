import React from 'react';
import HeaderDesktop from '@/components/super-admin/header_desktop';
import HeaderMobile from '@/components/super-admin/header_mobile';
import FooterGlobal from '@/components/footer_global';

/**
 * Komponen Pembungkus Tata Letak Utama (Layout Template) Modul Super Admin.
 * Berfungsi untuk menjaga konsistensi struktur visual antarmuka di seluruh sub-halaman,
 * mengintegrasikan navigasi adaptif khusus hak akses Super Admin, serta menyediakan
 * kontainer responsif untuk area konten dinamis aplikasi.
 * * @param props - Konten halaman anak (children) yang akan dirender di dalam tata letak.
 */
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 1. Komponen Navigasi Desktop Super Admin (Aktif pada resolusi PC/Tablet) */}
      <HeaderDesktop />

      {/* 2. Komponen Navigasi Mobile Super Admin (Aktif pada resolusi Handphone/Mobile View) */}
      <HeaderMobile />

      {/* 3. Area Penampung Utama Konten Dinamis Halaman (Dashboard, Manajemen User, Profil Master) */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {children}
      </main>

      {/* 4. Komponen Kaki Halaman (Footer) Global Sistem */}
      <FooterGlobal />
    </div>
  );
}