'use client';

import React from 'react';
import ProfileGlobal from '@/components/profile_global';

export default function ProfilePage() {
  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 text-gray-800 dark:text-slate-100 transition-colors duration-300">
      <ProfileGlobal />
    </div>
  );
}
