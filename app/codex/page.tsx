import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Codex',
  description: 'The StunpreX methodology — in preparation.',
  openGraph: {
    title: 'Codex — StunpreX',
    description: 'The StunpreX methodology — in preparation.',
    url: 'https://www.stunprex.com/codex',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codex — StunpreX',
    description: 'The StunpreX methodology — in preparation.',
  },
};

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <section className="container-site py-24 md:py-32">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Codex
          </p>
          <h1 className="font-heading max-w-3xl">
            The StunpreX methodology is in active development. A public summary is in preparation.
          </h1>
          <p className="mt-6 text-brown/70 text-lg">Coming soon.</p>
          <div className="mt-10">
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
