import { ComingSoon } from '@/components/ComingSoon';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'The StunpreX methodology — six capacity families, 36 convictions, and a long-horizon framework for developing complete football players.',
  openGraph: {
    title: 'Methodology — StunpreX',
    description:
      'The StunpreX methodology — six capacity families, 36 convictions, and a long-horizon framework for developing complete football players.',
    url: 'https://www.stunprex.com/methodology',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Methodology — StunpreX',
    description:
      'The StunpreX methodology — six capacity families, 36 convictions, and a long-horizon framework for developing complete football players.',
  },
};

export default function Page() {
  return (
    <ComingSoon
      section="Methodology"
      blurb="A plain-language entry to the Codex."
    />
  );
}
