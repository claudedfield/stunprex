import { ComingSoon } from '@/components/ComingSoon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How StunpreX collects, uses, and protects your data.',
  openGraph: {
    title: 'Privacy Policy — StunpreX',
    description: 'How StunpreX collects, uses, and protects your data.',
    url: 'https://www.stunprex.com/privacy',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — StunpreX',
    description: 'How StunpreX collects, uses, and protects your data.',
  },
};
export default function Page() {
  return (
    <ComingSoon
      section="Privacy"
      blurb="Our privacy policy is in preparation."
      shipsIn="Soon"
    />
  );
}
