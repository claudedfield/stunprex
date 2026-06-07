import { ComingSoon } from '@/components/ComingSoon';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Training',
  description:
    'Multi-capacity training sessions designed around the StunpreX methodology — drills that develop perception, cognition, technique, and more at once.',
  openGraph: {
    title: 'Training — StunpreX',
    description:
      'Multi-capacity training sessions designed around the StunpreX methodology — drills that develop perception, cognition, technique, and more at once.',
    url: 'https://www.stunprex.com/training',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Training — StunpreX',
    description:
      'Multi-capacity training sessions designed around the StunpreX methodology — drills that develop perception, cognition, technique, and more at once.',
  },
};

export default function Page() {
  return (
    <ComingSoon
      section="Training"
      blurb="A library of structured drills — themed, searchable, filterable. Filter by number of players, drill aim, age band, equipment, and the capacities each drill builds. Every drill traces to a principle, comes with a coaching note, and progresses across five levels."
      shipsIn="Coming soon"
    />
  );
}
