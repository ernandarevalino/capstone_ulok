'use client';

import React, { useState, useEffect } from 'react';
import { getNotificationsAction, deleteNotificationAction, markAllNotificationsAsReadAction } from '@/actions/superadmin';
import { getCurrentProfile } from '@/actions/auth';

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initPage();
  }, []);

  async function initPage() {
    setLoading(true);
    const profileRes = await getCurrentProfile();
    if (profileRes && profileRes.success && profileRes.profile) {
      const uId = profileRes.profile.id;
      setUserId(uId);
      await fetchNotifications(uId);
      await markAllAsRead(uId);
    } else {
      setLoading(false);
    }
  }

  async function fetchNotifications(uId: string) {
    const res = await getNotificationsAction(uId);
    if (res.success) {
      setNotifications(res.data);
    }
    setLoading(false);
  }

  async function markAllAsRead(uId: string) {
    await markAllNotificationsAsReadAction(uId);
  }

  const handleDelete = async (id: number) => {
    const res = await deleteNotificationAction(id);
    if (res.success) {
      setNotifications(notifications.filter(item => item.id !== id));
    } else {
      alert('Gagal menghapus pemberitahuan.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Notifikasi Sistem</h1>
          <p className="text-sm text-gray-500 mt-1">
            Riwayat log aktivitas usulan lokasi, komentar assessor, dan status validasi berkas.
          </p>
        </div>
        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
          Max 100
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">Memuat data pemberitahuan...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">Tidak ada notifikasi baru saat ini.</p>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className="p-4 rounded-xl border border-gray-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex justify-between items-start gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <h3 className="font-bold text-sm text-gray-800">{notif.title}</h3>
                </div>
                <p className="text-xs md:text-sm text-gray-600 pl-4">{notif.message}</p>
                <p className="text-[11px] text-gray-400 font-medium pl-4 font-mono">
                  {new Date(notif.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              
              <button 
                onClick={() => handleDelete(notif.id)}
                className="text-gray-400 hover:text-red-600 text-xs p-1 rounded hover:bg-gray-100 transition-colors font-bold"
                title="Hapus notifikasi"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
