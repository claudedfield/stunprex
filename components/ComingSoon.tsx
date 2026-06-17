import Link from 'next/link';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageHero } from './PageHero';

interface ComingSoonProps {
  section: string;
  blurb: string;
  shipsIn?: string;
}

// Generic placeholder for routes that exist in the nav but ship in later Wave-2 blocks.
// Codex-aligned: states honestly what's coming and when, no fake countdowns.
// Uses the locked PageHero so padding/eyebrow/heading colour match every secondary page.
export function ComingSoon({ section, blurb, shipsIn }: ComingSoonProps) {
  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow={section}
          title={blurb}
          lede={
            shipsIn ? (
              <>
                Shipping in <span className="font-semibold text-deepblue">{shipsIn}</span>.
              </>
            ) : undefined
          }
        >
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
            <Link href="/codex" className="btn-secondary">
              Read the Codex while you wait
            </Link>
          </div>
        </PageHero>
      </main>
      <Footer />
    </>
  );
}
