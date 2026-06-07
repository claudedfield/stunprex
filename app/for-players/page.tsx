import { ComingSoon } from '@/components/ComingSoon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'For Players',
  description:
    'Develop yourself as a complete football player — not just a position. Methodology, drills, and a community built for the long horizon.',
  openGraph: {
    title: 'For Players — StunpreX',
    description:
      'Develop yourself as a complete football player — not just a position. Methodology, drills, and a community built for the long horizon.',
    url: 'https://www.stunprex.com/for-players',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Players — StunpreX',
    description:
      'Develop yourself as a complete football player — not just a position. Methodology, drills, and a community built for the long horizon.',
  },
};
export default function Page() {
  return (
    <ComingSoon
      section="For players"
      blurb="A dedicated path for players in development. Coming soon — for now, browse the blog and the community."
      shipsIn="Next phase"
    />
  );
}
