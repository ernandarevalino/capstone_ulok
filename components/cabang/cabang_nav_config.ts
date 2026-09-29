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

export const CABANG_NAV_GROUPS: NavGroupConfig[] = [
  {
    id: 'ringkasan',
    groupTitle: 'MENU UTAMA',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/admin/cabang',
        exact: true,
        icon: 'dashboard',
      },
      {
        id: 'usulan-lokasi',
        title: 'Usulan Lokasi',
        href: '/admin/cabang/usulan-lokasi',
        exact: false,
        icon: 'usulan-lokasi',
      },
      {
        id: 'perpanjangan',
        title: 'Perpanjangan',
        href: '/admin/cabang/perpanjangan',
        exact: false,
        icon: 'perpanjangan',
      },
    ],
  },
  {
    id: 'analisis-evaluasi',
    groupTitle: 'ANALISIS & EVALUASI',
    items: [
      {
        id: 'feedback',
        title: 'Feedback',
        href: '/admin/cabang/feedback',
        exact: false,
        icon: 'feedback',
      },
      {
        id: 'peringkat',
        title: 'Peringkat',
        href: '/admin/cabang/peringkat',
        exact: false,
        icon: 'peringkat',
      },
    ],
  },
  {
    id: 'pengaturan',
    groupTitle: 'PENGATURAN',
    items: [
      {
        id: 'profile',
        title: 'Profil Saya',
        href: '/admin/cabang/profile',
        exact: false,
        icon: 'profile',
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
export function getCabangPageTitle(pathname: string): string {
  if (pathname === '/admin/cabang') return 'Dashboard Admin Cabang';
  if (pathname.startsWith('/admin/cabang/usulan-lokasi')) return 'Usulan Lokasi Baru';
  if (pathname.startsWith('/admin/cabang/perpanjangan')) return 'Perpanjangan Toko Existing';
  if (pathname.startsWith('/admin/cabang/feedback')) return 'Feedback & Catatan Assessor';
  if (pathname.startsWith('/admin/cabang/peringkat')) return 'Peringkat & Skor Lokasi';
  if (pathname.startsWith('/admin/cabang/profile')) return 'Pengaturan Profil Cabang';
  if (pathname.startsWith('/admin/cabang/notification')) return 'Notifikasi System Cabang';
  
  return 'Dashboard Admin Cabang';
}
