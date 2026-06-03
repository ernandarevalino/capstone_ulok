'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/actions/auth'; 
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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
    <div className="w-full min-h-screen bg-[#142B4D] dark:bg-[#0B1329] flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      
      {/* === SEKTOR UTAMA: WADAH FORM === */}
      <div className="w-full max-w-[800px] min-h-130 bg-white dark:bg-[#111C34] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl border border-transparent dark:border-gray-800/40 transition-all duration-300">
        
        {/* === SEKTOR KIRI: BANNER BRAND === */}
        <div className="flex-1 bg-[#142B4D] dark:bg-[#0B1329] flex flex-col items-center justify-center relative m-2.5 rounded-xl p-6 md:p-0 min-h-[240px] md:min-h-0 transition-colors duration-300">
          <div className="w-full max-w-[280px] md:max-w-[340px] p-2 flex items-center justify-center">
            <img 
              src="/images/logo-login.png" 
              alt="Logo Priolo Login" 
              className="w-full h-auto max-h-72 object-contain transition-transform duration-500 hover:scale-[1.03] ease-out" 
            />
          </div>
        </div>
        
        {/* === SEKTOR KANAN: FORM LOGIN === */}
        <div className="flex-1 bg-[#f8f9fa] dark:bg-[#0E172F] px-6 py-10 sm:px-12 sm:py-14 flex flex-col justify-center transition-colors duration-300 relative">
          
          {/* === TOMBOL KEMBALI === */}
          <Link 
            href="/" 
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800/50 transition-all duration-300 hover:rotate-90 z-20"
            title="Kembali ke Beranda"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
          
          {/* === LOGO BRAND === */}
          <div className="mb-8 flex flex-col items-center justify-center w-full">
            <div className="mb-2 flex justify-center transition-transform duration-300 hover:scale-102">
              <img 
                src="/images/logo-priolo.png" 
                alt="Logo Priolo Alfamidi" 
                className="block dark:hidden h-20 w-auto object-contain" 
              />
              <img 
                src="/images/logo-priolo-white.png" 
                alt="Logo Priolo Alfamidi White" 
                className="hidden dark:block h-18 w-auto object-contain" 
              />
            </div>
          </div> 
          
          {/* === FORM LOGIN === */}
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            
            {/* === ERROR ALERT === */}
            {errorMsg && (
              <div className="p-3 text-xs text-[#D11A22] dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-[#D11A22]/20 dark:border-red-900/40 rounded-lg font-semibold flex items-center gap-2 animate-shake">
                <img src="/icons/icon-alert.svg" alt="Alert Icon" className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* === FIELDSET: EMAIL === */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                Email
              </label>
              <div className="relative group">
                <span className="dark:invert absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 group-hover:text-[#142B4D] dark:group-hover:text-[#FE9A00] transition-colors duration-200">
                  <img src="/icons/icon-email.svg" alt="Email Icon" className="w-4 h-4" />
                </span>
                <input 
                  type="email" 
                  id="email" 
                  required 
                  placeholder="NIK@alfamidi.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1A2647] outline-none hover:border-[#142B4D] dark:hover:border-[#FE9A00] focus:border-[#FE9A00] dark:focus:border-[#FE9A00] focus:ring-4 focus:ring-[#FE9A00]/10 dark:focus:ring-[#FE9A00]/20 transition-all duration-200 font-medium placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>
            
            {/* === FIELDSET: PASSWORD === */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                Password
              </label>
              <div className="relative group">
                <span className="dark:invert absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 group-hover:text-[#142B4D] dark:group-hover:text-[#FE9A00] transition-colors duration-200">
                  <img src="/icons/icon-lock.svg" alt="Lock Icon" className="w-4 h-4" />
                </span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  required 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full h-11 pl-10 pr-10 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1A2647] outline-none hover:border-[#142B4D] dark:hover:border-[#FE9A00] focus:border-[#FE9A00] dark:focus:border-[#FE9A00] focus:ring-4 focus:ring-[#FE9A00]/10 dark:focus:ring-[#FE9A00]/20 transition-all duration-200 font-medium placeholder-gray-400 dark:placeholder-gray-500"
                />
                
                {/* === TOGGLE PASSWORD MASK === */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#142B4D] dark:hover:text-[#FE9A00] transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* === LINK LUPA SANDI === */}
            <div className="text-right -mt-1">
              <Link 
                href="login/lupasandi" 
                className="text-xs text-[#D11A22] dark:text-red-400 font-bold hover:opacity-75 transition-opacity duration-200"
              >
                Lupa Kata Sandi Anda?
              </Link>
            </div>
            
            {/* === ACTION BUTTON === */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 bg-[#142B4D] dark:bg-blue-600 hover:bg-[#1C3D6C] dark:hover:bg-blue-500 text-white font-bold text-sm rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:scale-100 disabled:cursor-not-allowed tracking-wide shadow-md hover:shadow-lg shadow-blue-950/10 dark:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  {/* === SPIN LOADING === */}
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

      {/* === MODAL NOTIFIKASI SUKSES === */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-[#111C34] rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800/60 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <img src="/icons/icon-check.svg" alt="Success" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm md:text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}