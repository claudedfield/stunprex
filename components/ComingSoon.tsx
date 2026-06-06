import Link from 'next/link';
import { Header } from './Header';
import { Footer } from './Footer';

interface ComingSoonProps {
  section: string;
  blurb: string;
  shipsIn?: string;
}

// Generic placeholder for routes that exist in the nav but ship in later phases.
// Codex-aligned: states honestly what's coming, no fake countdowns.
export function ComingSoon({ section, blurb, shipsIn }: ComingSoonProps) {
  return (
    <>
      <Header />
      <main>
        <section className="container-site py-24 md:py-32">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            {section}
          </p>
          <h1 className="font-heading mt-3">{section}</h1>
          <p className="mt-6 text-brown/85 text-lg leading-relaxed max-w-3xl">{blurb}</p>
          {shipsIn && (
            <p className="mt-4 text-brown/70 text-lg">
              <span className="font-semibold text-deepblue">{shipsIn}</span>
            </p>
          )}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
            <Link href="/blog" className="btn-secondary">
              Read the blog →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
