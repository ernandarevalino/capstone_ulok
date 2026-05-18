'use client';
import React from 'react';
import ProfileGlobal from '@/components/profile_global';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Profil Pengguna</h1>
        <p className="text-sm text-gray-500 mt-1">Informasi detail akun Admin Cabang Anda.</p>
      </div>
      {/* Memanggil komponen profile global */}
      <ProfileGlobal />
    </div>
  );
}