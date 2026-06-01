'use client';

import React from 'react';
import ProfileGlobal from '@/components/profile_global';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER PAGE (Satu Tema dengan Feedback & Notifikasi) */}
        <div className="max-w-255 mx-auto mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Profil Pengguna
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
            Informasi detail akun, hak akses penugasan, dan manajemen identitas Assessor Anda.
          </p>
        </div>

        {/* Memanggil komponen profile global yang sudah dimodernisasi */}
        <ProfileGlobal />
        
      </div>
    </div>
  );
}