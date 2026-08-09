import { Metadata } from 'next';
import WelcomePage from '@/components/landing-page-client';

export const metadata: Metadata = {
  title: 'Beranda Utama',
};

export default function Page() {
  return <WelcomePage />;
}
