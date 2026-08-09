'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LupaSandiPage() {
  const [email, setEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Alamat email wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccessMsg(`Instruksi pemulihan kata sandi telah dikirimkan ke email: ${email}`);
      setEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses permintaan Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F2F2F2] dark:bg-[#0D0D0D] flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      
      {/* Ambient background lights (Desktop Light Mode Only) */}
      <div className="hidden md:block dark:hidden absolute inset-0 pointer-events-none overflow-hidden">
        {/* Blob 1: Biru PRISMA (Top-Left) */}
        <div className="absolute -top-28 -left-28 w-[500px] h-[500px] bg-[#3365A6]/40 rounded-full blur-[110px] animate-pulse" />

        {/* Blob 2: Merah PRISMA (Bottom-Right) */}
        <div className="absolute -bottom-28 -right-28 w-[500px] h-[500px] bg-[#D91E2E]/35 rounded-full blur-[110px] animate-pulse [animation-delay:1.5s]" />

        {/* Blob 3: Kuning PRISMA (Center Accent) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-[#F28705]/30 rounded-full blur-[100px] animate-pulse [animation-delay:3s]" />

        {/* Blob 4: Biru PRISMA (Top-Right) */}
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-[#3365A6]/25 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />

        {/* Blob 5: Merah PRISMA (Bottom-Left) */}
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-[#D91E2E]/25 rounded-full blur-[100px] animate-pulse [animation-delay:2.5s]" />
      </div>

      {/* === PASSWORD RECOVERY CONTAINER === */}
      <div className="relative z-10 backdrop-blur-md bg-white/90 dark:bg-[#161616] w-full max-w-md rounded-2xl p-5 sm:p-10 shadow-2xl border border-transparent dark:border-gray-800/40 transition-all duration-300">
        
        {/* === LOGO & TITLE HEADER === */}
        <div className="flex flex-col items-center justify-center w-full mb-8">
          <div className="mb-4 flex justify-center transition-transform duration-300 hover:scale-102">
            <img
              src="/images/prisma-black-login.png"
              alt="Logo PRISMA Alfamidi"
              className="block dark:hidden h-10 w-auto object-contain"
            />
            <img
              src="/images/prisma-white-login.png"
              alt="Logo PRISMA Alfamidi White"
              className="hidden dark:block h-10 w-auto object-contain"
            />
          </div>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
            Masukkan alamat email terdaftar Anda untuk menerima tautan pemulihan kata sandi.
          </p>
        </div>

        {/* === FORM TRANSAKSI === */}
        <form className="flex flex-col gap-4 sm:gap-5" onSubmit={handleSubmit}>
          
          {/* === ERROR FEEDBACK === */}
          {errorMsg && (
            <div className="p-3 text-xs text-[#D91E2E] dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-[#D91E2E]/20 dark:border-red-900/40 rounded-lg font-semibold flex items-center gap-2 animate-shake">
              <img src="/icons/icon-alert.svg" alt="Alert Icon" className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* === SUCCESS FEEDBACK === */}
          {successMsg && (
            <div className="p-3 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg font-semibold flex items-center gap-2">
              <img src="/icons/icon-check.svg" alt="Success Icon" className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* === FIELDSET: EMAIL === */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email-address" className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
              Alamat Email
            </label>
            <div className="relative group">
              <span className="dark:invert absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 group-hover:text-[#3365A6] dark:group-hover:text-[#F28705] transition-colors duration-200">
                <img src="/icons/icon-email.svg" alt="Email Icon" className="w-4 h-4" />
              </span>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="NIK@mu.co.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#161616] outline-none hover:border-[#3365A6] dark:hover:border-[#F28705] focus:border-[#F28705] dark:focus:border-[#F28705] focus:ring-4 focus:ring-[#F28705]/10 dark:focus:ring-[#F28705]/20 transition-all duration-200 font-medium placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* === TRIGGER ACTION === */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#3365A6] dark:bg-[#3365A6] hover:bg-[#2A548C] dark:hover:bg-[#2A548C] text-white font-bold text-sm rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:scale-100 disabled:cursor-not-allowed tracking-wide shadow-md hover:shadow-lg shadow-blue-950/10 dark:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                {/* === LOADING SPIN === */}
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Memproses...</span>
              </>
            ) : (
              'Kirim Link Pemulihan'
            )}
          </button>
        </form>

        {/* === NAVIGATION BACK === */}
        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-bold text-[#3365A6] dark:text-blue-400 hover:opacity-75 transition-opacity duration-200"
          >
            Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}