import React from 'react';

export default function FooterGlobal() {
  return (
    <footer className="w-full bg-[#142B4D] text-gray-400 text-center py-4 text-xs font-medium border-t border-slate-700 mt-auto">
      {/* === FOOTER GLOBAL === */}
      &copy; {new Date().getFullYear()} PRIOLO ALFAMIDI - Sistem Penunjang Keputusan Pemrosesan Dokumen ULOK
    </footer>
  );
}
