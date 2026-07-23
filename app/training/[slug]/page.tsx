// /training/[slug] — Drill detail page.
// Renders frontmatter metadata panel + SVG diagrams + MDX prose body.
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DrillDiagram, AnimatedDrillDiagram } from '@/components/drill-diagrams';
import type { DiagramSpec } from '@/components/drill-diagrams';
import { getDrillBySlug, getAllDrillSlugs } from '@/lib/drills';
import { DrillReadTracker } from '@/components/analytics/DrillReadTracker';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllDrillSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const drill = getDrillBySlug(slug);
  if (!drill) return {};

  const { frontmatter } = drill;
  const canonicalUrl = `https://stunprex.com/training/${slug}`;

  return {
    title: `${frontmatter.title} — StunpreX Drill Library`,
    description: frontmatter.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: 'article',
      url: canonicalUrl,
    },
  };
}

// ─── Metadata chip ─────────────────────────────────────────────────────────────

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-ui text-[9px] uppercase tracking-widest text-brown/50">{label}</span>
      <span className="font-ui text-xs text-deepblue font-semibold">{value}</span>
    </div>
  );
}

function DifficultyPips({
  value,
  max = 5,
}: {
  value: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-ui text-[9px] uppercase tracking-widest text-brown/50">Difficulty</span>
      <span className="flex gap-1 items-center">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={`inline-block w-2 h-2 rounded-full ${
              i < value ? 'bg-orange' : 'bg-deepblue/15'
            }`}
          />
        ))}
      </span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function DrillDetailPage({ params }: Props) {
  const { slug } = await params;
  const drill = getDrillBySlug(slug);
  if (!drill) notFound();

  const { frontmatter, source } = drill;
  const primaryCaps = frontmatter.capacities.primary;
  const secondaryCaps = frontmatter.capacities.secondary ?? [];

  // Fallback ladder: animation → static diagram → prose (the body's ASCII setup).
  const diagrams = frontmatter.diagrams ?? [];
  const isAnimated = (d: DiagramSpec) => !!d.animation && !!d.entities && d.entities.length > 0;
  const animatedDiagrams = diagrams.filter(isAnimated);
  const staticDiagrams = diagrams.filter((d) => !isAnimated(d) && !!d.elements && d.elements.length > 0);
  const hasDiagrams = animatedDiagrams.length > 0 || staticDiagrams.length > 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: frontmatter.title,
    description: frontmatter.description,
    url: `https://stunprex.com/training/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main id="main-content" className="min-h-screen">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="border-b border-deepblue/8 bg-deepblue/[0.02] py-10 md:py-14">
          <div className="container-site">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-brown/50 font-ui">
              <Link href="/training" className="hover:text-deepblue transition-colors">
                Training
              </Link>
              <span>/</span>
              <span className="text-brown/70">{frontmatter.drillId}</span>
            </nav>

            <p className="font-ui text-xs uppercase tracking-widest text-orange mb-2">
              Drill — {frontmatter.drillId}
            </p>
            <h1 className="font-heading text-deepblue mb-3 max-w-3xl">{frontmatter.title}</h1>
            <p className="max-w-2xl text-lg text-brown/70 font-body leading-relaxed">
              {frontmatter.description}
            </p>

            {/* Capacity tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {primaryCaps.map((cap) => (
                <Link
                  key={cap}
                  href={`/capacities/${cap.toLowerCase()}`}
                  className="inline-block rounded-full bg-deepblue/8 px-3 py-1 font-ui text-xs text-deepblue hover:bg-deepblue/15 transition-colors"
                >
                  {cap}
                </Link>
              ))}
              {secondaryCaps.map((cap) => (
                <Link
                  key={cap}
                  href={`/capacities/${cap.toLowerCase()}`}
                  className="inline-block rounded-full bg-brown/8 px-3 py-1 font-ui text-xs text-brown/60 hover:bg-brown/15 transition-colors"
                >
                  {cap}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="container-site py-10 md:py-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">

            {/* Left: prose + diagrams */}
            <article>

              {/* Diagrams */}
              {hasDiagrams && (
                <div className="mb-10">
                  <p className="font-ui text-[10px] uppercase tracking-widest text-brown/50 mb-4">
                    Diagrams
                  </p>

                  {/* Animated diagrams — full width, with play/scrub controls. */}
                  {animatedDiagrams.length > 0 && (
                    <div className="mb-4 space-y-4">
                      {animatedDiagrams.map((spec) => (
                        <AnimatedDrillDiagram
                          key={spec.id}
                          pitch={spec.pitch}
                          entities={spec.entities!}
                          animation={spec.animation!}
                          title={spec.title}
                          caption={spec.caption}
                        />
                      ))}
                    </div>
                  )}

                  {/* Static diagrams — two-column grid (unchanged). */}
                  {staticDiagrams.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {staticDiagrams.map((spec) => (
                        <DrillDiagram
                          key={spec.id}
                          pitch={spec.pitch}
                          elements={spec.elements!}
                          title={spec.title}
                          caption={spec.caption}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MDX prose */}
              <div className="font-body text-brown leading-relaxed space-y-6 max-w-prose
                [&_h2]:font-heading [&_h2]:text-deepblue [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-3
                [&_h3]:font-ui [&_h3]:text-deepblue [&_h3]:text-base [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:mt-8 [&_h3]:mb-2
                [&_strong]:font-semibold [&_strong]:text-brown
                [&_em]:italic [&_em]:text-brown/80
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                [&_li]:text-brown/80
                [&_hr]:border-deepblue/10 [&_hr]:my-8
                [&_p]:text-brown/85
                [&_code]:font-ui [&_code]:text-xs [&_code]:bg-deepblue/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
                <MDXRemote source={source} />
              </div>
              <DrillReadTracker drillId={frontmatter.drillId} />
            </article>

            {/* Right sidebar: metadata panel */}
            <aside className="order-first lg:order-last">
              <div className="sticky top-6 rounded-xl border border-deepblue/10 bg-white p-5 shadow-sm space-y-5">

                {/* Quick stats grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <Chip label="Players" value={frontmatter.players} />
                  <Chip label="Equipment" value={frontmatter.equipment} />
                  <Chip label="Age bands" value={frontmatter.ageBand.join(', ')} />
                  {frontmatter.playerOperatingPrinciple && (
                    <Chip label="POP" value={frontmatter.playerOperatingPrinciple} />
                  )}
                </div>

                {/* Difficulty */}
                <DifficultyPips
                  value={frontmatter.difficulty}
                  max={frontmatter.maxDifficulty ?? 5}
                />

                {/* Capacities */}
                <div>
                  <p className="font-ui text-[9px] uppercase tracking-widest text-brown/50 mb-2">
                    Capacities trained
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {primaryCaps.map((cap) => (
                      <Link
                        key={cap}
                        href={`/capacities/${cap.toLowerCase()}`}
                        className="inline-block rounded-full bg-deepblue/8 px-2.5 py-0.5 font-ui text-[11px] text-deepblue hover:bg-deepblue/15 transition-colors"
                      >
                        {cap}
                      </Link>
                    ))}
                    {secondaryCaps.map((cap) => (
                      <Link
                        key={cap}
                        href={`/capacities/${cap.toLowerCase()}`}
                        className="inline-block rounded-full bg-brown/8 px-2.5 py-0.5 font-ui text-[11px] text-brown/60 hover:bg-brown/15 transition-colors"
                      >
                        {cap}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Back link */}
                <Link
                  href="/training"
                  className="block text-center rounded-lg border border-deepblue/20 px-4 py-2.5 font-ui text-xs uppercase tracking-widest text-deepblue hover:bg-deepblue/5 transition-colors"
                >
                  ← All drills
                </Link>
              </div>
            </aside>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
