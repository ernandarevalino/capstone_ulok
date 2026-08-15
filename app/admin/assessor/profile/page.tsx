'use client';

import React from 'react';
import ProfileGlobal from '@/components/profile_global';

export default function ProfilePage() {
  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="space-y-6">
        
        {/* === HEADER PROFILE === */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Profil Pengguna
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
            Informasi detail akun, hak akses penugasan, dan manajemen identitas Assessor Anda.
          </p>
        </div>

        {/* === PROFILE GLOBAL === */}
        <ProfileGlobal />
        
      </div>
    </div>
  );
}
