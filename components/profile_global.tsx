'use client';
import React from 'react';

export default function ProfileGlobal() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-xl">
          A
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Anastasya (Admin Cabang)</h3>
          <p className="text-xs text-gray-400">NIK: 12605013</p>
        </div>
      </div>
    </div>
  );
}