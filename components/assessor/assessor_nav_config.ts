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

export const ASSESSOR_NAV_GROUPS: NavGroupConfig[] = [
  {
    id: 'ringkasan',
    groupTitle: 'MENU UTAMA',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/admin/assessor',
        exact: true,
        icon: 'dashboard',
      },
      {
        id: 'pengelompokan',
        title: 'Progres ULOK',
        href: '/admin/assessor/pengelompokan',
        exact: false,
        icon: 'progres',
      },
      {
        id: 'perpanjangan',
        title: 'Perpanjangan',
        href: '/admin/assessor/perpanjangan',
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
        href: '/admin/assessor/feedback',
        exact: false,
        icon: 'feedback',
      },
      {
        id: 'clustering',
        title: 'Clustering',
        href: '/admin/assessor/clustering',
        exact: false,
        icon: 'clustering',
      },
      {
        id: 'peringkat',
        title: 'Peringkat',
        href: '/admin/assessor/peringkat',
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
        href: '/admin/assessor/profile',
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
export function getAssessorPageTitle(pathname: string): string {
  if (pathname === '/admin/assessor') return 'Dashboard Assessor Legal';
  if (pathname.startsWith('/admin/assessor/pengelompokan')) return 'Progres & Verifikasi Berkas ULOK';
  if (pathname.startsWith('/admin/assessor/perpanjangan')) return 'Perpanjangan Toko Existing';
  if (pathname.startsWith('/admin/assessor/feedback')) return 'Catatan & Feedback Dokumen';
  if (pathname.startsWith('/admin/assessor/clustering')) return 'Clustering & Klasterisasi Assessor';
  if (pathname.startsWith('/admin/assessor/peringkat')) return 'Peringkat & Skor SAW';
  if (pathname.startsWith('/admin/assessor/penilaian')) return 'Form Evaluasi & Penilaian ULOK';
  if (pathname.startsWith('/admin/assessor/profile')) return 'Pengaturan Profil Assessor';
  if (pathname.startsWith('/admin/assessor/notification')) return 'Notifikasi System Assessor';
  
  return 'Dashboard Assessor Legal';
}
