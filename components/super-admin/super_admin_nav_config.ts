export interface NavItemConfig {
  id: string;
  title: string;
  href: string;
  exact?: boolean;
  icon: string;
}

export interface NavGroupConfig {
  id: string;
  groupTitle: string;
  items: NavItemConfig[];
}

export const SUPER_ADMIN_NAV_GROUPS: NavGroupConfig[] = [
  {
    id: 'ringkasan',
    groupTitle: 'RINGKASAN',
    items: [
      {
        id: 'ulok-dashboard',
        title: 'Ulok Dashboard',
        href: '/admin/super-admin',
        exact: true,
        icon: 'dashboard',
      },
      {
        id: 'clustering-dashboard',
        title: 'Clustering Dashboard',
        href: '/admin/super-admin/clustering',
        exact: false,
        icon: 'clustering',
      },
      {
        id: 'user-dashboard',
        title: 'User Dashboard',
        href: '/admin/super-admin/user-dashboard',
        exact: false,
        icon: 'analytics',
      },
    ],
  },
  {
    id: 'account-overview',
    groupTitle: 'ACCOUNT & OVERVIEW',
    items: [
      {
        id: 'admin-cabang',
        title: 'Admin Cabang',
        href: '/admin/super-admin/daftaruser/admincabang',
        exact: false,
        icon: 'admin-cabang',
      },
      {
        id: 'assessor-legal',
        title: 'Assessor Legal',
        href: '/admin/super-admin/daftaruser/assessor',
        exact: false,
        icon: 'assessor',
      },
    ],
  },
  {
    id: 'activity-log',
    groupTitle: 'ACTIVITY & LOG',
    items: [
      {
        id: 'recycle-bin',
        title: 'Recycle Bin',
        href: '/admin/super-admin/recyclebin',
        exact: false,
        icon: 'recycle',
      },
      {
        id: 'user-log',
        title: 'User Log',
        href: '/admin/super-admin/riwayat-login',
        exact: false,
        icon: 'log',
      },
    ],
  },
  {
    id: 'pengaturan',
    groupTitle: 'PENGATURAN',
    items: [
      {
        id: 'branches',
        title: 'Umum',
        href: '/admin/super-admin/branches',
        exact: false,
        icon: 'settings',
      },
    ],
  },
];

/**
 * Check if a navigation item is active based on current pathname
 */
export function isNavItemActive(pathname: string, href: string, exact: boolean = false): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + '/');
}

/**
 * Get dynamic page title for the header topbar based on current pathname
 */
export function getSuperAdminPageTitle(pathname: string): string {
  if (pathname === '/admin/super-admin') return 'Ulok Dashboard';
  if (pathname.startsWith('/admin/super-admin/clustering')) return 'Clustering Dashboard';
  if (pathname.startsWith('/admin/super-admin/user-dashboard')) return 'User Dashboard';
  if (pathname.startsWith('/admin/super-admin/daftaruser/admincabang')) return 'Daftar Admin Cabang';
  if (pathname.startsWith('/admin/super-admin/daftaruser/assessor')) return 'Daftar Assessor Legal';
  if (pathname.startsWith('/admin/super-admin/riwayat-login')) return 'User Activity Log';
  if (pathname.startsWith('/admin/super-admin/recyclebin')) return 'Recycle Bin';
  if (pathname.startsWith('/admin/super-admin/profile')) return 'Profil Super Admin';
  if (pathname.startsWith('/admin/super-admin/notification')) return 'Notifikasi System';
  if (pathname.startsWith('/admin/super-admin/branches')) return 'Manajemen Cabang';
  
  return 'Dashboard';
}
