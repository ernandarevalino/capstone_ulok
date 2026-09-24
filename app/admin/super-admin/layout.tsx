import React from 'react';
import SuperAdminLayoutClient from '@/components/super-admin/super_admin_layout_client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manajemen Pengguna - Super Admin',
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminLayoutClient>{children}</SuperAdminLayoutClient>;
}
