'use client';

import React, { useState, useEffect } from 'react';
import { getNotificationsAction, deleteNotificationAction, markAllNotificationsAsReadAction } from '@/actions/superadmin';
import { getCurrentProfile } from '@/actions/auth';
import { Trash2 } from 'lucide-react';

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    initPage();
  }, []);

  async function initPage() {
    setLoading(true);
    const profileRes = await getCurrentProfile();
    if (profileRes && profileRes.success && profileRes.profile) {
      const uId = profileRes.profile.id;
      setUserId(uId);
    }
    await fetchNotifications();
    await markAllAsRead();
  }

  async function fetchNotifications() {
    const res = await getNotificationsAction();
    if (res.success) {
      setNotifications(res.data);
    }
    setLoading(false);
  }

  async function markAllAsRead() {
    await markAllNotificationsAsReadAction();
  }

  const handleDelete = async (id: number) => {
    const res = await deleteNotificationAction(id);
    if (res.success) {
      setNotifications(prev => prev.filter(item => item.id !== id));
    } else {
      setSuccessMessage('Gagal menghapus pemberitahuan.');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 1500);
    }
  };

  const handleDeleteAllTrigger = () => {
    if (notifications.length === 0) return;
    setShowDeleteAllConfirm(true);
  };

  const executeDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await Promise.all(notifications.map(notif => deleteNotificationAction(notif.id)));
      setNotifications([]);
      setShowDeleteAllConfirm(false);
      
      // Setup Informasi Berhasil
      setSuccessMessage('Semua notifikasi berhasil dibersihkan! 🎉');
      setShowSuccessModal(true);
      
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1500);
    } catch (err) {
      setShowDeleteAllConfirm(false);
      setSuccessMessage('Terjadi kesalahan saat menghapus semua notifikasi.');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 1500);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* === HEADER PAGE === */}
        <div className="max-w-255 mx-auto mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Notifikasi Sistem
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
            Riwayat masuk berkas usulan baru dari cabang, log aktivitas penugasan, dan pembaruan dokumen revisi internal Assessor Anda.
          </p>
        </div>

        {/* === NOTIFICATION CONTAINER === */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/80 overflow-hidden">
          
          {/* === NOTIFICATION HEADER === */}
          <div className="bg-[#142B4D] dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <h3 className="text-white font-bold text-base flex items-center gap-2.5">
              <img 
                src="/icons/icon-notification.svg" 
                alt="Notification Icon" 
                className="w-5 h-5 object-contain brightness-0 invert" 
              /> 
              Aktivitas Masuk
            </h3>
            
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold">
                {notifications.length} Notifications
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAllTrigger}
                  disabled={isDeletingAll}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                  title="Hapus semua notifikasi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* === NOTIFICATION LIST === */}
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
                  Seluruh riwayat tugas dan masuknya berkas usulan cabang Anda bersih saat ini.
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

      {/* === MODAL: KONFIRMASI HAPUS SEMUA === */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <img src="/icons/icon-hand.svg" alt="Confirm Delete All" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              Apakah Anda yakin ingin menghapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={isDeletingAll}
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                No
              </button>
              <button
                onClick={executeDeleteAll}
                disabled={isDeletingAll}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 font-bold px-4 py-2 text-sm transition-all flex items-center gap-1.5"
              >
                {isDeletingAll ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Proses...
                  </span>
                ) : (
                  'Yes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: SUKSES === */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <img src="/icons/icon-check.svg" alt="Success" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm md:text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}