// /training — Drill library index.
// Replaces ComingSoon with a grid of published DrillCards.
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';
import { getAllDrillCards } from '@/lib/drills';
import type { DrillCard } from '@/lib/drills';

export const metadata: Metadata = {
  title: 'Drill Library — StunpreX Training',
  description:
    'Codex-aligned football drills for individual player development. Each drill trains multiple capacity families simultaneously — Perceptual, Cognitive, Motor, and more.',
  alternates: { canonical: 'https://stunprex.com/training' },
  openGraph: {
    title: 'Drill Library — StunpreX Training',
    description:
      'Codex-aligned football drills for individual player development.',
    type: 'website',
    url: 'https://stunprex.com/training',
  },
};

// ─── Drill card component ──────────────────────────────────────────────────────

function DrillCardTile({ drill }: { drill: DrillCard }) {
  const { frontmatter, slug } = drill;
  const primaryCaps = frontmatter.capacities.primary.slice(0, 3);

  return (
    <Link
      href={`/training/${slug}`}
      className="group flex flex-col rounded-xl border border-deepblue/10 bg-white p-5 shadow-sm hover:border-deepblue/25 hover:shadow-md transition-all"
    >
      {/* ID + difficulty */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-ui text-[10px] uppercase tracking-widest text-orange">
          {frontmatter.drillId}
        </span>
        <span className="flex gap-1">
          {Array.from({ length: frontmatter.maxDifficulty ?? 5 }).map((_, i) => (
            <span
              key={i}
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                i < frontmatter.difficulty ? 'bg-orange' : 'bg-deepblue/15'
              }`}
            />
          ))}
        </span>
      </div>

      {/* Title */}
      <h2 className="font-heading text-deepblue text-lg leading-snug mb-2 group-hover:text-deepblue/80 transition-colors">
        {frontmatter.title}
      </h2>

      {/* Description */}
      <p className="font-body text-sm text-brown/70 leading-relaxed flex-1 mb-4">
        {frontmatter.description}
      </p>

      {/* Footer: capacities + meta */}
      <div className="flex items-end justify-between gap-2 mt-auto">
        <div className="flex flex-wrap gap-1.5">
          {primaryCaps.map((cap) => (
            <span
              key={cap}
              className="inline-block rounded-full bg-deepblue/8 px-2.5 py-0.5 font-ui text-[10px] text-deepblue"
            >
              {cap}
            </span>
          ))}
        </div>
        <span className="font-ui text-[10px] text-brown/40 whitespace-nowrap">
          {frontmatter.players} · {frontmatter.ageBand[0]}+
        </span>
      </div>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const drills = getAllDrillCards();

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">

        <PageHero
          eyebrow="Training"
          title="Drill Library"
          lede="Each drill in the StunpreX library trains multiple capacity families at once. Constraints over commands. Process over outcome. Long horizon."
        />

        {/* Drill grid */}
        <section className="container-site py-10 md:py-14">
          {drills.length === 0 ? (
            <p className="font-body text-brown/60">No drills published yet.</p>
          ) : (
            <>
              <p className="font-ui text-xs uppercase tracking-widest text-brown/40 mb-6">
                {drills.length} drill{drills.length !== 1 ? 's' : ''} published
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {drills.map((drill) => (
                  <DrillCardTile key={drill.slug} drill={drill} />
                ))}
              </div>
            </>
          )}
        </section>

      </main>
      <Footer />
    </>
  );
}
