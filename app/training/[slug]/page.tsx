// /training/[slug] — Drill detail page.
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DrillMetaPanel } from '@/components/drills/DrillMetaPanel';
import { DrillAnchorBlock } from '@/components/drills/DrillAnchorBlock';
import { mdxComponents } from '@/components/blog/MdxComponents';
import { getDrill, getAllDrillSlugs } from '@/lib/drills';
import Link from 'next/link';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllDrillSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const drill = getDrill(slug);
  if (!drill) return {};

  const { frontmatter } = drill;
  const url = `https://www.stunprex.com/training/${slug}`;

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${frontmatter.title} — StunpreX`,
      description: frontmatter.description,
      type: 'article',
      url,
      siteName: 'StunpreX',
      locale: 'en_US',
      publishedTime: frontmatter.date,
      modifiedTime: frontmatter.lastModified,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${frontmatter.title} — StunpreX`,
      description: frontmatter.description,
    },
  };
}

/** Parse ISO 8601 duration from a string like "8–15 min" or "12 min". */
function parseDuration(duration: string): string {
  const match = duration.match(/(\d+)/);
  return match ? `PT${match[1]}M` : 'PT10M';
}

/** Extract numbered steps from the "Description (how it runs)" section of MDX source. */
function extractHowToSteps(source: string): Array<{ name: string; text: string }> {
  try {
    const sectionMatch = source.match(/## Description[\s\S]*?\n\n([\s\S]*?)(?=\n---|\n## )/);
    if (!sectionMatch) return [];

    const lines = sectionMatch[1].split('\n');
    const steps: Array<{ name: string; text: string }> = [];
    let current: string[] = [];
    let num = 0;

    for (const line of lines) {
      const m = line.match(/^(\d+)\.\s+(.+)/);
      if (m) {
        if (current.length > 0) {
          steps.push({ name: `Step ${num}`, text: current.join(' ').replace(/\*\*/g, '').replace(/\*/g, '').trim() });
        }
        num = parseInt(m[1], 10);
        current = [m[2]];
      } else if (line.trim() && current.length > 0 && !line.startsWith('#')) {
        current.push(line.trim());
      }
    }
    if (current.length > 0) {
      steps.push({ name: `Step ${num}`, text: current.join(' ').replace(/\*\*/g, '').replace(/\*/g, '').trim() });
    }
    return steps.length >= 2 ? steps : [];
  } catch {
    return [];
  }
}

function buildHowToSchema(
  title: string,
  description: string,
  duration: string,
  equipment: string[],
  source: string
) {
  const steps = extractHowToSteps(source);
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description,
    totalTime: parseDuration(duration),
    tool: equipment.map((name) => ({ '@type': 'HowToTool', name })),
  };
  if (steps.length >= 2) {
    schema.step = steps.map((s) => ({
      '@type': 'HowToStep',
      name: s.name,
      text: s.text,
    }));
  }
  return schema;
}

export default async function DrillDetailPage({ params }: Props) {
  const { slug } = await params;
  const drill = getDrill(slug);
  if (!drill) notFound();

  const { frontmatter, source } = drill;
  const howToSchema = buildHowToSchema(
    frontmatter.title,
    frontmatter.description,
    frontmatter.duration,
    frontmatter.equipment,
    source
  );

  return (
    <>
      <Header />
      <main>
        {/* JSON-LD HowTo schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />

        <div className="container-site py-12 md:py-20">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-brown/55 font-ui">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/training" className="hover:text-brown transition-colors">
                  Training
                </Link>
              </li>
              <li aria-hidden="true">·</li>
              <li className="text-brown/80">{frontmatter.title}</li>
            </ol>
          </nav>

          {/* Title block */}
          <div className="mb-10">
            <span className="inline-flex items-center rounded-full border border-deepblue/20 bg-deepblue/5 px-2.5 py-0.5 text-xs font-semibold text-deepblue/60 font-ui tracking-wide mb-3">
              {frontmatter.drillId}
            </span>
            <h1 className="font-heading mt-2 text-4xl md:text-5xl text-deepblue">
              {frontmatter.title}
            </h1>
            <p className="mt-4 text-lg text-brown/75 leading-relaxed font-body max-w-3xl">
              {frontmatter.description}
            </p>
          </div>

          {/* Page body: content + right rail */}
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12 lg:items-start">
            {/* Main content */}
            <div className="min-w-0">
              {/* DrillMetaPanel handles mobile (collapsible) internally via lg:hidden */}
              <DrillMetaPanel frontmatter={frontmatter} />

              {/* Anchor block */}
              <div className="mb-8">
                <DrillAnchorBlock anchors={frontmatter.codexAnchors} />
              </div>

              {/* MDX body */}
              <article>
                <MDXRemote source={source} components={mdxComponents} />
              </article>

              {/* Back link */}
              <div className="mt-16 pt-8 border-t border-deepblue/10">
                <Link
                  href="/training"
                  className="text-sm font-semibold text-deepblue hover:text-orange transition-colors font-ui"
                >
                  ← Back to all drills
                </Link>
              </div>
            </div>

            {/* Desktop right rail — DrillMetaPanel desktop variant (hidden lg:block inside component) */}
            <aside aria-label="Drill details" className="hidden lg:block">
              <DrillMetaPanel frontmatter={frontmatter} />
              <div className="mt-6">
                <DrillAnchorBlock anchors={frontmatter.codexAnchors} />
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
