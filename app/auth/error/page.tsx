import Link from "next/link";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Akses Ditolak – PRISMA",
};

export default function AuthErrorPage() {
  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F2F2F2] dark:bg-[#0D0D0D] flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">

      {/* Ambient background lights (Desktop Light Mode Only) */}
      <div className="hidden md:block dark:hidden absolute inset-0 pointer-events-none overflow-hidden">
        {/* Blob 1: Biru PRISMA (Top-Left) */}
        <div className="absolute -top-28 -left-28 w-[500px] h-[500px] bg-[#3365A6]/40 rounded-full blur-[110px] animate-pulse transform-gpu will-change-transform" />

        {/* Blob 2: Merah PRISMA (Bottom-Right) */}
        <div className="absolute -bottom-28 -right-28 w-[500px] h-[500px] bg-[#D91E2E]/35 rounded-full blur-[110px] animate-pulse [animation-delay:1.5s] transform-gpu will-change-transform" />

        {/* Blob 3: Kuning PRISMA (Center Accent) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-[#F28705]/30 rounded-full blur-[100px] animate-pulse [animation-delay:3s] transform-gpu will-change-transform" />

        {/* Blob 4: Biru PRISMA (Top-Right) */}
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-[#3365A6]/25 rounded-full blur-[100px] animate-pulse [animation-delay:2s] transform-gpu will-change-transform" />

        {/* Blob 5: Merah PRISMA (Bottom-Left) */}
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-[#D91E2E]/25 rounded-full blur-[100px] animate-pulse [animation-delay:2.5s] transform-gpu will-change-transform" />
      </div>

      {/* === ERROR CARD === */}
      <div className="relative z-10 backdrop-blur-md bg-white/90 dark:bg-[#161616] w-full max-w-md rounded-2xl p-5 sm:p-10 shadow-2xl border border-transparent dark:border-gray-800/40 transition-all duration-300 flex flex-col items-center text-center space-y-5">

        {/* Logo */}
        <div className="mb-2 flex justify-center">
          <Image
            src="/images/prisma-black-login.png"
            alt="Logo PRISMA Alfamidi"
            width={147}
            height={40}
            className="block dark:hidden h-10 w-auto object-contain"
            priority
          />
          <Image
            src="/images/prisma-white-login.png"
            alt="Logo PRISMA Alfamidi White"
            width={147}
            height={40}
            className="hidden dark:block h-10 w-auto object-contain"
            priority
          />
        </div>

        {/* Description */}
        <p className="text-sm mt-2 text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
          (Akses Ditolak / Tautan Kadaluwarsa) Tautan yang Anda gunakan tidak valid atau telah kadaluwarsa. Silakan
          minta tautan pemulihan yang baru.
        </p>

        {/* Actions */}
        <div className="flex flex-col w-full gap-3 pt-2">
          <Link
            href="/login/lupasandi"
            className="w-full h-11 bg-[#3365A6] hover:bg-[#2A548C] text-white font-bold text-sm rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] tracking-wide shadow-md hover:shadow-lg flex items-center justify-center"
          >
            Minta Tautan Baru
          </Link>
          <Link
            href="/"
            className="w-full h-11 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-[#3365A6] dark:hover:text-blue-400 transition-colors duration-200 flex items-center justify-center rounded-lg hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
          >
            Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
