'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

const NAV_LINKS = [
  { href: '#tentang', label: 'Tentang Priolo' },
  { href: '#metodologi', label: 'Algoritma SAW' },
  { href: '#alur-kerja', label: 'Alur Kerja Priolo' },
];

const VALUE_PROPS = [
  "Berkas Berdasarkan Checklist Oleh Assessor Dengan Standar Perusahaan.",
  "Pemisahan Dokumen Kategori Negotiable & Non-Negotiable.",
  "Kalkulasi Perhitungan Rangking Otomatis Menggunakan Matriks SAW."
];

const FEATURE_CARDS = [
  {
    icon: '/icons/icon-stats.svg',
    title: 'Algoritma SAW',
    subtitle: 'Perhitungan Bobot',
    borderColor: 'hover:border-[#142B4D]',
    shadowColor: 'hover:shadow-[#142B4D]/10',
    iconBg: 'bg-[#142B4D]/5 dark:bg-[#142B4D]/20 text-[#142B4D] group-hover:bg-[#142B4D]'
  },
  {
    icon: '/icons/icon-perorangan2.svg',
    title: 'Validasi Hak Akses',
    subtitle: 'Kunci Audit Log',
    borderColor: 'hover:border-[#142B4D]',
    shadowColor: 'hover:shadow-[#142B4D]/10',
    iconBg: 'bg-[#142B4D]/5 dark:bg-[#142B4D]/20 text-[#142B4D] group-hover:bg-[#142B4D]'
  },
  {
    icon: '/icons/icon-view.svg',
    title: 'Transparansi',
    subtitle: 'Status Berkas',
    borderColor: 'hover:border-[#142B4D]',
    shadowColor: 'hover:shadow-[#142B4D]/10',
    iconBg: 'bg-[#142B4D]/5 dark:bg-[#142B4D]/20 text-[#142B4D] group-hover:bg-[#142B4D]'
  },
  {
    icon: '/icons/icon-nama.svg',
    title: '3 Level Role',
    subtitle: 'Otoritas Tegas',
    borderColor: 'hover:border-[#142B4D]',
    shadowColor: 'hover:shadow-[#142B4D]/10',
    iconBg: 'bg-[#142B4D]/5 dark:bg-[#142B4D]/20 text-[#142B4D] group-hover:bg-[#142B4D]'
  }
];

