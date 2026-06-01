import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { FloatingControls } from "@/components/floating-controls";

// Inisialisasi konfigurasi font tipe Sans-Serif menggunakan paket library Google Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Inisialisasi konfigurasi font tipe Monospace menggunakan paket library Google Fonts
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Konfigurasi Metadata Global Objek Sistem (SEO & Tab Information).
 * Mengatur judul utama aplikasi, deskripsi sistem pendukung keputusan (SPK), serta referensi ikon aplikasi.
 */
export const metadata: Metadata = {
  title: "Priolo",
  description: "Sistem Penunjang Keputusan Pemrosesan Dokumen ULOK",
  icons: {
    icon: "/icons/logo.png",
  },
};

/**
 * Komponen Utama Root Layout Sistem (Akar Fondasi Layout Aplikasi Next.js).
 * Berfungsi untuk menginisialisasi tag HTML dasar, bahasa, pemetaan variabel font CSS global,
 * serta menyuntikkan optimasi rendering teks antialiased pada seluruh layer halaman.
 * * @param props - Kumpulan simpul komponen anak (children page) yang dilewatkan ke dalam layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col transition-colors duration-300">
        <ThemeProvider>
          {children}
          <FloatingControls />
        </ThemeProvider>
      </body>
    </html>
  );
}