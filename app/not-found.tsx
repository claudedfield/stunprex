import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main>
        <section className="container-site py-24 md:py-32">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            404
          </p>
          <h1 className="font-heading max-w-2xl">
            That page hasn&rsquo;t been built yet.
          </h1>
          <p className="mt-5 max-w-2xl text-brown/80 text-lg">
            StunpreX is in Wave 2 production. Most of the site goes live in stages over the
            next 90 days. Try the home page or the Codex.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/" className="btn-primary">Back to home</Link>
            <Link href="/codex" className="btn-secondary">Read the Codex</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
