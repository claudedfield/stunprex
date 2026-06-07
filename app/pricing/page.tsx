import { ComingSoon } from '@/components/ComingSoon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Affordability is a stance. Pricing structure is in development.',
  openGraph: {
    title: 'Pricing — StunpreX',
    description: 'Affordability is a stance. Pricing structure is in development.',
    url: 'https://www.stunprex.com/pricing',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — StunpreX',
    description: 'Affordability is a stance. Pricing structure is in development.',
  },
};

export default function Page() {
  return (
    <ComingSoon
      section="Pricing"
      blurb="Affordability is a stance. Pricing structure is in development."
    />
  );
}
