'use client';

import React, { useState, useEffect } from 'react';
import { getNotificationsAction, deleteNotificationAction, markAllNotificationsAsReadAction } from '@/actions/superadmin';
import { getCurrentProfile } from '@/actions/auth';
import { Trash2, Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);

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
      setVisibleCount(5); // reset ke 5 tiap fetch baru
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

  if (loading) {
    return (
      <div className="w-full overflow-x-hidden space-y-4 md:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100">
        {/* Page Header Skeleton */}
        <div className="mb-6">
          <div className="h-7 md:h-8 w-1/2 md:w-64 bg-slate-300 dark:bg-slate-700 rounded mb-2 animate-pulse"></div>
          <div className="h-3 md:h-4 w-3/4 md:w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>

        {/* List Card Skeleton */}
        <div className="shadow-sm bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800/80">
          {/* Table Header Skeleton */}
          <div className="bg-slate-200 dark:bg-slate-800 p-4 md:p-5 flex items-center justify-between gap-2 animate-pulse border-b border-gray-100 dark:border-gray-800/60">
            <div className="h-5 w-24 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-6 w-16 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
          </div>

          {/* Divide-y List */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3.5 sm:p-5 sm:pl-6 sm:pr-6 flex justify-between items-start gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0"></span>
                    <div className="h-4 w-1/3 md:w-1/4 bg-slate-300 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="h-3.5 w-3/4 md:w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse pl-4"></div>
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse pl-4"></div>
                </div>
                <div className="h-9 w-9 sm:h-11 sm:w-11 md:h-10 md:w-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse shrink-0"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      <div className="space-y-6">

        {/* === HEADER: NOTIFIKASI === */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Notifikasi Sistem
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
            Riwayat masuk berkas usulan baru dari cabang, log aktivitas penugasan, dan pembaruan dokumen revisi internal Assessor Anda.
          </p>
        </div>

        {/* === KONTEN: DAFTAR NOTIFIKASI === */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/80 overflow-hidden">

          {/* === TABEL: HEADER === */}
          <div className="bg-[#142B4D] dark:bg-slate-900 p-4 md:p-5 flex items-center justify-between gap-2 transition-colors">
            <h3 className="text-white font-bold text-sm md:text-base flex items-center gap-2">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              Aktivitas Masuk
            </h3>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] md:text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
                {notifications.length} <span className="hidden sm:inline">Notifications</span>
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAllTrigger}
                  disabled={isDeletingAll}
                  title="Clear All Notifications"
                  className="bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-xs px-2 sm:px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all h-6 md:h-7 shadow-sm disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* === LIST: NOTIFIKASI === */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-gray-400 dark:text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="font-bold text-gray-500 dark:text-gray-400">Tidak ada notifikasi baru!</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Seluruh riwayat tugas dan masuknya berkas usulan cabang Anda bersih saat ini.
                </p>
              </div>
            ) : (
              notifications.slice(0, visibleCount).map((notif) => (
                <div
                  key={notif.id}
                  className="p-3.5 sm:p-5 sm:pl-6 sm:pr-6 hover:bg-blue-50/20 dark:hover:bg-gray-800/40 transition-all duration-300 ease-in-out flex justify-between items-start gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0 shadow-xs"></span>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 tracking-tight">
                        {notif.title}
                      </h4>
                    </div>

                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 pl-3.5 sm:pl-4 leading-relaxed font-medium">
                      {notif.message}
                    </p>

                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold pl-3.5 sm:pl-4 uppercase tracking-wider">
                      {new Date(notif.created_at).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-xs md:text-sm p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-all active:scale-90 font-bold shrink-0 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 h-9 w-9 sm:h-11 sm:w-11 md:h-10 md:w-10 flex items-center justify-center"
                    title="Hapus notifikasi"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* === LOAD MORE BUTTON === */}
          {visibleCount < notifications.length && (
            <div className="p-4 flex justify-center border-t border-gray-100 dark:border-gray-800/60">
              <button
                onClick={() => setVisibleCount(prev => prev + 5)}
                className="px-5 text-xs md:text-sm font-bold text-[#142B4D] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-all active:scale-95 cursor-pointer h-11 md:h-10 flex items-center justify-center"
              >
                Load More ({notifications.length - visibleCount} lagi)
              </button>
            </div>
          )}

        </div>

      </div>

      {/* === MODAL: KONFIRMASI HAPUS ALL === */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-80 text-center space-y-4 animate-[scaleUp_0.2s_ease-out]">
            <AlertTriangle className="w-16 h-16 mx-auto mb-2 text-amber-500" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-base leading-relaxed">
              Apakah Anda yakin ingin menghapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={isDeletingAll}
                className="bg-[#142B4D] hover:bg-[#1a3863] text-white px-5 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50 h-11 md:h-10 flex items-center justify-center"
              >
                No
              </button>
              <button
                onClick={executeDeleteAll}
                disabled={isDeletingAll}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 font-bold px-4 text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 h-11 md:h-10"
              >
                {isDeletingAll ? (
                  <span className="flex items-center gap-1 animate-pulse">
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
            <CheckCircle2 className="w-16 h-16 mx-auto mb-2 text-emerald-500" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm md:text-base leading-relaxed">
              {successMessage}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
