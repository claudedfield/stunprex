import Link from 'next/link';
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
    <>
      <ComingSoon
        section="Methodology"
        blurb="A plain-language entry to the Codex."
      />
      {/* Explore by… entry points — Wave C cross-links */}
      <section className="container-site py-12 border-t border-deepblue/10">
        <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-brown/50 font-ui text-center">
          Explore the methodology
        </p>
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
          <Link
            href="/capacities"
            className="group flex flex-col gap-2 rounded-lg border border-deepblue/15 bg-white p-7 transition-all hover:border-deepblue/40 hover:shadow-sm"
          >
            <span className="text-lg font-semibold text-deepblue font-heading group-hover:text-deepblue/80">
              Explore by capacity →
            </span>
            <span className="text-sm text-brown/65 font-body">
              Perceptual · Cognitive · Motor · Communication · Affective · Adaptive
            </span>
          </Link>
          <Link
            href="/age-bands"
            className="group flex flex-col gap-2 rounded-lg border border-deepblue/15 bg-white p-7 transition-all hover:border-deepblue/40 hover:shadow-sm"
          >
            <span className="text-lg font-semibold text-deepblue font-heading group-hover:text-deepblue/80">
              Explore by age band →
            </span>
            <span className="text-sm text-brown/65 font-body">
              5–8 · 9–12 · 13–16 · 17–20 · Adult
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
