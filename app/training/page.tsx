// /training — Drill library index.
// Replaces ComingSoon with a grid of published DrillCards.
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';
import { Pagination } from '@/components/blog/Pagination';
import { getAllDrillCards } from '@/lib/drills';
import type { DrillCard } from '@/lib/drills';

const DRILLS_PER_PAGE = 12;

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

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function TrainingPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10));
  const drills = getAllDrillCards();

  const totalPages = Math.max(1, Math.ceil(drills.length / DRILLS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageDrills = drills.slice((safePage - 1) * DRILLS_PER_PAGE, safePage * DRILLS_PER_PAGE);

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
                {pageDrills.map((drill) => (
                  <DrillCardTile key={drill.slug} drill={drill} />
                ))}
              </div>

              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                baseHref="/training"
              />
            </>
          )}
        </section>

      </main>
      <Footer />
    </>
  );
}
