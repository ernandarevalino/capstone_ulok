'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Check,
  BarChart3,
  ShieldCheck,
  Eye,
  Users,
  FileText,
  Scale,
  DollarSign
} from 'lucide-react';

const NAV_LINKS = [
  { href: '#tentang', label: 'Tentang PRISMA' },
  { href: '#metodologi', label: 'Algoritma SAW' },
  { href: '#alur-kerja', label: 'Alur Kerja PRISMA' },
];

const VALUE_PROPS = [
  "Berkas Berdasarkan Checklist Oleh Assessor Dengan Standar Perusahaan.",
  "Pemisahan Dokumen Kategori Negotiable & Non-Negotiable.",
  "Kalkulasi Perhitungan Rangking Otomatis Menggunakan Matriks SAW."
];

const FEATURE_CARDS = [
  {
    icon: BarChart3,
    title: 'Algoritma SAW',
    subtitle: 'Perhitungan Bobot',
    iconBg: 'bg-[#3365A6]/10 dark:bg-[#F28705]/10 text-[#3365A6] dark:text-[#F28705]'
  },
  {
    icon: ShieldCheck,
    title: 'Validasi Hak Akses',
    subtitle: 'Kunci Audit Log',
    iconBg: 'bg-[#3365A6]/10 dark:bg-[#F28705]/10 text-[#3365A6] dark:text-[#F28705]'
  },
  {
    icon: Eye,
    title: 'Transparansi',
    subtitle: 'Status Berkas',
    iconBg: 'bg-[#3365A6]/10 dark:bg-[#F28705]/10 text-[#3365A6] dark:text-[#F28705]'
  },
  {
    icon: Users,
    title: '3 Level Role',
    subtitle: 'Otoritas Tegas',
    iconBg: 'bg-[#3365A6]/10 dark:bg-[#F28705]/10 text-[#3365A6] dark:text-[#F28705]'
  }
];

const CRITERIA_CARDS = [
  {
    id: 'C1',
    icon: FileText,
    title: 'Kelengkapan Dokumen',
    type: 'Benefit Kriteria',
    typeColor: 'text-[#D91E2E]',
    badgeBg: 'bg-[#D91E2E]/10 text-[#D91E2E]',
    iconContainer: 'bg-[#D91E2E]/10 text-[#D91E2E]',
    desc: 'Persentase kesesuaian berkas berdasarkan status pemilik hak berupa badan hukum atau perorangan.',
    weight: '45% (0.45)',
    weightColor: 'text-[#D91E2E]'
  },
  {
    id: 'C2',
    icon: Scale,
    title: 'Durasi Review Legal',
    type: 'Cost Kriteria',
    typeColor: 'text-[#D91E2E]',
    badgeBg: 'bg-[#D91E2E]/10 text-[#D91E2E]',
    iconContainer: 'bg-[#D91E2E]/10 text-[#D91E2E]',
    desc: 'Total rentang waktu timeline peninjauan berkas, dihitung dari usulan lokasi dibuat hingga hasil validasi final.',
    weight: '35% (0.35)',
    weightColor: 'text-[#D91E2E]'
  },
  {
    id: 'C3',
    icon: DollarSign,
    title: 'Harga Sewa',
    type: 'Cost Kriteria',
    typeColor: 'text-[#D91E2E]',
    badgeBg: 'bg-[#D91E2E]/10 text-[#D91E2E]',
    iconContainer: 'bg-[#D91E2E]/10 text-[#D91E2E]',
    desc: 'Nominal akumulasi nilai pengajuan sewa per 5 tahun. Menjaga efisiensi anggaran ekspansi agar investasi gerai optimal.',
    weight: '20% (0.20)',
    weightColor: 'text-[#D91E2E]'
  }
];

