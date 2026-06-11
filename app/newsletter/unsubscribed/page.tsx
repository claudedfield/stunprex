import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Unsubscribed',
  robots: { index: false, follow: false },
};

// Landing page for /api/newsletter/unsubscribe — no guilt-tripping, no
// "are you sure" friction. The cancel path is always honoured. Codex-aligned.
export default function NewsletterUnsubscribedPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-site py-24 md:py-32">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Newsletter
          </p>
          <h1 className="font-heading max-w-3xl">You&rsquo;re unsubscribed.</h1>
          <p className="mt-6 text-brown/70 text-lg max-w-2xl">
            Done — no more letters from us. If you change your mind, you can
            subscribe again anytime. Everything we publish stays free to read
            on the site either way.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
            <Link href="/blog" className="btn-secondary">
              Browse the blog
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
