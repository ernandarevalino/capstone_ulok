'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  GitBranch, 
  UserCheck, 
  BarChart3, 
  Binary, 
  Eye, 
  CheckCircle,
  Sparkles,
  Database,
  FileText,
  Layers,
  MessageSquare,
  Bell
} from 'lucide-react';

export default function WelcomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1329] text-gray-800 dark:text-gray-100 transition-colors duration-300 flex flex-col justify-between overflow-x-hidden selection:bg-blue-500/30 scroll-smooth">
      
      {/* ==================== 1. PREMIUM STICKY NAVBAR ==================== */}
      <nav className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-white/80 dark:bg-[#0B1329]/80 backdrop-blur-xl border-gray-200 dark:border-gray-800/80 shadow-xs' 
          : 'bg-transparent border-transparent'
      }`}>
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Brand Sektor Kiri */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="h-12 w-44 relative flex items-center justify-center transition-transform duration-300 group-hover:scale-102">
              <img 
                src="/images/logo-priolo.png" 
                alt="Logo Priolo" 
                className="block dark:hidden h-11 w-auto object-contain" 
              />
              <img 
                src="/images/logo-priolo-white.png" 
                alt="Logo Priolo White" 
                className="hidden dark:block h-10 w-auto object-contain" 
              />
            </div>
          </Link>
          
          {/* Navigasi Menu Sektor Kanan - Berjarak Proporsional */}
          <div className="flex items-center gap-5 lg:gap-6">
            <a href="#tentang" className="hidden lg:block text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-[#142B4D] dark:hover:text-white transition-colors">
              Tentang
            </a>
            <a href="#metodologi" className="hidden md:block text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-[#142B4D] dark:hover:text-white transition-colors">
              Kriteria SAW
            </a>
            <a href="#alur-kerja" className="hidden md:block text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-[#142B4D] dark:hover:text-white transition-colors">
              Alur
            </a>
            <a href="#arsitektur" className="hidden lg:block text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-[#142B4D] dark:hover:text-white transition-colors">
              Hak Akses
            </a>
            <a href="#skema" className="hidden sm:block text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-[#142B4D] dark:hover:text-white transition-colors">
              Infrastruktur
            </a>
          </div>

        </div>
      </nav>

      {/* ==================== 2. MODERN HERO SECTION (Isolasi Layar Full) ==================== */}
      <header className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center pt-8 pb-16 overflow-hidden">
        
        {/* Ornamen Cahaya Radial Glow Efek */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-120 bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full -z-10 animate-pulse" />
        
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          
          {/* Badge Atas */}
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-[#142B4D] dark:text-blue-300 border border-blue-100/80 dark:border-blue-900/40 tracking-wide uppercase mx-auto shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Sistem Penunjang Keputusan • PT. Midi Utama Indonesia, Tbk
          </span>
          
          {/* Judul Utama */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 dark:text-white tracking-tight leading-[1.15] max-w-3xl mx-auto">
            Pemrosesan Dokumen<br />
            <span className="bg-linear-to-r from-[#0F3050] via-[#9A162A] to-[#E3B124] dark:from-[#E3B124] dark:via-[#0F3050] dark:to-[#9A162A] bg-clip-text text-transparent">
              Usulan Lokasi (ULOK)
            </span>
          </h1>
          
          {/* Sub-Deskripsi */}
          <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
            <strong>PRIOLO</strong> *(Prioritizing Location)* menjembatani digitalisasi berkas legalitas sewa lahan dan standardisasi perhitungan kelayakan wilayah operasional toko Alfamidi secara objektif.
          </p>
          
          {/* Tombol Aksi */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xs mx-auto sm:max-w-none">
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-7 py-3.5 bg-linear-to-r from-[#142B4D] to-[#1C3D6C] dark:from-blue-600 dark:to-indigo-600 text-white font-bold text-xs rounded-xl transition-all duration-300 hover:scale-[1.06] active:scale-[0.98] shadow-xl shadow-blue-900/20 text-center"
            >
              Masuk ke Sistem Sekarang
            </Link>
            <a 
              href="#metodologi" 
              className="w-full sm:w-auto px-7 py-3.5 bg-white dark:bg-[#131C35] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800/80 font-bold text-xs rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-[#1A2647] text-center"
            >
              Pelajari Kriteria Kelayakan
            </a>
          </div>

        </div>
      </header>

      {/* ==================== 3. SECTION VALUE PROPOSITION (ID dipindah ke dalam untuk Akurasi Scroll) ==================== */}
      <section className="min-h-screen flex flex-col justify-center py-32 lg:py-40 bg-white dark:bg-[#0E172F] border-y border-gray-200/60 dark:border-gray-800/60 transition-colors duration-300">
        <div id="tentang" className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center scroll-mt-28">
          
          <div className="space-y-6 text-left max-w-md">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
              Mengapa Platform <br />PRIOLO Dibutuhkan?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              Prosedur konvensional ekspansi gerai retail seringkali terhambat oleh besarnya volume berkas fisik dari pemilik lahan serta koordinasi yang lambat antara perwakilan wilayah dan departemen legal pusat. PRIOLO memusatkan kendali secara digital.
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Sentralisasi Berkas Berdasarkan Checklist Standar Perusahaan.</span>
              </div>
              <div className="flex items-start gap-3 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Pemisahan Dokumen Kategori *Negotiable* & *Non-Negotiable*.</span>
              </div>
              <div className="flex items-start gap-3 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Kalkulasi Komputasi Rangking Otomatis Menggunakan Matriks SAW.</span>
              </div>
            </div>
          </div>

          {/* Grid Box Fitur Kunci */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-[#0B1329] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800/60 max-w-sm mx-auto lg:w-full">
            
            <div className="group bg-white dark:bg-[#131C35] p-4 rounded-xl border border-gray-100 dark:border-gray-800/40 text-center space-y-2 shadow-xs hover:-translate-y-1.5 hover:border-blue-500/40 dark:hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 ease-out">
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-105">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="block text-xs font-bold text-gray-900 dark:text-white">Matriks SAW</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Kalkulasi Akurat</span>
            </div>

            <div className="group bg-white dark:bg-[#131C35] p-4 rounded-xl border border-gray-100 dark:border-gray-800/40 text-center space-y-2 shadow-xs hover:-translate-y-1.5 hover:border-purple-500/40 dark:hover:border-purple-500/30 hover:shadow-md hover:shadow-purple-500/5 transition-all duration-300 ease-out">
              <div className="h-10 w-10 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-105">
                <Binary className="w-4 h-4" />
              </div>
              <span className="block text-xs font-bold text-gray-900 dark:text-white">Validasi NIK</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Kunci Audit Log</span>
            </div>

            <div className="group bg-white dark:bg-[#131C35] p-4 rounded-xl border border-gray-100 dark:border-gray-800/40 text-center space-y-2 shadow-xs hover:-translate-y-1.5 hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5 transition-all duration-300 ease-out">
              <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-105">
                <Eye className="w-4 h-4" />
              </div>
              <span className="block text-xs font-bold text-gray-900 dark:text-white">Transparansi</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Status Berkas</span>
            </div>

            <div className="group bg-white dark:bg-[#131C35] p-4 rounded-xl border border-gray-100 dark:border-gray-800/40 text-center space-y-2 shadow-xs hover:-translate-y-1.5 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 ease-out">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-105">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="block text-xs font-bold text-gray-900 dark:text-white">3 Level Role</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Otoritas Tegas</span>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== 4. SECTION METODOLOGI & KRITERIA SAW (ID dipindah ke dalam untuk Akurasi Scroll) ==================== */}
      <section className="min-h-screen flex flex-col justify-center py-32 lg:py-40 transition-colors duration-300">
        <div id="metodologi" className="max-w-5xl mx-auto px-6 space-y-12 scroll-mt-28 w-full">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Pendekatan Algoritma Ilmiah</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Pembobotan Kriteria Kelayakan Lahan
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-relaxed">
              Sistem menggunakan metode *Simple Additive Weighting* (SAW) untuk memberikan rekomendasi urutan prioritas pemrosesan usulan lokasi secara objektif.
            </p>
          </div>

          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
            {/* C1 */}
            <div className="group bg-white dark:bg-[#0E172F] p-5 rounded-xl border border-gray-200 dark:border-gray-800/60 shadow-xs relative overflow-hidden hover:-translate-y-2 hover:border-blue-500/40 dark:hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 ease-out">
              <div className="absolute top-0 right-0 p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-xl rounded-bl-xl group-hover:bg-blue-500/20 transition-colors">C1</div>
              <div className="space-y-4">
                <div className="h-9 w-9 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">Kelengkapan Dokumen</h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mt-0.5">Benefit Kriteria</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Persentase kesesuaian berkas identitas pemilik, akta jaminan bank, sertifikat alas hak, atau surat keterangan kelurahan.
                </p>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex justify-between items-center text-xs">
                  <span className="text-gray-400 scale-95 origin-left">Bobot Pengaruh:</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">45% (0.45)</span>
                </div>
              </div>
            </div>

            {/* C2 */}
            <div className="group bg-white dark:bg-[#0E172F] p-5 rounded-xl border border-gray-200 dark:border-gray-800/60 shadow-xs relative overflow-hidden hover:-translate-y-2 hover:border-red-500/40 dark:hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 ease-out">
              <div className="absolute top-0 right-0 p-2.5 bg-red-500/10 text-red-600 dark:text-red-400 font-black text-xl rounded-bl-xl group-hover:bg-red-500/20 transition-colors">C2</div>
              <div className="space-y-4">
                <div className="h-9 w-9 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white transition-colors group-hover:text-red-600 dark:group-hover:text-red-400">Durasi Review Legal</h3>
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider mt-0.5">Cost Kriteria</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Total rentang waktu timeline peninjauan berkas sengketa, masa berlaku sertifikat, hingga hasil validasi final tim asesor hukum.
                </p>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex justify-between items-center text-xs">
                  <span className="text-gray-400 scale-95 origin-left">Bobot Pengaruh:</span>
                  <span className="font-extrabold text-red-600 dark:text-red-400">35% (0.35)</span>
                </div>
              </div>
            </div>

            {/* C3 */}
            <div className="group bg-white dark:bg-[#0E172F] p-5 rounded-xl border border-gray-200 dark:border-gray-800/60 shadow-xs relative overflow-hidden hover:-translate-y-2 hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 ease-out">
              <div className="absolute top-0 right-0 p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xl rounded-bl-xl group-hover:bg-amber-500/20 transition-colors">C3</div>
              <div className="space-y-4">
                <div className="h-9 w-9 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">Harga Sewa Lahan</h3>
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider mt-0.5">Cost Kriteria</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Nominal akumulasi nilai pengajuan sewa per 5 tahun. Menjaga efisiensi anggaran ekspansi agar investasi gerai optimal.
                </p>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex justify-between items-center text-xs">
                  <span className="text-gray-400 scale-95 origin-left">Bobot Pengaruh:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">20% (0.20)</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 5. SECTION SIKLUS / ALUR KERJA PENGAJUAN (ID dipindah ke dalam untuk Akurasi Scroll) ==================== */}
      <section className="min-h-screen flex flex-col justify-center py-32 lg:py-40 bg-gray-100/50 dark:bg-[#090F21] border-y border-gray-200/60 dark:border-gray-800/60">
        <div id="alur-kerja" className="max-w-5xl mx-auto px-6 space-y-12 w-full scroll-mt-28">
          
          <div className="text-left max-w-md space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Siklus Transparan Dokumen
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Bagaimana usulan lokasi baru diproses dari hulu ke hilir oleh sistem secara otomatis terstruktur.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl">
            {/* Langkah 1 */}
            <div className="group bg-white dark:bg-[#0E172F] p-4 rounded-xl border border-gray-200/50 dark:border-gray-800/40 shadow-xs hover:-translate-y-1.5 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 ease-out">
              <span className="text-2xl font-black text-gray-200 dark:text-gray-800 block group-hover:text-blue-500/20 transition-colors">01</span>
              <h4 className="font-bold text-xs text-gray-900 dark:text-white mt-1">Inisiasi & Lokasi</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">
                Admin Cabang menginput titik koordinat, data pemilik, status jaminan bank, serta nilai sewa lahan toko.
              </p>
            </div>

            {/* Langkah 2 */}
            <div className="group bg-white dark:bg-[#0E172F] p-4 rounded-xl border border-gray-200/50 dark:border-gray-800/40 shadow-xs hover:-translate-y-1.5 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 ease-out">
              <span className="text-2xl font-black text-gray-200 dark:text-gray-800 block group-hover:text-blue-500/20 transition-colors">02</span>
              <h4 className="font-bold text-xs text-gray-900 dark:text-white mt-1">Kategorisasi Folder</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">
                Sistem otomatis membagi folder wajib berdasarkan badan hukum / perorangan sesuai *checklist_master*.
              </p>
            </div>

            {/* Langkah 3 */}
            <div className="group bg-white dark:bg-[#0E172F] p-4 rounded-xl border border-gray-200/50 dark:border-gray-800/40 shadow-xs hover:-translate-y-1.5 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 ease-out">
              <span className="text-2xl font-black text-gray-200 dark:text-gray-800 block group-hover:text-blue-500/20 transition-colors">03</span>
              <h4 className="font-bold text-xs text-gray-900 dark:text-white mt-1">Verifikasi Assessor</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">
                Tim Legal menguji keaslian berkas digital, memberikan feedback revisi atau melakukan approval langsung.
              </p>
            </div>

            {/* Langkah 4 */}
            <div className="group bg-white dark:bg-[#0E172F] p-4 rounded-xl border border-gray-200/50 dark:border-gray-800/40 shadow-xs hover:-translate-y-1.5 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 ease-out">
              <span className="text-2xl font-black text-gray-200 dark:text-gray-800 block group-hover:text-blue-500/20 transition-colors">04</span>
              <h4 className="font-bold text-xs text-gray-900 dark:text-white mt-1">Komputasi Rangking</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">
                Algoritma SAW menghitung akumulasi matriks terpusat untuk menampilkan rekomendasi usulan terbaik.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 6. SECTION ARSITEKTUR ROLE (ID dipindah ke dalam untuk Akurasi Scroll) ==================== */}
      <section className="min-h-screen flex flex-col justify-center py-32 lg:py-40 transition-colors duration-300">
        <div id="arsitektur" className="max-w-5xl mx-auto px-6 space-y-16 scroll-mt-28 w-full">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Manajemen Otoritas Tiga Tingkat
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-relaxed">
              Hak operasional dibagi secara terstruktur demi menjaga kerahasiaan data hukum korporat dan pembagian tugas yang efisien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
            
            {/* Card: Super Admin */}
            <div className="group bg-white dark:bg-[#0E172F] p-6 rounded-xl border border-gray-200 dark:border-gray-800/80 shadow-xs flex flex-col justify-between hover:-translate-y-2 hover:border-red-500/40 dark:hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 ease-out">
              <div className="space-y-4">
                <div className="h-10 w-10 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-105">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">Super Admin</h3>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold tracking-wide uppercase">Tingkat Manajemen Tertinggi</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  Mengontrol penuh tata kelola akun pengguna sistem global. Berwenang mendaftarkan serta menonaktifkan akun Admin Cabang dan Assessor secara langsung melalui profil terintegrasi.
                </p>
              </div>
            </div>

            {/* Card: Admin Cabang */}
            <div className="group bg-white dark:bg-[#0E172F] p-6 rounded-xl border border-gray-200 dark:border-gray-800/80 shadow-xs flex flex-col justify-between hover:-translate-y-2 hover:border-blue-500/40 dark:hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 ease-out">
              <div className="space-y-4">
                <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-105">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">Admin Cabang</h3>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold tracking-wide uppercase">Inisiator Usulan Wilayah</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  Bertindak sebagai pengaju berkas permohonan lokasi baru toko Alfamidi, mengelola form kelengkapan dokumen badan hukum maupun perseorangan sesuai cakupan wilayah provinsinya.
                </p>
              </div>
            </div>

            {/* Card: Assessor */}
            <div className="group bg-white dark:bg-[#0E172F] p-6 rounded-xl border border-gray-200 dark:border-gray-800/80 shadow-xs flex flex-col justify-between hover:-translate-y-2 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 ease-out">
              <div className="space-y-4">
                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-105">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">Assessor</h3>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold tracking-wide uppercase">Tim Penilai Independen</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  Eksekutor dari departemen Legal pusat. Memasukkan nilai bobot kriteria numerik, meneliti berkas sertifikat jaminan, memberikan komentar koreksi, dan memutuskan validitas usulan lokasi.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== 7. SECTION INFRASTRUKTUR & SKEMA DATA (ID dipindah ke dalam untuk Akurasi Scroll) ==================== */}
      <section className="min-h-screen flex flex-col justify-center py-32 lg:py-40 bg-white dark:bg-[#0E172F] border-t border-gray-200/60 dark:border-gray-800/60">
        <div id="skema" className="max-w-5xl mx-auto px-6 space-y-12 w-full scroll-mt-28">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest block">Keamanan & Keandalan Relasional</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Arsitektur Data Engine Terpusat
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-relaxed">
              Didukung fondasi skema basis data yang tangguh untuk memastikan data legalitas terekam dengan integritas tinggi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 max-w-4xl mx-auto w-full">
            {/* Engine 1 */}
            <div className="group p-5 bg-gray-50 dark:bg-[#131C35] rounded-xl border border-gray-100 dark:border-gray-800/40 space-y-3 hover:-translate-y-1.5 hover:border-purple-500/30 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-purple-500 transition-transform duration-300 group-hover:rotate-12" />
                <h5 className="font-bold text-xs text-gray-900 dark:text-white">Profiles & Branches Sync</h5>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Setiap data NIK pengguna terikat kuat secara relasional dengan data master regional cabang kabupaten dan provinsi operasional Alfamidi.
              </p>
            </div>

            {/* Engine 2 */}
            <div className="group p-5 bg-gray-50 dark:bg-[#131C35] rounded-xl border border-gray-100 dark:border-gray-800/40 space-y-3 hover:-translate-y-1.5 hover:border-blue-500/30 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
                <h5 className="font-bold text-xs text-gray-900 dark:text-white">Inter-Department Comments</h5>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Fitur diskusi logis langsung di dalam berkas pengajuan. Mempermudah koordinasi revisi klausul sertifikat tanpa berpindah aplikasi.
              </p>
            </div>

            {/* Engine 3 */}
            <div className="group p-5 bg-gray-50 dark:bg-[#131C35] rounded-xl border border-gray-100 dark:border-gray-800/40 space-y-3 hover:-translate-y-1.5 hover:border-amber-500/30 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-amber-500 transition-transform duration-300 group-hover:animate-bounce" />
                <h5 className="font-bold text-xs text-gray-900 dark:text-white">Real-time Alert Notifications</h5>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Pemberitahuan otomatis ketika status berkas beralih dari *Draft*, *In-Review*, hingga keputusan final *Approved* diterbitkan.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 8. FOOTER SEKTOR BAWAH ==================== */}
      <footer className="py-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B1329] text-center text-[11px] text-gray-400 dark:text-gray-500 font-semibold tracking-wide">
        &copy; {new Date().getFullYear()} PRIOLO Alfamidi Platform. All Rights Reserved.
      </footer>
      
    </div>
  );
}