'use client';

import React, { useState } from 'react';
import { loginAction } from '@/actions/auth'; // Ambil Server Action Login kita

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

      // 1. Jalankan auth login via Server Action
      const res = await loginAction(formData);

      // Jika gagal login (password salah, dll)
      if (res && !res.success) {
        throw new Error(res.error);
      }

      // 2. Jika login sukses, res SUDAH otomatis membawa 'role' langsung dari server!
      if (res && res.success && res.role) {
        
        // 3. Routing dinamis & dipaksa hard refresh pakai window.location.href biar kuki tersinkronisasi sempurna
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
    <div className="login-container">
      <div className="login-card">
        {/* SEKTOR KIRI: LOGO/GAMBAR UTAMA */}
        <div className="left-section flex flex-col items-center justify-center">
          <div className="w-full max-w-[320px] md:max-w-95 p-4 flex items-center justify-center">
            <img src="/images/logo-login.png" alt="Logo Priolo Login" className="w-full h-80 object-contain animate-fade-in" />
          </div>
        </div>
        
        {/* SEKTOR KANAN: LOGIN COMPONENT FORMS */}
        <div className="right-section">
          <div className="logo-section">
            <div className="logo mb-4">
              <img src="/images/logo-priolo-login.png" alt="Logo Priolo Alfamidi" className="h-12 w-auto object-contain" />
            </div>
            <p className="tagline-sub">The solution for a <span className="highlight">smarter expansion</span></p>
          </div>
          
          <form className="login-form" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" className="form-input" required placeholder="name@alfamidi.co.id" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" className="form-input" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            
            <div className="forgot-password">
              <a href="#" className="forgot-link">Lupa Kata Sandi Anda?</a>
            </div>
            
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}