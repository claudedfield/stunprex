import { ComingSoon } from '@/components/ComingSoon';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Games',
  description:
    'Game formats and small-sided structures for individual football development — pressure, decision-making, and creativity built in by design.',
  openGraph: {
    title: 'Games — StunpreX',
    description:
      'Game formats and small-sided structures for individual football development — pressure, decision-making, and creativity built in by design.',
    url: 'https://www.stunprex.com/games',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Games — StunpreX',
    description:
      'Game formats and small-sided structures for individual football development — pressure, decision-making, and creativity built in by design.',
  },
};

export default function Page() {
  return (
    <ComingSoon
      section="Games"
      blurb="Football intelligence in playable form — drills, decisions, and scenarios you can train through quick, focused interactions. The cognitive side of the game, made trainable."
      shipsIn="Coming soon"
    />
  );
}
