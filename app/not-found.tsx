import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';

export default function NotFound() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="404"
          title="We couldn&rsquo;t find that page."
          lede="Try the home page, or dive into the Codex — the methodology is open."
        >
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="btn-primary">Back to home</Link>
            <Link href="/codex" className="btn-secondary">Read the Codex</Link>
          </div>
        </PageHero>
      </main>
      <Footer />
    </>
  );
}
