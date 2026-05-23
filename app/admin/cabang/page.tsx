'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentProfile } from '@/actions/auth'; // Ambil fungsi profil yang baru kita buat

export default function AdminCabangPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fullName, setFullName] = useState<string>("Loading..."); // State menampung nama user

  const dataUsulan = [
    { nama: "Cilandak Barat", status: "Dalam Review", skor: 10, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
    { nama: "Kebayoran Lama", status: "Telah Disetujui", skor: 10, color: "text-green-600 bg-green-50 border-green-200" },
    { nama: "Kebayoran Baru", status: "Belum Direview", skor: 10, color: "text-slate-600 bg-slate-50 border-slate-200" },
    { nama: "Tb. Simatupang", status: "Revisi", skor: 10, color: "text-red-600 bg-red-50 border-red-200" },
    { nama: "Pesanggrahan", status: "Dalam Review", skor: 10, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
    { nama: "Pasar Minggu", status: "Dalam Review", skor: 10, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  ];

  // Ambil data profil dari database saat halaman pertama kali dibuka
  useEffect(() => {
    async function fetchProfile() {
      const res = await getCurrentProfile();
      if (res && res.success && res.profile) {
        setFullName(res.profile.full_name); // Set nama sesuai full_name di DB (contoh: anasTasya / JokoWi)
      } else {
        setFullName("Pengguna"); // Fallback jika gagal ambil data
      }
    }
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6">
      {/* WELCOME (Dinamis dari Database) */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
          Selamat Datang, {fullName}
        </h1>
        <p className="text-gray-500 text-xs md:text-sm mt-1">
          Berikut ini adalah status lokasi Anda saat ini.
        </p>
      </div>

      {/* GRID STATISTIK CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border-t-4 border-slate-600 shadow-sm">
          <div className="text-gray-500 text-xs font-bold uppercase">Total Ulok Diajukan</div>
          <div className="text-3xl font-black text-slate-800 my-1">12</div>
          <div className="text-xs text-gray-400">4 baru bulan ini</div>
        </div>
        <div className="bg-white p-4 rounded-xl border-t-4 border-yellow-500 shadow-sm">
          <div className="text-yellow-600 text-xs font-bold uppercase">Sedang Dinilai</div>
          <div className="text-3xl font-black text-yellow-600 my-1">12</div>
          <div className="text-xs text-yellow-500">4 baru bulan ini</div>
        </div>
        <div className="bg-white p-4 rounded-xl border-t-4 border-green-500 shadow-sm">
          <div className="text-green-600 text-xs font-bold uppercase">Disetujui</div>
          <div className="text-3xl font-black text-green-600 my-1">6</div>
          <div className="text-xs text-green-500">Siap ditindaklanjuti</div>
        </div>
        <div className="bg-white p-4 rounded-xl border-t-4 border-red-500 shadow-sm">
          <div className="text-red-600 text-xs font-bold uppercase">Ditolak / Perbaikan</div>
          <div className="text-3xl font-black text-red-600 my-1">6</div>
          <div className="text-xs text-red-400">Perlu revisi dokumen</div>
        </div>
      </div>

      {/* TABEL USULAN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-[#142B4D] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-white font-bold text-md">Daftar Usulan Lokasi</h3>
          <input 
            type="text" 
            placeholder="🔍 Search ULOK..." 
            className="text-xs bg-white px-4 py-2 rounded-full w-full sm:w-64 focus:outline-none text-gray-800 border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-100 border-b text-gray-600 font-bold">
                <th className="p-4 pl-6">Nama ULOK</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Skor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {dataUsulan
                .filter(item => item.nama.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-gray-900">{row.nama}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${row.color}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-gray-600">{row.skor}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}