const CRITERIA_CARDS = [
  {
    id: 'C1',
    icon: '/icons/icon-file.svg',
    title: 'Kelengkapan Dokumen',
    type: 'Benefit Kriteria',
    typeColor: 'text-[#FE9A00]',
    hoverBorder: 'hover:border-[#142B4D] hover:shadow-[#142B4D]/10',
    badgeBg: 'bg-[#142B4D]/10 text-[#142B4D] group-hover:bg-[#142B4D] group-hover:text-white',
    iconContainer: 'bg-[#142B4D]/5 dark:bg-[#142B4D]/10 text-[#142B4D] group-hover:bg-[#142B4D]',
    desc: 'Persentase kesesuaian berkas berdasarkan status pemilik hak berupa badan hukum atau perorangan.',
    weight: '45% (0.45)',
    weightColor: 'text-[#142B4D] dark:text-[#FE9A00]'
  },
  {
    id: 'C2',
    icon: '/icons/icon-law.svg',
    title: 'Durasi Review Legal',
    type: 'Cost Kriteria',
    typeColor: 'text-[#D11A22]',
    hoverBorder: 'hover:border-[#142B4D] hover:shadow-[#142B4D]/10',
    badgeBg: 'bg-[#142B4D]/10 text-[#142B4D] group-hover:bg-[#142B4D] group-hover:text-white',
    iconContainer: 'bg-[#142B4D]/5 dark:bg-[#142B4D]/10 text-[#142B4D] group-hover:bg-[#142B4D]',
    desc: 'Total rentang waktu timeline peninjauan berkas, dihitung dari usulan lokasi dibuat hingga hasil validasi final tim asesor hukum.',
    weight: '35% (0.35)',
    weightColor: 'text-[#142B4D] dark:text-[#FE9A00]'
  },
  {
    id: 'C3',
    icon: '/icons/icon-cost.svg',
    title: 'Harga Sewa',
    type: 'Cost Kriteria',
    typeColor: 'text-[#D11A22]',
    hoverBorder: 'hover:border-[#142B4D] hover:shadow-[#142B4D]/10',
    badgeBg: 'bg-[#142B4D]/10 text-[#142B4D] group-hover:bg-[#142B4D] group-hover:text-white',
    iconContainer: 'bg-[#142B4D]/5 dark:bg-[#142B4D]/10 text-[#142B4D] group-hover:bg-[#142B4D]',
    desc: 'Nominal akumulasi nilai pengajuan sewa per 5 tahun. Menjaga efisiensi anggaran ekspansi agar investasi gerai optimal.',
    weight: '20% (0.20)',
    weightColor: 'text-[#142B4D] dark:text-[#FE9A00]'
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1329] text-gray-800 dark:text-gray-100 transition-colors duration-500 flex flex-col justify-between overflow-x-hidden selection:bg-[#142B4D]/30 scroll-smooth">
      
      {/* === SECTION: NAVIGASI GLOBAL === */}
      <nav className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-white/80 dark:bg-[#0B1329]/80 backdrop-blur-xl border-gray-200 dark:border-gray-800/80 shadow-xs' 
          : 'bg-transparent border-transparent py-2'
      }`}>
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* === SEKTOR KIRI: LOGO BRAND === */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="h-12 w-44 relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <div className="block dark:hidden relative w-full h-12">
                <Image 
                  src="/images/logo-priolo.png" 
                  alt="Logo Priolo" 
                  fill
                  sizes="(max-w-176px) 100vw, 176px"
                  className="object-contain" 
                  priority
                />
              </div>
              <div className="hidden dark:block relative w-full h-11">
                <Image 
                  src="/images/logo-priolo-white.png" 
                  alt="Logo Priolo White" 
                  fill
                  sizes="(max-w-176px) 100vw, 176px"
                  className="object-contain" 
                  priority
                />
              </div>
            </div>
          </Link>
          
          {/* === SEKTOR TENGAH: TAUTAN NAVIGASI === */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_LINKS.map((link) => (
              <a 
                key={link.href}
                href={link.href} 
                className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#142B4D] dark:hover:text-white transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#142B4D] dark:after:bg-[#FE9A00] hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* === SEKTOR KANAN: TRIGGER MENU MOBILE === */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="block md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* === INTERFACE DRAWER: MENU MOBILE === */}
        <div className={`md:hidden absolute top-20 left-0 w-full bg-white dark:bg-[#0B1329] border-b border-gray-200 dark:border-gray-800/80 transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible pointer-events-none'
        }`}>
          <div className="px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a 
                key={link.href}
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-gray-600 dark:text-gray-300 hover:text-[#142B4D] dark:hover:text-white transition-colors py-1"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* === SECTION: HERO HEADER === */}
      <header className="relative min-h-[calc(100vh-5.5rem)] flex flex-col justify-center items-center pt-8 pb-24 overflow-hidden">
        
        {/* === EFEK RADIASI BACKGROUND === */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#142B4D]/10 dark:bg-[#142B4D]/5 blur-[120px] rounded-full -z-10 animate-pulse duration-4000" />
        
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10 my-auto">
          
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[#142B4D]/5 dark:bg-[#142B4D]/20 text-[#142B4D] dark:text-[#FE9A00] border border-[#142B4D]/10 dark:border-[#142B4D]/30 tracking-wide uppercase mx-auto shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#FE9A00] animate-spin" style={{ animationDuration: '8s' }} />
            Sistem Penunjang Keputusan
          </span>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 dark:text-white tracking-tight leading-[1.15] max-w-3xl mx-auto">
            Pemrosesan Dokumen<br />
            <span className="bg-gradient-to-r from-[#142B4D] via-[#D11A22] to-[#FE9A00] bg-clip-text text-transparent bg-[size:200%_auto] hover:bg-right transition-all duration-1000">
              Usulan Lokasi
            </span>
          </h1>
          
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
            <strong className="text-gray-900 dark:text-white">PRIOLO</strong> (Prioritizing Location) menjembatani digitalisasi berkas legalitas dan perhitungan kelayakan usulan lokasi toko Alfamidi berdasarkan sistem penunjang keputusan.
          </p>
          
          {/* === AKSI CALL TO ACTION === */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xs mx-auto sm:max-w-none">
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-[#142B4D] hover:bg-[#1c3d6c] text-white font-bold text-sm rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#142B4D]/20 active:scale-98 text-center"
            >
              Masuk ke Sistem Sekarang
            </Link>
            <a 
              href="#metodologi" 
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-[#131C35] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800/80 font-bold text-sm rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-[#1A2647] hover:border-gray-300 dark:hover:border-gray-700 text-center"
            >
              Pelajari Kriteria Kelayakan
            </a>
          </div>
        </div>

        {/* === INDIKATOR SCROLL DOWN === */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-60 animate-bounce">
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Scroll Down</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </header>

      {/* === SECTION: ABOUT & VALUE === */}
      <section id="tentang" className="py-24 md:py-32 bg-white dark:bg-[#0E172F] border-y border-gray-200/60 dark:border-gray-800/60 transition-colors duration-300 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* === SEKTOR KIRI: ABOUT VALUE === */}
          <div className="space-y-6 text-left max-w-md">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
              Mengapa Platform <br />PRIOLO Dibutuhkan?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              Prosedur ekspansi gerai retail seringkali terhambat oleh besarnya volume berkas fisik dari pemilik lahan serta koordinasi yang lambat antara perwakilan wilayah (Admin Cabang) dan departemen legal pusat (Assessor). <span className="text-[#142B4D] dark:text-[#FE9A00] font-semibold">PRIOLO hadir untuk menjembatani secara digital.</span>
            </p>
            
            <div className="space-y-4 pt-2">
              {VALUE_PROPS.map((prop, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <img 
                    src="/icons/icon-check.svg" 
                    alt="Check Icon" 
                    className="w-5 h-5 shrink-0 mt-0.5 object-contain" 
                  />
                  <span>{prop}</span>
                </div>
              ))}
            </div>
          </div>

          {/* === SEKTOR KANAN: KEY FEATURES === */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-[#0B1329] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800/60 max-w-md mx-auto lg:w-full shadow-inner">
            {FEATURE_CARDS.map((card, idx) => {
              return (
                <div 
                  key={idx} 
                  className={`group bg-white dark:bg-[#131C35] p-5 rounded-xl border border-gray-100 dark:border-gray-800/40 text-center space-y-3 shadow-xs hover:-translate-y-2 hover:shadow-lg transition-all duration-300 ease-out ${card.borderColor} ${card.shadowColor}`}
                >
                  <div className={`h-11 w-11 rounded-lg flex items-center justify-center mx-auto transition-all duration-300 group-hover:scale-110 ${card.iconBg}`}>
                    <img 
                      src={card.icon} 
                      alt={card.title} 
                      className="w-5 h-5 object-contain transition-all duration-300 group-hover:brightness-0 group-hover:invert" 
                    />
                  </div>
                  <span className="block text-sm font-bold text-gray-900 dark:text-white">{card.title}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">{card.subtitle}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* === SECTION: METHODOLOGY & SAW === */}
      <section id="metodologi" className="py-24 md:py-32 transition-colors duration-300 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 space-y-16 w-full">
        
          {/* === METODOLOGI HEADER === */}
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-bold text-[#142B4D] dark:text-[#FE9A00] uppercase tracking-widest block">Pendekatan Algoritma Ilmiah</span>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Kriteria Kelayakan Usulan Lokasi
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Sistem menggunakan metode Simple Additive Weighting (SAW) untuk memberikan rekomendasi urutan prioritas pemrosesan usulan lokasi secara objektif berdasarkan beberapa kriteria yang telah ditentukan.
            </p>
          </div>

          {/* === GRID MATRIKS KRITERIA === */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto w-full">
            {CRITERIA_CARDS.map((item) => {
              return (
                <div 
                  key={item.id} 
                  className={`group bg-white dark:bg-[#0E172F] p-6 rounded-xl border border-gray-200 dark:border-gray-800/60 shadow-xs relative overflow-hidden hover:-translate-y-2 hover:shadow-xl transition-all duration-300 ease-out ${item.hoverBorder}`}
                >
                  {/* === BADGE MATRIKS === */}
                  <div className={`absolute top-0 right-0 p-3 font-black text-xl rounded-bl-xl group-hover:text-white dark:group-hover:text-white transition-all duration-300 ${item.badgeBg}`}>
                    {item.id}
                  </div>
                  
                  <div className="space-y-4">
                    {/* === CONTAINER ICON === */}
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${item.iconContainer}`}>
                      <img 
                        src={item.icon} 
                        alt={item.title} 
                        className="w-5 h-5 object-contain transition-all duration-300 group-hover:brightness-0 group-hover:invert" 
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white transition-colors group-hover:text-[#142B4D] dark:group-hover:text-white">
                        {item.title}
                      </h3>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${item.typeColor}`}>
                        {item.type}
                      </p>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed min-h-[72px]">
                      {item.desc}
                    </p>
                    
                    {/* === PERHITUNGAN BOBOT === */}
                    <div className="pt-4 border-t border-t-gray-100 dark:border-t-gray-800/80 flex justify-between items-center text-sm">
                      <span className="text-gray-400">Bobot Pengaruh:</span>
                      <span className={`font-extrabold ${item.weightColor} group-hover:text-[#142B4D] dark:group-hover:text-[#FE9A00]`}>
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
      <section id="alur-kerja" className="py-24 md:py-32 bg-gray-100/50 dark:bg-[#090F21] border-y border-gray-200/60 dark:border-gray-800/60 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 space-y-16 w-full">
        
          {/* === ALUR KERJA HEADER === */}
          <div className="text-right max-w-md space-y-2 justify-end ml-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Siklus Transparan Dokumen
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Bagaimana usulan lokasi baru diproses dari hulu ke hilir oleh sistem secara otomatis terstruktur.
            </p>
          </div>

          {/* === GRID SEQUENTIAL PIPELINE === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl justify-end ml-auto">
            {WORKFLOW_STEPS.map((step) => (
              <div 
                key={step.id} 
                className="group bg-white dark:bg-[#0E172F] p-6 rounded-xl border border-gray-200/50 dark:border-gray-800/40 shadow-xs hover:-translate-y-2 hover:border-[#142B4D] dark:hover:border-[#142B4D] hover:shadow-md transition-all duration-300 ease-out"
              >
                <span className="text-3xl font-black text-gray-200 dark:text-gray-800 block group-hover:text-[#142B4D]/30 transition-colors duration-300">
                  {step.id}
                </span>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-2 group-hover:text-[#142B4D] dark:group-hover:text-white">{step.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* === SECTION: FOOTER CONTENT === */}
      <footer className="py-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B1329] text-center text-xs text-gray-400 dark:text-gray-500 font-semibold tracking-wide">
        &copy; {currentYear} PRIOLO ALFAMIDI - Sistem Penunjang Keputusan Pemrosesan Dokumen ULOK
      </footer>
      
    </div>
  );
}