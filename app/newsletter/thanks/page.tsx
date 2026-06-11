import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Subscription confirmed',
  robots: { index: false, follow: false },
};

// Landing page for /api/newsletter/confirm — double opt-in completed.
export default function NewsletterThanksPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-site py-24 md:py-32">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Newsletter
          </p>
          <h1 className="font-heading max-w-3xl">You&rsquo;re in. Thanks for confirming.</h1>
          <p className="mt-6 text-brown/70 text-lg max-w-2xl">
            Methodology letters on individual player development — no hype, and
            every issue carries an unsubscribe link.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
            <Link href="/codex" className="btn-secondary">
              Read the Codex meanwhile
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
