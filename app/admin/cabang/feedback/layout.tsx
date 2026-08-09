import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Feedback Assessor',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
