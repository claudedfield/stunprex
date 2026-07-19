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
          lede="Try the home page, or see what StunpreX believes."
        >
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="btn-primary">Back to home</Link>
            <Link href="/methodology" className="btn-secondary">What we believe</Link>
          </div>
        </PageHero>
      </main>
      <Footer />
    </>
  );
}
