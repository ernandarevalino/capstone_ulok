'use client';

import React, { useState, useEffect } from 'react';
import { getNotificationsAction, deleteNotificationAction, markAllNotificationsAsReadAction } from '@/actions/superadmin';
import { getCurrentProfile } from '@/actions/auth';
import { Trash2, Bell, AlertCircle } from 'lucide-react';

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
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
      setNotifications(prev => prev.filter(item => item.id !== id));
    } else {
      alert('Gagal menghapus pemberitahuan.');
    }
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    if (!confirm('Apakah Anda yakin ingin menghapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.')) return;

    setIsDeletingAll(true);
    try {
      // Mengeksekusi penghapusan massal secara paralel aman via Server Action bawaan Anda
      await Promise.all(notifications.map(notif => deleteNotificationAction(notif.id)));
      setNotifications([]);
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus semua notifikasi.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER PAGE (Identik dengan Feedback Page) */}
        <div className="max-w-255 mx-auto mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Notifikasi Sistem
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
            Riwayat log aktivitas usulan lokasi, komentar assessor, dan status validasi berkas internal akun Anda.
          </p>
        </div>

        {/* MAIN CARD CONTAINER */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/80 overflow-hidden">
          
          {/* HEADER NAVY BLUE (Sesuai Spesifikasi Baru) */}
          <div className="bg-[#142B4D] dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <h3 className="text-white font-bold text-base flex items-center gap-2.5">
              <img 
                src="/icons/icon-notification.svg" 
                alt="Notification Icon" 
                className="w-5 h-5 object-contain brightness-0 invert" 
              /> 
              Aktivitas
            </h3>
            
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold">
                {notifications.length} Notifications
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                  title="Hapus semua notifikasi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeletingAll ? 'Proses...' : 'Clear All'}
                </button>
              )}
            </div>
          </div>

          {/* NOTIFICATION LIST WRAPPER */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {loading ? (
              <div className="p-12 text-center text-gray-400 dark:text-gray-500 italic text-sm">
                <div className="w-6 h-6 border-2 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Memuat daftar pemberitahuan sistem...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-gray-400 dark:text-gray-500">
                <span className="text-4xl block mb-2 opacity-60">🔔</span>
                <p className="font-bold text-gray-500 dark:text-gray-400">Tidak ada notifikasi baru!</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Seluruh riwayat aktivitas masuk akun Anda bersih saat ini.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className="p-5 pl-6 pr-6 hover:bg-blue-50/20 dark:hover:bg-gray-800/40 transition-all duration-300 ease-in-out flex justify-between items-start gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0 shadow-xs animate-pulse"></span>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 tracking-tight">
                        {notif.title}
                      </h4>
                    </div>
                    
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 pl-4 leading-relaxed font-medium">
                      {notif.message}
                    </p>
                    
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold pl-4 uppercase tracking-wider">
                      {new Date(notif.created_at).toLocaleString('id-ID', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                      })}
                    </p>
                  </div>
                  
                  {/* BUTTON ACTION X */}
                  <button 
                    onClick={() => handleDelete(notif.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-xs p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-all active:scale-90 font-bold shrink-0 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    title="Hapus notifikasi"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}