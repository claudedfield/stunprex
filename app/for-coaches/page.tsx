import { ComingSoon } from '@/components/ComingSoon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'For Coaches',
  description:
    'Coaching resources grounded in the StunpreX methodology — develop complete players with a long-horizon, multi-capacity approach.',
  openGraph: {
    title: 'For Coaches — StunpreX',
    description:
      'Coaching resources grounded in the StunpreX methodology — develop complete players with a long-horizon, multi-capacity approach.',
    url: 'https://www.stunprex.com/for-coaches',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Coaches — StunpreX',
    description:
      'Coaching resources grounded in the StunpreX methodology — develop complete players with a long-horizon, multi-capacity approach.',
  },
};
export default function Page() {
  return (
    <ComingSoon
      section="For coaches"
      blurb="A dedicated path for coaches who multiply players. Coming soon — for now, browse the blog and the community."
      shipsIn="Next phase"
    />
  );
}