const WORKFLOW_STEPS = [
  { id: '01', title: 'Inisiasi & Lokasi', desc: 'Admin Cabang menginput titik koordinat, data pemilik, status jaminan bank, serta nilai sewa lahan toko.' },
  { id: '02', title: 'Kategorisasi Folder', desc: 'Sistem otomatis membagi folder wajib berdasarkan badan hukum / perorangan sesuai checklist_master.' },
  { id: '03', title: 'Verifikasi Assessor', desc: 'Tim Legal menguji keaslian berkas digital, memberikan feedback resmi atau melakukan approval langsung.' },
  { id: '04', title: 'Komputasi Rangking', desc: 'Algoritma SAW menghitung akumulasi matriks terpusat untuk menampilkan rekomendasi usulan terbaik.' }
];

export default function WelcomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState('2026');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-[#0D0D0D] text-[#0D0D0D] dark:text-[#F2F2F2] transition-colors duration-200 ease-in-out flex flex-col justify-between overflow-x-hidden selection:bg-[#3365A6]/30 scroll-smooth">

      {/* Full-Page Fixed Ambient Lights (Desktop Light Mode Only) */}
      <div className="hidden md:block dark:hidden fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Blob 1: Biru PRISMA (Top-Left) */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[#3365A6]/35 rounded-full blur-[130px] animate-pulse transform-gpu will-change-transform" />

        {/* Blob 2: Merah PRISMA (Bottom-Right) */}
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-[#D91E2E]/30 rounded-full blur-[130px] animate-pulse [animation-delay:1.5s] transform-gpu will-change-transform" />

        {/* Blob 3: Kuning PRISMA (Center Accent) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#F28705]/25 rounded-full blur-[120px] animate-pulse [animation-delay:3s] transform-gpu will-change-transform" />

        {/* Blob 4: Biru PRISMA (Top-Right) */}
        <div className="absolute -top-20 -right-20 w-[450px] h-[450px] bg-[#3365A6]/25 rounded-full blur-[110px] animate-pulse [animation-delay:2s] transform-gpu will-change-transform" />

        {/* Blob 5: Merah PRISMA (Bottom-Left) */}
        <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-[#D91E2E]/25 rounded-full blur-[110px] animate-pulse [animation-delay:2.5s] transform-gpu will-change-transform" />
      </div>

      {/* === SECTION: NAVIGASI GLOBAL === */}
      <nav className={`sticky top-0 z-50 w-full transition-all duration-200 ease-in-out border-b backdrop-blur-md ${
        scrolled
          ? 'bg-[#F2F2F2]/80 dark:bg-[#0D0D0D]/80 border-slate-200/60 dark:border-slate-800/60 shadow-sm'
          : 'bg-[#F2F2F2]/50 dark:bg-[#0D0D0D]/50 border-transparent py-1'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* === SEKTOR KIRI: LOGO BRAND === */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="h-12 w-44 relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <div className="block dark:hidden relative w-full h-12">
                <Image
                  src="/images/prisma-black-landing.png"
                  alt="Logo PRISMA"
                  fill
                  sizes="(max-w-200px) 150vw, 150px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="hidden dark:block relative w-full h-11">
                <Image
                  src="/images/prisma-white-landing.png"
                  alt="Logo PRISMA"
                  fill
                  sizes="(max-w-200px) 150vw, 150px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </Link>

          {/* === SEKTOR TENGAH: TAUTAN NAVIGASI === */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 ml-auto mr-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#3365A6] dark:hover:text-[#F28705] transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#3365A6] dark:after:bg-[#F28705] hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* === SEKTOR KANAN: MOBILE TRIGGER === */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="block md:hidden p-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all duration-200 active:scale-95 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* === INTERFACE DRAWER: MENU MOBILE === */}
        <div className={`md:hidden absolute top-20 left-0 w-full bg-[#F2F2F2] dark:bg-[#0D0D0D] border-b border-slate-200/60 dark:border-slate-800/60 transition-all duration-200 ease-in-out ${
          mobileMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible pointer-events-none'
        }`}>
          <div className="px-6 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-600 dark:text-slate-400 hover:text-[#3365A6] dark:hover:text-[#F28705] py-2 px-3 block rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 active:scale-95 transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* === SECTION: HERO HEADER === */}
      <header className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center py-10 sm:py-16 lg:py-24 overflow-hidden">

        {/* === RADIATING BACKGROUND EFFECT === */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#3365A6]/10 dark:bg-[#F28705]/5 blur-[80px] sm:blur-[120px] rounded-full -z-10 animate-pulse transform-gpu will-change-transform" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10 my-auto">

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0D0D0D] dark:text-[#F2F2F2] leading-[1.15] max-w-4xl mx-auto">
            Pemrosesan Dokumen
            <br />
            <span className="inline-block bg-gradient-to-r from-[#D91E2E] via-[#F28705] to-[#3365A6] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x hover:scale-[1.02] transition-transform duration-300 ease-out cursor-default py-1">
              Usulan Lokasi
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            <strong className="text-[#0D0D0D] dark:text-[#F2F2F2]">PRISMA</strong> (Platform Rekomendasi dan Integrasi Sewa Mitra Alfamidi) menjembatani digitalisasi berkas legalitas dan perhitungan kelayakan usulan lokasi toko Alfamidi berdasarkan sistem penunjang keputusan.
          </p>

          {/* === CALL TO ACTION ACTIONS === */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xs mx-auto sm:max-w-none">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-[#3365A6] hover:bg-[#D91E2E] text-white font-bold text-sm rounded-xl shadow-md transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 text-center"
            >
              Masuk ke Sistem Sekarang
            </Link>
            <a
              href="#metodologi"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-[#141414] text-[#0D0D0D] dark:text-[#F2F2F2] font-bold text-sm rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-center hover:scale-105 active:scale-95"
            >
              Pelajari Kriteria Kelayakan
            </a>
          </div>
        </div>

        {/* === SCROLL DOWN INDICATOR === */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-60 animate-bounce">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Scroll Down</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </header>

      {/* === SECTION: ABOUT & VALUE === */}
      <section id="tentang" className="py-16 sm:py-24 lg:py-32 bg-white/80 backdrop-blur-sm dark:bg-[#141414]/90 border-y border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-colors duration-200 ease-in-out scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* === SEKTOR KIRI: ABOUT VALUE === */}
          <div className="space-y-6 text-left max-w-xl mx-auto lg:mx-0">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D0D0D] dark:text-[#F2F2F2] tracking-tight leading-tight">
              Mengapa Platform <br />PRISMA Dibutuhkan?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Prosedur ekspansi gerai retail seringkali terhambat oleh besarnya volume berkas fisik dari pemilik lahan serta koordinasi yang lambat antara perwakilan wilayah (Admin Cabang) and departemen legal pusat (Assessor). <span className="text-[#3365A6] dark:text-[#F28705] font-semibold">PRISMA hadir untuk menjembatani secara digital.</span>
            </p>

            <div className="space-y-4 pt-2">
              {VALUE_PROPS.map((prop, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center text-[#3365A6] dark:text-[#F28705]">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>{prop}</span>
                </div>
              ))}
            </div>
          </div>

          {/* === SEKTOR KANAN: KEY FEATURES === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F2F2F2]/80 backdrop-blur-sm dark:bg-[#0D0D0D]/80 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 max-w-xl mx-auto lg:w-full lg:max-w-none shadow-sm">
            {FEATURE_CARDS.map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={idx}
                  className="group bg-white/80 backdrop-blur-sm dark:bg-[#141414]/90 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-center space-y-3 shadow-sm hover:-translate-y-2 hover:shadow-md transition-all duration-200 ease-in-out"
                >
                  <div className={`h-11 w-11 rounded-lg flex items-center justify-center mx-auto transition-all duration-200 group-hover:scale-110 ${card.iconBg}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="block text-sm font-bold text-[#0D0D0D] dark:text-[#F2F2F2]">{card.title}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">{card.subtitle}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* === SECTION: METHODOLOGY & SAW === */}
      <section id="metodologi" className="py-16 sm:py-24 lg:py-32 transition-colors duration-200 ease-in-out scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 w-full">

          {/* === METODOLOGI HEADER === */}
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-bold text-[#3365A6] dark:text-[#F28705] uppercase tracking-widest block">Pendekatan Algoritma Ilmiah</span>
            <h2 className="text-3xl font-extrabold text-[#0D0D0D] dark:text-[#F2F2F2] tracking-tight">
              Kriteria Kelayakan Usulan Lokasi
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Sistem menggunakan metode Simple Additive Weighting (SAW) untuk memberikan rekomendasi urutan prioritas pemrosesan usulan lokasi secara objektif berdasarkan beberapa kriteria yang telah ditentukan.
            </p>
          </div>

          {/* === GRID MATRIKS KRITERIA === */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
            {CRITERIA_CARDS.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  className="group bg-white/80 backdrop-blur-sm dark:bg-[#141414]/90 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden hover:-translate-y-2 hover:shadow-md transition-all duration-200 ease-in-out"
                >
                  {/* === BADGE MATRIKS === */}
                  <div className={`absolute top-0 right-0 p-3 font-black text-xl rounded-bl-xl transition-all duration-200 ${item.badgeBg}`}>
                    {item.id}
                  </div>

                  <div className="space-y-4">
                    {/* === CONTAINER ICON === */}
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${item.iconContainer}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#0D0D0D] dark:text-[#F2F2F2] transition-colors group-hover:text-[#3365A6] dark:group-hover:text-[#F28705]">
                        {item.title}
                      </h3>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${item.typeColor}`}>
                        {item.type}
                      </p>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed min-h-[72px]">
                      {item.desc}
                    </p>

                    {/* === PERHITUNGAN BOBOT === */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
                      <span className="text-slate-400">Bobot Pengaruh:</span>
                      <span className={`font-extrabold ${item.weightColor}`}>
                        {item.weight}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* === SECTION: WORKFLOW PROCESS === */}
      <section id="alur-kerja" className="py-16 sm:py-24 lg:py-32 bg-white/80 backdrop-blur-sm dark:bg-[#141414]/90 border-y border-slate-200/80 dark:border-slate-800/80 shadow-sm scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 w-full">

          {/* === ALUR KERJA HEADER === */}
          <div className="text-right max-w-md space-y-2 justify-end ml-auto">
            <h2 className="text-3xl font-extrabold text-[#0D0D0D] dark:text-[#F2F2F2] tracking-tight">
              Siklus Transparan Dokumen
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Bagaimana usulan lokasi baru diproses dari hulu ke hilir oleh sistem secara otomatis terstruktur.
            </p>
          </div>

          {/* === GRID SEQUENTIAL PIPELINE === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl justify-end ml-auto">
            {WORKFLOW_STEPS.map((step) => (
              <div
                key={step.id}
                className="group bg-[#F2F2F2] dark:bg-[#0D0D0D] p-6 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:-translate-y-2 hover:border-[#3365A6] dark:hover:border-[#F28705] hover:shadow-md transition-all duration-200 ease-in-out"
              >
                <span className="text-3xl font-black text-slate-300 dark:text-slate-700 block group-hover:text-[#3365A6]/30 dark:group-hover:text-[#F28705]/30 transition-colors duration-200">
                  {step.id}
                </span>
                <h4 className="font-bold text-sm text-[#0D0D0D] dark:text-[#F2F2F2] mt-2 group-hover:text-[#3365A6] dark:group-hover:text-[#F28705]">{step.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* === SECTION: FOOTER CONTENT === */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800 bg-[#F2F2F2] dark:bg-[#0D0D0D] text-center text-xs text-slate-500 dark:text-slate-500 font-semibold tracking-wide">
        &copy; {currentYear} PRISMA - Sistem Penunjang Keputusan Pemrosesan Dokumen ULOK
      </footer>

    </div>
  );
}
