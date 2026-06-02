'use client';

import React, { useState } from 'react';
import Link from 'next/link';

/**
 * Halaman Lupa Sandi (Forgot Password).
 * Menyediakan antarmuka interaktif bagi pengguna untuk memasukkan alamat email mereka
 * guna melakukan pemulihan kata sandi (reset password).
 */
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

    // Validasi sederhana
    if (!email) {
      setErrorMsg('Alamat email wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      // Di sini kita dapat menambahkan integrasi Server Action/Supabase Auth reset password di masa mendatang.
      // Sebagai template standar yang rapi, kita sediakan simulasi pengiriman email pemulihan sandi.
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
    <div className="min-h-screen flex items-center justify-center bg-[#0B192C] px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#1E3047] p-8 md:p-10 rounded-2xl shadow-2xl border border-[#314C6F]">
        <div className="flex flex-col items-center">
          {/* Logo Brand Priolo */}
          <img
            src="/images/logo-priolo.png"
            alt="Logo Priolo"
            className="h-20 w-auto object-contain mb-4"
          />
          <h2 className="text-center text-2xl font-extrabold text-white">
            Lupa Kata Sandi?
          </h2>
          <p className="mt-2 text-center text-sm text-slate-300 max-w-xs">
            Masukkan alamat email terdaftar Anda untuk menerima tautan pemulihan kata sandi.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Banner Pesan Kesalahan */}
          {errorMsg && (
            <div className="p-3 text-xs text-red-200 bg-red-900/50 border border-red-500 rounded-lg font-medium flex items-center gap-2">
              ⚠️ <span>{errorMsg}</span>
            </div>
          )}

          {/* Banner Pesan Sukses */}
          {successMsg && (
            <div className="p-3 text-xs text-emerald-200 bg-emerald-900/50 border border-emerald-500 rounded-lg font-medium flex items-center gap-2">
              🎉 <span>{successMsg}</span>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div className="form-group">
              <label htmlFor="email-address" className="block text-sm font-semibold text-slate-200 mb-2">
                Alamat Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-[#314C6F] placeholder-slate-400 text-white bg-[#0B192C] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="NIK@alfamidi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Kirim Link Pemulihan'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition duration-150 ease-in-out"
          >
            ← Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}
