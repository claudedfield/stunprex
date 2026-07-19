// /capacities — index of the six capacity families (Codex Part II).
// Links each family to its drill cross-link page and, where published, its capacity essay.
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';
import { getDrillCardsByCapacity } from '@/lib/drills';
import type { CapacityFamily } from '@/lib/types/drill';

export const metadata: Metadata = {
  title: 'The Six Capacities — How StunpreX Develops the Whole Player',
  description:
    'Perceptual, Cognitive, Motor, Communication, Affective, Adaptive — the six families of human capacity every StunpreX drill develops. The substrate of a complete player.',
  alternates: { canonical: 'https://stunprex.com/capacities' },
};

interface Family {
  name: CapacityFamily;
  slug: string;
  blurb: string;
  /** Published capacity essay, if one exists. */
  essay?: { href: string; label: string };
}

const FAMILIES: Family[] = [
  {
    name: 'Perceptual',
    slug: 'perceptual',
    blurb:
      'Scanning, spatial awareness, pattern recognition, anticipation — what the player reads from the environment before and during ball contact.',
    essay: { href: '/blog/perceptual-capacity', label: 'Read the Perceptual capacity essay' },
  },
  {
    name: 'Cognitive',
    slug: 'cognitive',
    blurb:
      'Decision-making, working memory, attention management, inhibition — the mental work that happens in the half-second before the touch.',
    essay: { href: '/blog/cognitive-capacity', label: 'Read the Cognitive capacity essay' },
  },
  {
    name: 'Motor',
    slug: 'motor',
    blurb:
      'First-touch quality, ball mastery, footwork, balance, and movement efficiency — technical execution with both feet, in all conditions.',
  },
  {
    name: 'Communication',
    slug: 'communication',
    blurb:
      'Verbal and non-verbal coordination, anticipating teammates, and the timing of collective action under the noise of play.',
  },
  {
    name: 'Affective',
    slug: 'affective',
    blurb:
      'Emotional regulation, resilience, confidence from evidence, and joy — the capacities that sustain everything else over a long horizon.',
  },
  {
    name: 'Adaptive',
    slug: 'adaptive',
    blurb:
      'Reading change, adjusting on the fly, extracting lessons from failure, and transferring skill across surfaces, formats, and opponents.',
  },
];

export default function CapacitiesIndexPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <PageHero
          eyebrow="How we train the whole player"
          title="The six capacities"
          lede="A complete player is not one ability — it is a stack of well-developed ones. StunpreX names six families of human capacity that football draws on at once, and trains all six, deliberately, in combination."
        />

        <section className="container-site py-14 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FAMILIES.map((f) => {
              const drillCount = getDrillCardsByCapacity(f.name).length;
              return (
                <div
                  key={f.slug}
                  className="flex flex-col rounded-xl border border-deepblue/12 bg-deepblue/[0.02] p-6"
                >
                  <h2 className="font-heading text-deepblue text-xl mb-1">{f.name}</h2>
                  <p className="font-ui text-xs uppercase tracking-widest text-orange mb-3">
                    {drillCount > 0
                      ? `${drillCount} drill${drillCount !== 1 ? 's' : ''}`
                      : 'Drills coming'}
                  </p>
                  <p className="font-body text-brown/85 leading-relaxed flex-1">{f.blurb}</p>
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-ui">
                    <Link
                      href={`/capacities/${f.slug}`}
                      className="text-deepblue font-medium hover:text-deepblue/70 transition-colors"
                    >
                      Drills that train it →
                    </Link>
                    {f.essay && (
                      <Link
                        href={f.essay.href}
                        className="text-deepblue/70 hover:text-deepblue transition-colors"
                      >
                        {f.essay.label} →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/methodology" className="btn-primary">
              How the capacities fit together
            </Link>
            <Link href="/training" className="btn-secondary">
              Browse the drill library
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
