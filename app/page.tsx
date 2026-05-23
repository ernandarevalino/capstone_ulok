'use client';

import React, { useState } from 'react';
import { loginAction } from '@/actions/auth'; 

/**
 * Komponen Utama Halaman Autentikasi (Login Page).
 * Menyediakan antarmuka interaktif untuk memvalidasi kredensial pengguna (Email dan Password)
 * melalui mekanisme Next.js Client Component, yang terintegrasi secara asinkron dengan Server Actions.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /**
   * Mengatur jalannya proses autentikasi akun saat pengguna menekan tombol submit.
   * Mengonversi input teks ke dalam format data formulir objek biner (FormData)
   * sebelum dikirimkan ke layer backend service.
   * * @param e - Objek event form submission dari React.
   */
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
        // Hal ini krusial agar sinkronisasi data cookie enkripsi sesi browser berjalan sempurna di sisi klien.
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
        {/* SEKTOR KIRI: ASSET VISUAL DAN ANIMASI GRAFIS UTAMA */}
        <div className="left-section flex flex-col items-center justify-center">
          <div className="w-full max-w-[320px] md:max-w-95 p-4 flex items-center justify-center">
            <img 
              src="/images/logo-login.png" 
              alt="Logo Priolo Login" 
              className="w-full h-80 object-contain animate-fade-in" 
            />
          </div>
        </div>
        
        {/* SEKTOR KANAN: FORMULIR INPUT KREDENSIAL PENGGUNA */}
        <div className="right-section">
          <div className="logo-section flex flex-col items-center justify-center w-full">
            <div className="logo mb-4 flex justify-center">
              <img 
                src="/images/logo-priolo.png" 
                alt="Logo Priolo Alfamidi" 
                className="h-24 w-auto object-contain" 
              />
            </div>
          </div>  
          
          <form className="login-form" onSubmit={handleLogin}>
            {/* Banner Informasi Pesan Kesalahan (Error Alert Box) */}
            {errorMsg && (
              <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Field Input Akun Alamat Email Karyawan */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                className="form-input" 
                required 
                placeholder="NIK@alfamidi.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            
            {/* Field Input Kata Sandi / Password Keamanan */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                className="form-input" 
                required 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            
            {/* Tautan Fitur Recovery Kata Sandi */}
            <div className="forgot-password">
              <a href="#" className="forgot-link">Lupa Kata Sandi Anda?</a>
            </div>
            
            {/* Tombol Aksi Masuk Sistem Terproteksi */}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}