'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/actions/auth'; 

/**
 * Komponen Utama Halaman Autentikasi (Login Page).
 * Menggunakan Full Tailwind CSS untuk optimalisasi performa, interaksi UX, dan Dark Mode.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      // 1. Mengeksekusi verifikasi kredensial via Server Action
      const res = await loginAction(formData);

      // Intersepsi kesalahan apabila respons autentikasi bernilai gagal
      if (res && !res.success) {
        throw new Error(res.error);
      }

      // 2. Evaluasi hak akses (role-based access) apabila proses autentikasi berhasil
      if (res && res.success && res.role) {
        
        // 3. Eksekusi pengalihan rute halaman dinamis (menggunakan hard refresh window.location)
        if (res.role === "super_admin") {
          window.location.href = "/admin/super-admin";
        } else if (res.role === "admin_cabang") {
          window.location.href = "/admin/cabang"; 
        } else if (res.role === "assessor") {
          window.location.href = "/admin/assessor";
        } else {
          setErrorMsg("Otorisasi role akun tidak valid.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk. Periksa kembali email & password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // CONTAINER UTAMA: Otomatis menyesuaikan warna background saat Dark Mode aktif
    <div className="w-full min-h-screen bg-[#142B4D] dark:bg-[#0B1329] flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      
      {/* CARD LOGIN: Efek bayangan premium & border tipis modern di dark mode */}
      <div className="w-full max-w-[800px] min-h-[520px] bg-white dark:bg-[#111C34] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl border border-transparent dark:border-gray-800/40 transition-all duration-300">
        
        {/* SEKTOR KIRI: ASSET VISUAL DAN ANIMASI GRAFIS UTAMA */}
        <div className="flex-1 bg-[#142B4D] dark:bg-[#0B1329] flex flex-col items-center justify-center relative m-2.5 rounded-xl p-6 md:p-0 min-h-[240px] md:min-h-0 transition-colors duration-300">
          <div className="w-full max-w-[280px] md:max-w-[340px] p-2 flex items-center justify-center">
            <img 
              src="/images/logo-login.png" 
              alt="Logo Priolo Login" 
              className="w-full h-auto max-h-72 object-contain transition-transform duration-500 hover:scale-105 ease-out" 
            />
          </div>
        </div>
        
        {/* SEKTOR KANAN: FORMULIR INPUT KREDENSIAL PENGGUNA */}
        {/* Diberikan class `relative` agar tombol absolut "X" mengunci sempurna di pojok kanan atas */}
        <div className="flex-1 bg-[#f8f9fa] dark:bg-[#0E172F] px-6 py-10 sm:px-12 sm:py-14 flex flex-col justify-center transition-colors duration-300 relative">
          
          {/* TOMBOL BACK INTERAKTIF (LOGO X) */}
          <Link 
            href="/" 
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800/50 transition-all duration-300 hover:rotate-90 z-20"
            title="Kembali ke Beranda"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
          
          {/* Logo Section & Swap Otomatis di Dark Mode */}
          <div className="mb-8 flex flex-col items-center justify-center w-full">
            <div className="mb-2 flex justify-center transition-transform duration-300 hover:scale-102">
              {/* Menampilkan logo hitam di light mode */}
              <img 
                src="/images/logo-priolo.png" 
                alt="Logo Priolo Alfamidi" 
                className="block dark:hidden h-20 w-auto object-contain" 
              />
              {/* Otomatis menukar ke logo putih jika user menggunakan dark mode */}
              <img 
                src="/images/logo-priolo-white.png" 
                alt="Logo Priolo Alfamidi White" 
                className="hidden dark:block h-16 w-auto object-contain" 
              />
            </div>
          </div>  
          
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            
            {/* Banner Informasi Pesan Kesalahan (Error Alert Box) */}
            {errorMsg && (
              <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg font-semibold animate-shake">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Field Input Akun Alamat Email Karyawan */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                Email
              </label>
              <input 
                type="email" 
                id="email" 
                required 
                placeholder="NIK@alfamidi.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full h-11 px-4 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1A2647] focus:outline-hidden focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-950/10 dark:focus:ring-blue-500/10 transition-all duration-200 font-medium placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            
            {/* Field Input Kata Sandi / Password Keamanan */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                Password
              </label>
              <input 
                type="password" 
                id="password" 
                required 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full h-11 px-4 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1A2647] focus:outline-hidden focus:border-[#142B4D] dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-950/10 dark:focus:ring-blue-500/10 transition-all duration-200 font-medium placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            
            {/* Tautan Fitur Recovery Kata Sandi */}
            <div className="text-right -mt-1">
              <Link href="/lupasandi" className="text-xs text-red-500 dark:text-red-400 font-semibold hover:text-red-600 dark:hover:text-red-300 transition-colors hover:underline underline-offset-2">
                Lupa Kata Sandi Anda?
              </Link>
            </div>
            
            {/* Tombol Aksi Masuk Sistem Terproteksi */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 bg-[#142B4D] dark:bg-blue-600 hover:bg-[#1C3D6C] dark:hover:bg-blue-500 text-white font-bold text-sm rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:scale-100 disabled:cursor-not-allowed tracking-wide shadow-md hover:shadow-lg shadow-blue-950/10 dark:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}