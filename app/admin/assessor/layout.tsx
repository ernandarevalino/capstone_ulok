import React, { Suspense } from 'react';
import HeaderDesktop from '@/components/assessor/header_desktop';
import HeaderMobile from '@/components/assessor/header_mobile';
import FooterGlobal from '@/components/footer_global';

/**
 * Komponen Pembungkus Tata Letak Utama (Layout Template) Modul Assessor.
 * Berfungsi untuk mengintegrasikan kerangka kerja tata letak antarmuka secara konsisten,
 * mengapit area konten dinamis halaman dengan navigasi adaptif (Header Desktop/Mobile) dan Footer.
 * * @param props - Konten halaman anak (children) yang dirender di dalam layout.
 */
export default function AssessorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 1. Komponen Navigasi Desktop Assessor (Aktif pada resolusi PC/Tablet) */}
      <HeaderDesktop />

      {/* 2. Komponen Navigasi Mobile Assessor (Aktif pada resolusi Handphone) */}
      <HeaderMobile />

      {/* 3. Area Penampung Konten Utama Halaman Dinamis (Dashboard, Penilaian, Histori, Peringkat, Profil) */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <Suspense fallback={<div className="p-6 text-center text-gray-500">Memuat halaman...</div>}>
          {children}
        </Suspense>
      </main>

      {/* 4. Komponen Kaki Halaman (Footer) Global Sistem */}
      <FooterGlobal />
    </div>
  );
}