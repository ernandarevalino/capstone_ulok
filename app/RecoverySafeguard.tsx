'use client';

import { useEffect } from 'react';

export default function RecoverySafeguard() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.hash.includes('type=recovery')
    ) {
      window.location.href = `/login/lupasandi/reset${window.location.hash}`;
    }
  }, []);

  return null;
}
