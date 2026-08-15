"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    async function initSession() {
      if (typeof window === "undefined") return;

      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.replace("#", "?"));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Failed to set auth session:", error);
            setErrorMessage(
              "Sesi pemulihan tidak valid atau telah kadaluwarsa.",
            );
          } else {
            setSessionReady(true);
            setErrorMessage(null);
          }
          return;
        }
      }

      // Fallback check if session is already active
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        setErrorMessage(
          "Sesi pemulihan tidak ditemukan. Silakan minta tautan atur ulang kata sandi yang baru.",
        );
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setSessionReady(true);
        setErrorMessage(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage("Kata sandi minimal harus 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setShowSuccessModal(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Gagal memperbarui kata sandi. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

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

      {/* === PASSWORD RECOVERY CONTAINER === */}
      <div className="relative z-10 backdrop-blur-md bg-white/90 dark:bg-[#161616] w-full max-w-md rounded-2xl p-5 sm:p-10 shadow-2xl border border-transparent dark:border-gray-800/40 transition-all duration-300">
        
        {/* === LOGO & TITLE HEADER === */}
        <div className="flex flex-col items-center justify-center w-full mb-8">
          <div className="mb-4 flex justify-center transition-transform duration-300 hover:scale-102">
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
          <p className="mt-1 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
            Silakan masukkan kata sandi baru untuk mengamankan akun PRISMA Anda.
          </p>
        </div>

        {/* === ERROR FEEDBACK === */}
        {sessionReady && errorMessage && (
          <div className="mb-6 p-3 text-xs text-[#D91E2E] dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-[#D91E2E]/20 dark:border-red-900/40 rounded-lg font-semibold flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* === CONDITIONAL FORM OR EXPIRATION UX === */}
        {!sessionReady && errorMessage ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 animate-fadeIn">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-[#D91E2E] dark:text-red-400 rounded-full flex items-center justify-center mb-2">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Tautan Kadaluwarsa
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => router.push("/login/lupasandi")}
              className="w-full h-11 bg-[#3365A6] hover:bg-[#2A548C] text-white font-bold text-sm rounded-lg transition-all shadow-md flex items-center justify-center"
            >
              Minta Tautan Baru
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
            {/* Kata Sandi Baru */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                Kata Sandi Baru
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-hover:text-[#3365A6] dark:group-hover:text-[#F28705] transition-colors duration-200">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
                  className="w-full h-11 pl-10 pr-10 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#161616] outline-none hover:border-[#3365A6] dark:hover:border-[#F28705] focus:border-[#F28705] dark:focus:border-[#F28705] focus:ring-4 focus:ring-[#F28705]/10 dark:focus:ring-[#F28705]/20 transition-all duration-200 font-medium placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#3365A6] dark:hover:text-[#F28705] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Konfirmasi Kata Sandi Baru */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-hover:text-[#3365A6] dark:group-hover:text-[#F28705] transition-colors duration-200">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full h-11 pl-10 pr-10 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#161616] outline-none hover:border-[#3365A6] dark:hover:border-[#F28705] focus:border-[#F28705] dark:focus:border-[#F28705] focus:ring-4 focus:ring-[#F28705]/10 dark:focus:ring-[#F28705]/20 transition-all duration-200 font-medium placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#3365A6] dark:hover:text-[#F28705] transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !sessionReady}
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
                'Simpan Kata Sandi Baru'
              )}
            </button>
          </form>
        )}

        {/* === NAVIGATION BACK === */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-xs sm:text-sm font-bold text-[#3365A6] dark:text-blue-400 hover:opacity-75 transition-all duration-200 active:scale-95 inline-block py-2 px-3 rounded-lg hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-[#111C34] rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800/60 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 text-emerald-500" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm md:text-base leading-relaxed">
              Kata sandi Anda telah berhasil diubah. Anda akan diarahkan ke
              halaman login secara otomatis...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}