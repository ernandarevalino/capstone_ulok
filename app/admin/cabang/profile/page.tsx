'use client';

import React from 'react';
import ProfileGlobal from '@/components/profile_global';
import { useCabangProfile } from '@/context/CabangProfileContext';

export default function ProfilePage() {
  const profile = useCabangProfile();

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      <ProfileGlobal initialProfile={profile} />
    </div>
  );
}
