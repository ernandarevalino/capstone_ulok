import React, { Suspense } from 'react';
import AssessorLayoutClient from '@/components/assessor/assessor_layout_client';
import { Metadata } from 'next';
import { getCurrentProfile } from '@/actions/auth';
import { AssessorProfileProvider } from '@/context/AssessorProfileContext';

export const metadata: Metadata = {
  title: 'Dashboard Assessor Legal',
};

export default async function AssessorLayout({ children }: { children: React.ReactNode }) {
  const profileRes = await getCurrentProfile();
  const profile = profileRes?.success && profileRes.profile ? profileRes.profile : null;

  return (
    <AssessorProfileProvider profile={profile}>
      <AssessorLayoutClient>
        <Suspense fallback={<div className="p-6 text-center text-gray-500 dark:text-gray-400">Memuat halaman...</div>}>
          {children}
        </Suspense>
      </AssessorLayoutClient>
    </AssessorProfileProvider>
  );
}
