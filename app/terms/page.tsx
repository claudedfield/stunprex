import { ComingSoon } from '@/components/ComingSoon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms governing your use of the StunpreX platform and content.',
  openGraph: {
    title: 'Terms of Use — StunpreX',
    description: 'Terms governing your use of the StunpreX platform and content.',
    url: 'https://www.stunprex.com/terms',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Use — StunpreX',
    description: 'Terms governing your use of the StunpreX platform and content.',
  },
};
export default function Page() {
  return (
    <ComingSoon
      section="Terms"
      blurb="Our terms of use are in preparation."
      shipsIn="Soon"
    />
  );
}
