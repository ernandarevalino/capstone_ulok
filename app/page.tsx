import { Metadata } from 'next';
import WelcomePage from '@/components/landing-page-client';
import RecoverySafeguard from './RecoverySafeguard';

export const metadata: Metadata = {
  title: 'Beranda Utama',
};

export default function Page() {
  return (
    <>
      <RecoverySafeguard />
      <WelcomePage />
    </>
  );
}
