'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loginAction } from '@/actions/auth';
import { Eye, EyeOff, AlertTriangle, Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'session_expired') {
      setErrorMsg('Sesi Anda telah berakhir setelah 30 menit. Silakan masuk kembali.');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const res = await loginAction(formData);

      if (res && !res.success) {
        throw new Error(res.error);
      }

      if (res && res.success && res.role) {
        setSuccessMessage("Login berhasil! Mengalihkan halaman...");
        setShowSuccessModal(true);

        setTimeout(() => {
          setShowSuccessModal(false);

          if (res.role === "super_admin") {
            window.location.href = "/admin/super-admin";
          } else if (res.role === "admin_cabang") {
            window.location.href = "/admin/cabang";
          } else if (res.role === "assessor") {
            window.location.href = "/admin/assessor";
          } else {
            setErrorMsg("Otorisasi role akun tidak valid.");
            setLoading(false);
          }
        }, 1800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk. Periksa kembali email & password.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F2F2F2] dark:bg-[#0D0D0D] flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden">

      {/* Ambient background lights (Desktop Light Mode Only) */}
      <div className="hidden md:block dark:hidden absolute inset-0 pointer-events-none overflow-hidden">
        {/* Blob 1: Biru (Atas Kiri) */}
        <div className="absolute -top-28 -left-28 w-[450px] h-[450px] bg-[#3365A6]/40 rounded-full blur-[110px] animate-pulse transform-gpu will-change-transform" />
        
        {/* Blob 2: Merah (Bawah Kanan) */}
        <div className="absolute -bottom-28 -right-28 w-[450px] h-[450px] bg-[#D91E2E]/35 rounded-full blur-[110px] animate-pulse [animation-delay:1.5s] transform-gpu will-change-transform" />
        
        {/* Blob 3: Kuning (Tengah) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-[#F28705]/30 rounded-full blur-[100px] animate-pulse [animation-delay:3s] transform-gpu will-change-transform" />
        
        {/* Blob 4: Biru Soft (Atas Kanan) */}
        <div className="absolute -top-20 -right-20 w-[350px] h-[350px] bg-[#3365A6]/25 rounded-full blur-[100px] animate-pulse [animation-delay:2s] transform-gpu will-change-transform" />
        
        {/* Blob 5: Merah Soft (Bawah Kiri) */}
        <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] bg-[#D91E2E]/25 rounded-full blur-[100px] animate-pulse [animation-delay:2.5s] transform-gpu will-change-transform" />
      </div>

      {/* Form Container */}
      <div className="w-full max-w-[800px] md:min-h-[520px] bg-white/90 backdrop-blur-md dark:bg-[#161616] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl border border-white/60 dark:border-gray-800/40 transition-all duration-300 relative z-10">

        {/* Left Side: Brand Banner */}
        <div className="hidden md:flex md:flex-1 bg-[#3365A6] dark:bg-[#0D0D0D] relative m-2.5 rounded-xl overflow-hidden transition-colors duration-300">
          <Image
            src="/images/prisma-side-login.png"
            alt="Logo PRISMA Login"
            fill
            sizes="(max-w-[380px]) 100vw, 380px"
            className="object-cover transition-transform duration-500 hover:scale-[1.03] ease-out rounded-xl"
            priority
          />
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:flex-1 bg-white/90 dark:bg-[#121212] px-5 py-8 sm:px-12 sm:py-14 flex flex-col justify-center transition-colors duration-300 relative">

          <Link
            href="/"
            className="absolute top-4 right-4 p-3 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800/50 duration-300 hover:rotate-90 z-20 active:scale-95 transition-transform"
            title="Kembali ke Beranda"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>

          {/* Logo Header */}
          <div className="mb-8 flex flex-col items-center justify-center w-full">
            <div className="mb-2 flex justify-center transition-transform duration-300 hover:scale-102">
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
          </div>

          {/* Form Inputs */}
          <form className="flex flex-col gap-4 sm:gap-5" onSubmit={handleLogin}>

            {errorMsg && (
              <div className="p-3 text-xs text-[#D91E2E] dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-[#D91E2E]/20 dark:border-red-900/40 rounded-lg font-semibold flex items-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#D91E2E] dark:text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email / NIK */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                Email
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 group-hover:text-[#3365A6] dark:group-hover:text-[#F28705] transition-colors duration-200">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="NIK@mu.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#161616] outline-none hover:border-[#3365A6] dark:hover:border-[#F28705] focus:border-[#F28705] dark:focus:border-[#F28705] focus:ring-4 focus:ring-[#F28705]/10 dark:focus:ring-[#F28705]/20 transition-all duration-200 font-medium placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                Password
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 group-hover:text-[#3365A6] dark:group-hover:text-[#F28705] transition-colors duration-200">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#161616] outline-none hover:border-[#3365A6] dark:hover:border-[#F28705] focus:border-[#F28705] dark:focus:border-[#F28705] focus:ring-4 focus:ring-[#F28705]/10 dark:focus:ring-[#F28705]/20 transition-all duration-200 font-medium placeholder-gray-400 dark:placeholder-gray-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#3365A6] dark:hover:text-[#F28705] transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-right -mt-1">
              <Link
                href="login/lupasandi"
                className="text-xs text-[#D91E2E] dark:text-red-400 font-bold hover:opacity-75 transition-all duration-200 active:scale-95 inline-block py-1.5 px-1"
              >
                Lupa Kata Sandi Anda?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#3365A6] dark:bg-[#3365A6] hover:bg-[#2A548C] dark:hover:bg-[#2A548C] text-white font-bold text-sm rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:scale-100 disabled:cursor-not-allowed tracking-wide shadow-md hover:shadow-lg shadow-blue-950/10 dark:shadow-none flex items-center justify-center gap-2"
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-[#111C34] rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800/60 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 text-emerald-500" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm md:text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}