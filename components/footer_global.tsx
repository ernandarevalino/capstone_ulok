import React from 'react';

/**
 * Komponen Global untuk Menampilkan Footer Aplikasi.
 * Komponen ini berfungsi sebagai catatan kaki (footer) yang seragam di seluruh halaman backend.
 * Menggunakan pendekatan Server Component (default di Next.js App Router) karena tidak membutuhkan state aktif.
 */
export default function FooterGlobal() {
  return (
    <footer className="w-full bg-[#142B4D] text-gray-400 text-center py-4 text-xs font-medium border-t border-slate-700 mt-auto">
      {/* Mendapatkan tahun secara dinamis menggunakan objek JavaScript Date 
        untuk memastikan data hak cipta (copyright) selalu mutakhir.
      */}
      &copy; {new Date().getFullYear()} PRIOLO ALFAMIDI - Sistem Penunjang Keputusan Pemrosesan Dokumen ULOK.
    </footer>
  );
}