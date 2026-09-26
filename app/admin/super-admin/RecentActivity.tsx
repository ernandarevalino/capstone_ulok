'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'new' | 'update' | 'delete';
}

const DUMMY_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    title: 'Usulan Baru Masuk',
    description: 'Admin Anastasya Feby Dekat Hari dari Cabang Bitung telah mengajukan usulan lokasi baru: "alfamidi Traf" (Status: Draft).',
    time: '24/9/2026, 14:48',
    type: 'new',
  },
  {
    id: '2',
    title: 'Usulan Lokasi (ULOK) Baru',
    description: 'Admin Anastasya Feby Dekat Hari dari Cabang Bitung telah menambahkan usulan lokasi baru: "alfamidi traf" (Status: Draft).',
    time: '24/9/2026, 14:45',
    type: 'update',
  },
  {
    id: '3',
    title: 'Usulan Baru Masuk',
    description: 'Admin Anastasya Feby Dekat Hari dari Cabang Bitung telah mengajukan usulan lokasi baru: "Gunung Kidut".',
    time: '11/9/2026, 16:36',
    type: 'new',
  },
  {
    id: '4',
    title: 'Usulan Lokasi (ULOK) Baru',
    description: 'Admin Anastasya Feby Dekat Hari dari Cabang Bitung telah menambahkan usulan lokasi baru: "Gunung Kidut" (Status: Draft).',
    time: '11/9/2026, 15:35',
    type: 'update',
  },
  {
    id: '5',
    title: 'Usulan Lokasi (ULOK) Baru',
    description: 'Admin Anastasya Feby Dekat Hari dari Cabang Bitung telah menambahkan usulan lokasi baru: "Gunung Kidut" (Status: Draft).',
    time: '11/9/2026, 15:35',
    type: 'update',
  },
  {
    id: '6',
    title: 'Usulan Lokasi (ULOK) Baru',
    description: 'Admin Anastasya Feby Dekat Hari dari Cabang Bitung telah menambahkan usulan lokasi baru: "Gunung Kidut" (Status: Draft).',
    time: '7/9/2026, 09:13',
    type: 'new',
  },
];

const TYPE_COLOR: Record<ActivityItem['type'], string> = {
  new: 'bg-[#F28705]',
  update: 'bg-[#142B4D]',
  delete: 'bg-[#D91E2E]',
};

export default function RecentActivity() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#142B4D] dark:bg-[#0E1B2E] shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#F28705]" />
          <span className="text-xs font-bold text-white">Recent Activity (Log Sistem Global)</span>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Real-time
        </span>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800/60 [scrollbar-width:thin]">
        {DUMMY_ACTIVITIES.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-default"
          >
            <div className="mt-1.5 shrink-0">
              <span className={`w-2 h-2 rounded-full block ${TYPE_COLOR[item.type]}`} />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-xs font-bold text-gray-800 dark:text-slate-100 leading-tight">
                {item.title}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {item.description}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
