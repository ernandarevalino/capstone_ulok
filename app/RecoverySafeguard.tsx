'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecoverySafeguard() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;

    if (hash.includes('type=recovery')) {
      window.location.href = `/login/lupasandi/reset${hash}`;
      return;
    }

    if (hash.includes('error=access_denied')) {
      // Clear the messy hash from the URL first
      window.history.replaceState(null, '', window.location.pathname);
      router.push('/auth/error');
    }
  }, [router]);

  return null;
}
