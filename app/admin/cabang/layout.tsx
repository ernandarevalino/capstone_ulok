import React, { Suspense } from 'react';
import CabangLayoutClient from '@/components/cabang/cabang_layout_client';
import { Metadata } from 'next';
import { getCurrentProfile } from '@/actions/auth';
import { CabangProfileProvider } from '@/context/CabangProfileContext';

export const metadata: Metadata = {
  title: 'Dashboard Admin Cabang',
};

export default async function CabangLayout({ children }: { children: React.ReactNode }) {
  const profileRes = await getCurrentProfile();
  const profile = profileRes?.success && profileRes.profile ? profileRes.profile : null;

  return (
    <CabangProfileProvider profile={profile}>
      <CabangLayoutClient>
        <Suspense fallback={<div className="p-6 text-center text-gray-500 dark:text-gray-400">Memuat halaman...</div>}>
          {children}
        </Suspense>
      </CabangLayoutClient>
    </CabangProfileProvider>
  );
}
