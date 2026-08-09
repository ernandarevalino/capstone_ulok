import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Lupa Kata Sandi',
};

export default function LupaSandiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
