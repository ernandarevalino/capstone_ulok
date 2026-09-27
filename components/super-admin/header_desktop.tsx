'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SUPER_ADMIN_NAV_GROUPS,
  isNavItemActive,
  NavItemConfig,
} from './super_admin_nav_config';
import {
  getSavedAccounts,
  addAccountAction,
  removeSavedAccountAction,
  switchAccountAction,
  SavedAccount,
} from '@/actions/switcher';
import {
  Trash2,
  UserPlus,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  X,
  ShieldCheck,
  Check,
  Loader2,
} from 'lucide-react';

interface HeaderDesktopProps {
  isCollapsed?: boolean;
  onToggleSidebar?: () => void;
  profile?: any;
}

function HeaderDesktop({
  isCollapsed = false,
  profile: propProfile,
}: HeaderDesktopProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(propProfile || null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // === MULTI-ACCOUNT STATES ===
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // === MODAL STATES ===
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmSwitchModal, setShowConfirmSwitchModal] = useState(false);
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState<SavedAccount | null>(null);

  // === FORM & PROCESS STATES ===
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [reAuthPassword, setReAuthPassword] = useState('');
  const [showReAuthPassword, setShowReAuthPassword] = useState(false);
  const [reAuthLoading, setReAuthLoading] = useState(false);
  const [reAuthError, setReAuthError] = useState('');
  const [reAuthMessage, setReAuthMessage] = useState('');

  const [switchLoading, setSwitchLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync propProfile when passed
  useEffect(() => {
    if (propProfile) {
      setProfile(propProfile);
    }
  }, [propProfile]);

  // Load saved accounts from server cookies
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await getSavedAccounts();
      if (res.success && res.accounts) {
        setAccounts(res.accounts);
        if (res.activeUserId) {
          setActiveUserId(res.activeUserId);
        }
      }
    } catch (err) {
      console.error('[fetchAccounts] Failed to fetch saved accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Refresh account list whenever popover is opened
  useEffect(() => {
    if (isAccountMenuOpen) {
      fetchAccounts();
    }
  }, [isAccountMenuOpen]);

  // Click outside to close account menu popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeAccount = accounts.find((a) => a.id === activeUserId) || {
    id: profile?.id || '',
    email: profile?.nik ? `${profile.nik}@mu.co.id` : 'superadmin@prisma.com',
    full_name: profile?.full_name || 'Super Admin',
    role: profile?.role || 'super_admin',
    avatar_url: profile?.avatar_url || null,
    branch_name: profile?.branches?.nama_cabang || null,
    last_activity_at: Date.now(),
  };

  const inactiveAccounts = accounts.filter((a) => a.id !== activeUserId);

  const getRoleBadgeLabel = (role: string) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'assessor') return 'Assessor';
    if (role === 'admin_cabang') return 'Admin Cabang';
    return role;
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === 'super_admin') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (role === 'assessor') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  // === HANDLER: CLICK INACTIVE ACCOUNT ===
  const handleAccountClick = (acc: SavedAccount) => {
    setSelectedAccount(acc);
    setIsAccountMenuOpen(false);

    // Cek selisih waktu aktivitas
    const isExpired = Date.now() - acc.last_activity_at > 60 * 60 * 1000;
    if (isExpired) {
      setReAuthPassword('');
      setReAuthError('');
      setReAuthMessage('Sesi akun ini telah kedaluwarsa (> 1 jam). Masukkan kata sandi untuk melanjutkan.');
      setShowReAuthModal(true);
    } else {
      setShowConfirmSwitchModal(true);
    }
  };

  // === HANDLER: EXECUTE SWITCH (SEAMLESS) ===
  const handleExecuteSwitch = async () => {
    if (!selectedAccount) return;
    setSwitchLoading(true);

    try {
      const res = await switchAccountAction({ targetUserId: selectedAccount.id });
      if (res.success && res.targetPath) {
        window.location.assign(res.targetPath);
      } else if (res.requiresPassword) {
        setShowConfirmSwitchModal(false);
        setReAuthPassword('');
        setReAuthError('');
        setReAuthMessage(res.message || 'Sesi telah kedaluwarsa. Silakan masukkan kata sandi.');
        setShowReAuthModal(true);
      } else {
        alert(res.error || 'Gagal melakukan switch akun.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem saat switch akun.');
    } finally {
      setSwitchLoading(false);
    }
  };

  // === HANDLER: SUBMIT RE-AUTH PASSWORD ===
  const handleReAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !reAuthPassword) return;

    setReAuthLoading(true);
    setReAuthError('');

    try {
      const res = await switchAccountAction({
        targetUserId: selectedAccount.id,
        password: reAuthPassword,
      });

      if (res.success && res.targetPath) {
        window.location.assign(res.targetPath);
      } else {
        setReAuthError(res.error || 'Kata sandi tidak valid.');
      }
    } catch (err: any) {
      setReAuthError(err.message || 'Gagal melakukan otentikasi ulang.');
    } finally {
      setReAuthLoading(false);
    }
  };

  // === HANDLER: SUBMIT ADD ACCOUNT ===
  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');

    try {
      const formData = new FormData();
      formData.append('email', addEmail);
      formData.append('password', addPassword);

      const res = await addAccountAction(formData);

      if (res.success && res.targetPath) {
        window.location.href = res.targetPath;
      } else {
        setAddError(res.error || 'Gagal menambah akun.');
      }
    } catch (err: any) {
      setAddError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setAddLoading(false);
    }
  };

  // === HANDLER: EXECUTE DELETE ACCOUNT ===
  const handleExecuteDelete = async () => {
    if (!selectedAccount) return;
    setDeleteLoading(true);

    try {
      const res = await removeSavedAccountAction(selectedAccount.id);
      if (res.success) {
        setShowDeleteModal(false);
        setSelectedAccount(null);
        await fetchAccounts();
      } else {
        alert(res.error || 'Gagal menghapus akun tersimpan.');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus akun.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const initialLetter = activeAccount.full_name ? activeAccount.full_name.charAt(0).toUpperCase() : 'S';

  // Icon mapping helper
  const renderNavIcon = (iconType: string, active: boolean) => {
    const iconClass = `w-5 h-5 shrink-0 transition-colors ${
      active ? 'text-[#0E1B2E] dark:text-white' : 'text-slate-400 group-hover:text-slate-200'
    }`;

    switch (iconType) {
      case 'dashboard':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case 'clustering':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'analytics':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'admin-cabang':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'assessor':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'recycle':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'log':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'settings':
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
          </svg>
        );
    }
  };

  const renderNavItem = (item: NavItemConfig) => {
    const active = isNavItemActive(pathname, item.href, item.exact);

    return (
      <div
        key={item.id}
        onMouseEnter={() => setHoveredId(item.id)}
        onMouseLeave={() => setHoveredId(null)}
        className={`relative group my-0.5 z-20 ${active || isCollapsed ? '' : 'pr-3'}`}
      >
        {/* === Active Tab Sliding Background Indicator === */}
        {active && (
          <motion.div
            layoutId="superadmin-active-tab"
            className="absolute inset-0 z-10"
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
              mass: 0.8,
            }}
          >
            <div className="absolute -top-4 right-0 w-4 h-4 bg-[#F0F4F8] dark:bg-[#131F33] pointer-events-none z-10">
              <div className="w-full h-full bg-[#0E1B2E] dark:bg-[#09111D] rounded-br-2xl" />
            </div>

            <div className="w-full h-full bg-[#F0F4F8] dark:bg-[#131F33] rounded-l-2xl rounded-r-none shadow-xs relative">
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-emerald-500 via-[#F28705] to-[#142B4D] rounded-r-full shadow-xs" />
            </div>

            <div className="absolute -bottom-4 right-0 w-4 h-4 bg-[#F0F4F8] dark:bg-[#131F33] pointer-events-none z-10">
              <div className="w-full h-full bg-[#0E1B2E] dark:bg-[#09111D] rounded-tr-2xl" />
            </div>
          </motion.div>
        )}

        {/* === Hover Soft Glass Pill Indicator === */}
        {hoveredId === item.id && !active && (
          <motion.div
            layoutId="superadmin-hover-tab"
            className={`absolute inset-0 bg-[#162740]/70 dark:bg-[#121E30]/80 z-10 ${
              isCollapsed ? 'w-10 mx-auto rounded-xl' : 'w-full rounded-xl'
            }`}
            transition={{
              type: 'spring',
              stiffness: 450,
              damping: 35,
            }}
          />
        )}

        {/* Nav Link Item */}
        <Link
          href={item.href}
          title={isCollapsed ? item.title : undefined}
          className={`relative flex items-center h-10 transition-colors duration-200 z-20 ${
            active
              ? 'text-[#0E1B2E] dark:text-white font-bold w-full'
              : `text-slate-400 hover:text-slate-100 font-medium ${
                  isCollapsed ? 'w-10 mx-auto justify-center' : 'w-full'
                }`
          } ${isCollapsed ? 'justify-center px-0' : 'pl-3.5 pr-4 space-x-3'}`}
        >
          {renderNavIcon(item.icon, active)}
          <span
            className={`truncate text-xs tracking-tight select-none transition-all duration-200 ease-out ${
              isCollapsed
                ? 'max-w-0 opacity-0 overflow-hidden pointer-events-none'
                : 'max-w-[140px] opacity-100'
            }`}
          >
            {item.title}
          </span>
        </Link>

        {/* Collapsed Tooltip */}
        {isCollapsed && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#14233A] dark:bg-[#0E1828] text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 border border-[#243A5E] dark:border-[#1C2C46] top-1/2 -translate-y-1/2">
            {item.title}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside
        className={`hidden md:flex flex-col ${
          isCollapsed ? 'w-20 pl-2.5 pr-0' : 'w-56 pl-3.5 pr-0'
        } bg-[#0E1B2E] dark:bg-[#09111D] text-slate-200 h-full shrink-0 select-none transition-[width,padding] duration-200 ease-out py-3 relative z-30 rounded-l-3xl will-change-[width]`}
      >
        {/* === 1. LOGO & BRAND HEADER === */}
        <div className={`h-16 flex items-center shrink-0 mb-1 transition-all duration-200 ${isCollapsed ? 'justify-center' : 'px-2 pr-5'}`}>
          <Link href="/admin/super-admin" className="flex items-center space-x-2.5 group overflow-hidden" title="PRISMA Super Admin">
            {isCollapsed ? (
              <span className="text-[11px] bg-emerald-600 text-white font-bold px-2 py-1 rounded-lg uppercase tracking-wider shadow-xs group-hover:scale-110 transition-transform">
                SA
              </span>
            ) : (
              <>
                <img
                  src="/images/prisma-white-navbar.png"
                  alt="Logo PRISMA"
                  className="h-6 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
                />
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs shrink-0">
                  SA
                </span>
              </>
            )}
          </Link>
        </div>

        {/* === 2. SIDEBAR NAVIGATION GROUPS === */}
        <nav className="flex-1 min-h-0 overflow-y-auto space-y-3 text-xs font-semibold tracking-wide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {SUPER_ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.id} className="space-y-0.5">
              {isCollapsed ? (
                <div className="my-2.5 border-t border-[#223859]/60 dark:border-[#1B2B45]/60 mx-1 transition-all duration-200" />
              ) : (
                <p className="px-3 pr-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 pb-1.5 transition-all duration-200 truncate">
                  {group.groupTitle}
                </p>
              )}
              {group.items.map((item) => renderNavItem(item))}
            </div>
          ))}
        </nav>

        {/* === 3. BOTTOM USER ACCOUNT CARD & SWITCHER POPOVER === */}
        <div
          className={`pt-2 relative shrink-0 mt-auto transition-all duration-200 ${isCollapsed ? '' : 'pr-3'}`}
          ref={accountMenuRef}
        >
          <div className={`h-[1px] bg-slate-700/30 dark:bg-slate-800/40 mb-3 transition-all duration-200 ${
            isCollapsed 
              ? 'w-[80%] mx-auto' 
              : 'w-[95%] ml-1.5' 
          }`}>
          </div>

          {/* Account Popover Menu */}
          <AnimatePresence>
            {isAccountMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute bottom-full ${
                  isCollapsed ? 'left-0 w-72' : 'left-0 right-3 w-80'
                } mb-3 bg-[#0E1B2E] dark:bg-[#09111D] border border-slate-700/60 dark:border-slate-800/80 rounded-2xl shadow-2xl p-3 z-50 text-slate-200 backdrop-blur-xl max-h-[480px] overflow-y-auto space-y-3`}
              >
                {/* SECTION 1: AKUN AKTIF */}
                <div>
                  <div className="flex items-center justify-between px-2 py-1 mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Akun Aktif
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {getRoleBadgeLabel(activeAccount.role)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 p-2.5 bg-[#14233A] dark:bg-[#101C2E] rounded-xl border border-emerald-500/30 shadow-xs relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500" />
                    <div className="w-9 h-9 rounded-full bg-[#1A3054] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-emerald-500/40 shadow-xs">
                      {activeAccount.avatar_url ? (
                        <img src={activeAccount.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{initialLetter}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        {activeAccount.full_name}
                      </p>
                      <p className="text-[10px] text-slate-300 truncate">{activeAccount.email}</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: AKUN INAKTIF TERSIMPAN */}
                {inactiveAccounts.length > 0 && (
                  <div>
                    <div className="px-2 py-1 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Akun Tersimpan ({inactiveAccounts.length})
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {inactiveAccounts.map((acc) => {
                        const accInitial = acc.full_name ? acc.full_name.charAt(0).toUpperCase() : 'U';
                        const isExpired = Date.now() - acc.last_activity_at > 60 * 60 * 1000;

                        return (
                          <div
                            key={acc.id}
                            onClick={() => handleAccountClick(acc)}
                            className="group flex items-center justify-between p-2.5 rounded-xl bg-[#14233A]/60 dark:bg-[#101C2E]/60 hover:bg-[#1A2E4C] dark:hover:bg-[#15243B] border border-slate-700/40 hover:border-blue-500/40 transition-all cursor-pointer relative"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-[#162742] text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-600/40">
                                {acc.avatar_url ? (
                                  <img src={acc.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{accInitial}</span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-1.5">
                                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                                    {acc.full_name}
                                  </p>
                                  <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(acc.role)}`}>
                                    {getRoleBadgeLabel(acc.role)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                  <span>{acc.email}</span>
                                  {isExpired && (
                                    <span className="text-[9px] text-amber-400 flex items-center gap-0.5 bg-amber-500/10 px-1 rounded">
                                      <Clock className="w-2.5 h-2.5" /> Expired
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Trash Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAccount(acc);
                                setIsAccountMenuOpen(false);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1 shrink-0"
                              title="Hapus akun dari daftar tersimpan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SECTION 3: TAMBAH AKUN BUTTON */}
                <div className="pt-1 border-t border-slate-700/40 dark:border-slate-800/50">
                  <button
                    type="button"
                    disabled={accounts.length >= 3}
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setAddEmail('');
                      setAddPassword('');
                      setAddError('');
                      setShowAddModal(true);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                      accounts.length >= 3
                        ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-800/60'
                        : 'bg-[#14233A] hover:bg-[#1A2E4C] text-slate-200 hover:text-white border border-slate-700/50 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <UserPlus className="w-3.5 h-3.5" />
                      </div>
                      <span>+ Tambah Akun</span>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full font-mono">
                      {accounts.length}/3 Akun
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trigger Pill at bottom */}
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            title={isCollapsed ? activeAccount.full_name : undefined}
            className={`flex items-center rounded-xl bg-transparent hover:bg-[#14233A]/60 dark:hover:bg-[#101C2E]/60 text-left transition-all duration-200 border border-slate-700/30 dark:border-slate-800/40 group ${
              isCollapsed 
                ? 'w-12 h-12 mx-auto justify-center p-1.5' 
                : 'w-full h-14 justify-between p-2.5' 
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} min-w-0`}>
              <div className="w-7 h-7 rounded-full bg-[#1A3054] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-600/40">
                {activeAccount.avatar_url ? (
                  <img src={activeAccount.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>
              <div className={`min-w-0 flex-1 transition-all duration-200 ${isCollapsed ? 'max-w-0 opacity-0 overflow-hidden pointer-events-none' : 'max-w-[120px] opacity-100'}`}>
                <p className="text-xs font-bold text-white truncate">
                  {activeAccount.full_name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{getRoleBadgeLabel(activeAccount.role)}</p>
              </div>
            </div>
            {!isCollapsed && (
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            )}
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* === MODAL 1: ADD ACCOUNT FLOATING POPUP === */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#0E1B2E] border border-slate-700/60 rounded-2xl shadow-2xl p-6 text-slate-100 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Tambah Akun PRISMA</h3>
                    <p className="text-[11px] text-slate-400">Masuk untuk menyimpan sesi di akun switcher (Maks. 3)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddAccountSubmit} className="mt-4 space-y-4">
                {addError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{addError}</span>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email / NIK</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="NIK@mu.co.id"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 bg-[#14233A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      className="w-full h-10 pl-10 pr-10 bg-[#14233A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 flex items-center space-x-1.5 disabled:opacity-50 transition-all"
                  >
                    {addLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Tambah & Masuk</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* === MODAL 2: CONFIRM SWITCH SEAMLESS === */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showConfirmSwitchModal && selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-[#0E1B2E] border border-slate-700/60 rounded-2xl shadow-2xl p-5 text-slate-100 relative overflow-hidden"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Konfirmasi Pindah Akun</h3>
                <p className="text-xs text-slate-300">
                  Anda akan beralih dari akun <strong className="text-white">{activeAccount.full_name}</strong> ke akun{' '}
                  <strong className="text-emerald-400">{selectedAccount.full_name}</strong> ({getRoleBadgeLabel(selectedAccount.role)}).
                </p>

                <div className="p-3 bg-[#14233A] rounded-xl border border-slate-700/50 flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-[#1A3054] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {selectedAccount.avatar_url ? (
                      <img src={selectedAccount.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{selectedAccount.full_name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{selectedAccount.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{selectedAccount.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmSwitchModal(false)}
                    className="w-1/2 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={switchLoading}
                    onClick={handleExecuteSwitch}
                    className="w-1/2 py-2 rounded-xl text-xs font-bold bg-[#142B4D] hover:bg-[#1A3864] text-white border border-blue-500/30 flex items-center justify-center space-x-1.5 disabled:opacity-50 transition-all shadow-md"
                  >
                    {switchLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Berpindah...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Ya, Pindah Saja</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* === MODAL 3: RE-AUTH EXPIRED SESSION (PASSWORD ONLY) === */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showReAuthModal && selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#0E1B2E] border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Sesi Kedaluwarsa</h3>
                    <p className="text-[11px] text-slate-400">Masukkan kata sandi untuk mengaktifkan kembali akun ini</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReAuthModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleReAuthSubmit} className="mt-4 space-y-4">
                {reAuthMessage && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{reAuthMessage}</span>
                  </div>
                )}

                {reAuthError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{reAuthError}</span>
                  </div>
                )}

                {/* Hidden input to ensure clean email payload */}
                <input type="hidden" name="email" value={selectedAccount.email} />

                {/* Pre-filled Display-Only Account Info Card */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Akun Target</label>
                  <div className="p-3 bg-[#14233A] border border-slate-700/60 rounded-xl flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#1A3054] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-600/40">
                      {selectedAccount.avatar_url ? (
                        <img src={selectedAccount.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{selectedAccount.full_name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{selectedAccount.full_name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{selectedAccount.email}</p>
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showReAuthPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="Masukkan kata sandi..."
                      value={reAuthPassword}
                      onChange={(e) => setReAuthPassword(e.target.value)}
                      className="w-full h-10 pl-10 pr-10 bg-[#14233A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowReAuthPassword(!showReAuthPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showReAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReAuthModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={reAuthLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30 flex items-center space-x-1.5 disabled:opacity-50 transition-all"
                  >
                    {reAuthLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memverifikasi...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verifikasi & Masuk</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* === MODAL 4: CONFIRM DELETE INACTIVE ACCOUNT === */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showDeleteModal && selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-[#0E1B2E] border border-red-500/40 rounded-2xl shadow-2xl p-5 text-slate-100 relative overflow-hidden"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Hapus Akun Tersimpan</h3>
                <p className="text-xs text-slate-300">
                  Hapus <strong className="text-white">{selectedAccount.full_name}</strong> ({selectedAccount.email}) dari daftar tersimpan di peranti ini?
                </p>

                <div className="flex items-center justify-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="w-1/2 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={handleExecuteDelete}
                    className="w-1/2 py-2 rounded-xl text-xs font-bold bg-[#D91E2E] hover:bg-red-700 text-white flex items-center justify-center space-x-1.5 disabled:opacity-50 transition-all shadow-md shadow-red-950/40"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menghapus...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Ya, Hapus</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default memo(HeaderDesktop);
