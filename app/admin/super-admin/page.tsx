'use client';

import React, { useState, useEffect } from 'react';
import { getDashboardStatsAction } from '@/actions/superadmin';
import Link from 'next/link';

/**
 * Komponen Utama Halaman Dashboard Super Admin.
 * Menyajikan visualisasi ringkasan eksekutif (Executive Summary Dashboard) berupa metrics 
 * kuantitas data pengguna aktif (Admin Cabang & Assessor) serta total dokumen usulan lokasi (ULOK) 
 * yang dimuat secara dinamis dari database menggunakan arsitektur Next.js Client Component.
 */
export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ adminCabang: 0, assessor: 0, totalUlok: 0 });
  const [loading, setLoading] = useState(true);

  /**
   * Pemicu pemanggilan fungsi asinkron (Data Fetching lifecycle) saat komponen pertama kali dirender.
   * Mengambil agregasi total baris data langsung melalui fungsionalitas Server Actions backend.
   */
  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const res = await getDashboardStatsAction();
      if (res && res.success) {
        setStats(res.stats);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* BANNER INFORMASI DAN UCAPAN SELAMAT DATANG */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-xl font-black text-gray-800 tracking-wide">Dashboard Utama Super Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selamat datang kembali! Panel ini digunakan untuk memonitoring total user aktif dan aktivitas dokumen Usulan Lokasi (ULOK) Alfamidi.
        </p>
      </div>

      {/* STRUKTUR GRID KARTU METRICS STATISTIK UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KARTU KONTROL 1: AGREGASI TOTAL ADMIN CABANG */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between group hover:border-blue-500 transition-colors">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Admin Cabang</p>
            <h3 className="text-3xl font-black text-gray-800">
              {loading ? '...' : `${stats.adminCabang} User`}
            </h3>
            <Link href="/admin/super-admin/daftaruser/admincabang" className="text-xs text-blue-600 hover:underline font-semibold inline-block pt-2">
              Kelola Admin Cabang &rarr;
            </Link>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 text-blue-600 font-bold text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
            👥
          </div>
        </div>

        {/* KARTU KONTROL 2: AGREGASI TOTAL TIM ASSESSOR */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between group hover:border-purple-500 transition-colors">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tim Assessor</p>
            <h3 className="text-3xl font-black text-gray-800">
              {loading ? '...' : `${stats.assessor} User`}
            </h3>
            <Link href="/admin/super-admin/daftaruser/assessor" className="text-xs text-purple-600 hover:underline font-semibold inline-block pt-2">
              Kelola Tim Penilai &rarr;
            </Link>
          </div>
          <div className="p-4 rounded-xl bg-purple-50 text-purple-600 font-bold text-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
            ⚖️
          </div>
        </div>

        {/* KARTU KONTROL 3: AGREGASI TOTAL BERKAS USULAN LOKASI (ULOK) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between group hover:border-emerald-500 transition-colors">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pengajuan ULOK</p>
            <h3 className="text-3xl font-black text-gray-800">
              {loading ? '...' : `${stats.totalUlok} Berkas`}
            </h3>
            <p className="text-[11px] text-gray-400 pt-2 font-medium">Terintegrasi otomatis via Database</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            📂
          </div>
        </div>
      </div>

      {/* PANEL INFORMASI OTORISASI DAN TAUTAN AKSES CEPAT (QUICK ACTIONS) */}
      <div className="bg-linear-to-r from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-md border border-slate-700">
        <h3 className="font-bold text-base tracking-wide">Hak Akses Penuh Super Admin</h3>
        <p className="text-xs text-slate-300 mt-1 max-w-6xl leading-relaxed">
          Sebagai Super Admin sistem SPK PT. Midi Utama Indonesia Tbk, Anda berwenang penuh memonitor akun, Melihat total dokumen master, dan mengontrol kelancaran alur penilaian dokumen menggunakan pembobotan metode SAW (Simple Additive Weighting).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/super-admin/daftaruser/admincabang" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
            Data Cabang
          </Link>
          <Link href="/admin/super-admin/profile" className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
            Profil Saya
          </Link>
        </div>
      </div>
    </div>
  );
}