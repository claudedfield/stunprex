import { ComingSoon } from '@/components/ComingSoon';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Playbook',
  description: 'The StunpreX Playbook is in preparation.',
  openGraph: {
    title: 'Playbook — StunpreX',
    description: 'The StunpreX Playbook is in preparation.',
    url: 'https://www.stunprex.com/playbook',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Playbook — StunpreX',
    description: 'The StunpreX Playbook is in preparation.',
  },
};

export default function Page() {
  return (
    <ComingSoon
      section="Playbook"
      blurb="In preparation."
    />
  );
}
