// /capacities/[slug] — Capacity family cross-linking page.
// Lists all drills that train a given primary capacity family.
// Required by §7 verification: /capacities/perceptual must show both drill titles.
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getDrillCardsByCapacity, getPublishedCapacities } from '@/lib/drills';
import type { CapacityFamily } from '@/lib/types/drill';

// Map lowercase slug → CapacityFamily display name
const CAPACITY_DISPLAY: Record<string, CapacityFamily> = {
  perceptual:    'Perceptual',
  cognitive:     'Cognitive',
  motor:         'Motor',
  communication: 'Communication',
  affective:     'Affective',
  adaptive:      'Adaptive',
};

// One-sentence description per capacity family
const CAPACITY_DESCRIPTION: Record<CapacityFamily, string> = {
  Perceptual:
    'The ability to scan, detect, and process relevant information from the environment before and during ball contact.',
  Cognitive:
    'Decision-making, working memory, attention management, and the ability to plan and adapt under time pressure.',
  Motor:
    'Technical execution — first touch quality, footwork, body mechanics, and movement efficiency in all conditions.',
  Communication:
    'Verbal and non-verbal communication with teammates, anticipating movement, and co-ordinating collective action.',
  Affective:
    'Emotional regulation, resilience under adversity, self-awareness, motivation, and the capacity to stay present.',
  Adaptive:
    'Reading environmental change, adjusting tactics and technique on the fly, and building flexible response repertoires.',
};

// Curated related reading per capacity family — essays + Pro Breakdowns that
// develop or illustrate this capacity. Keeps the topic cluster interlinked.
const RELATED_READING: Record<string, { href: string; label: string }[]> = {
  perceptual: [
    { href: '/blog/perceptual-capacity', label: 'Perceptual Capacity: What the Game Asks You to See' },
    { href: '/blog/rodri-spatial-intelligence', label: 'Pro Breakdown: Rodri’s positional intelligence' },
    { href: '/blog/scanning-while-dribbling', label: 'When scanning is the dribble — Xavi’s habit' },
  ],
  cognitive: [
    { href: '/blog/cognitive-capacity', label: 'The Cognitive Capacity: How Players Think in Football' },
    { href: '/blog/how-to-dribble-in-tight-spaces', label: 'How to dribble in tight spaces — the 1v1 commit window' },
    { href: '/blog/rodri-spatial-intelligence', label: 'Pro Breakdown: Rodri’s decision-making' },
  ],
  motor: [
    { href: '/blog/soccer-dribbling-drills', label: 'Soccer dribbling drills — the complete guide' },
    { href: '/blog/weak-foot-dribbling-drills', label: 'Both feet, or half a player — the weak-foot drill' },
  ],
  communication: [
    { href: '/blog/xhaka-communication-composure', label: 'Pro Breakdown: What Xhaka rebuilt — communication & composure' },
  ],
  affective: [
    { href: '/blog/xhaka-communication-composure', label: 'Pro Breakdown: Xhaka on composure under pressure' },
    { href: '/blog/on-deselection-next-ten-minutes-days-months', label: 'On deselection — the next ten minutes, ten days, ten months' },
  ],
  adaptive: [
    { href: '/blog/creative-dribbling-drills', label: 'Creative dribbling drills — how constraints train creativity' },
  ],
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const caps = getPublishedCapacities();
  return caps.map((cap) => ({ slug: cap.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cap = CAPACITY_DISPLAY[slug];
  if (!cap) return {};

  return {
    title: `${cap} Capacity — StunpreX Drills`,
    description: `Football drills that develop the ${cap} capacity: ${CAPACITY_DESCRIPTION[cap]}`,
    alternates: { canonical: `https://stunprex.com/capacities/${slug}` },
  };
}

export default async function CapacityPage({ params }: Props) {
  const { slug } = await params;
  const cap = CAPACITY_DISPLAY[slug];
  if (!cap) notFound();

  const drills = getDrillCardsByCapacity(cap);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">

        {/* Hero */}
        <section className="border-b border-deepblue/8 bg-deepblue/[0.02] py-14">
          <div className="container-site">
            <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-brown/50 font-ui">
              <Link href="/training" className="hover:text-deepblue transition-colors">
                Training
              </Link>
              <span>/</span>
              <span>Capacities</span>
              <span>/</span>
              <span className="text-brown/70">{cap}</span>
            </nav>
            <p className="font-ui text-xs uppercase tracking-widest text-orange mb-2">
              Capacity
            </p>
            <h1 className="font-heading text-deepblue mb-3">
              {cap}
            </h1>
            <p className="max-w-2xl text-lg text-brown/70 font-body leading-relaxed">
              {CAPACITY_DESCRIPTION[cap]}
            </p>
          </div>
        </section>

        {/* Drill list */}
        <section className="container-site py-10 md:py-14">
          {drills.length === 0 ? (
            <p className="font-body text-brown/60">
              No drills published yet for the {cap} capacity.
            </p>
          ) : (
            <>
              <p className="font-ui text-xs uppercase tracking-widest text-brown/40 mb-6">
                {drills.length} drill{drills.length !== 1 ? 's' : ''} — {cap} as primary capacity
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {drills.map(({ frontmatter, slug: drillSlug }) => (
                  <Link
                    key={drillSlug}
                    href={`/training/${drillSlug}`}
                    className="group flex flex-col rounded-xl border border-deepblue/10 bg-white p-5 shadow-sm hover:border-deepblue/25 hover:shadow-md transition-all"
                  >
                    <span className="font-ui text-[10px] uppercase tracking-widest text-orange mb-2">
                      {frontmatter.drillId}
                    </span>
                    <h2 className="font-heading text-deepblue text-lg leading-snug mb-2 group-hover:text-deepblue/80 transition-colors">
                      {frontmatter.title}
                    </h2>
                    <p className="font-body text-sm text-brown/70 leading-relaxed flex-1">
                      {frontmatter.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {frontmatter.capacities.primary.map((c) => (
                        <span
                          key={c}
                          className={`inline-block rounded-full px-2.5 py-0.5 font-ui text-[10px] ${
                            c === cap
                              ? 'bg-orange/15 text-orange'
                              : 'bg-deepblue/8 text-deepblue'
                          }`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {RELATED_READING[slug]?.length ? (
            <div className="mt-12 border-t border-deepblue/10 pt-8">
              <h2 className="font-ui text-xs uppercase tracking-widest text-brown/40 mb-4">
                Related reading
              </h2>
              <ul className="space-y-2">
                {RELATED_READING[slug].map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="font-body text-deepblue hover:text-deepblue/70 transition-colors"
                    >
                      {r.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-10">
            <Link
              href="/training"
              className="font-ui text-xs uppercase tracking-widest text-deepblue hover:text-deepblue/70 transition-colors"
            >
              ← All drills
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
