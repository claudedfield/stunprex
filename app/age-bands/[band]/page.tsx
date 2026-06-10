import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DrillCardSmall } from '@/components/DrillCardSmall'
import { PostCardSmall } from '@/components/PostCardSmall'
import { getDrillsByAgeBand } from '@/lib/drills'
import { getAllPostCards } from '@/lib/posts'
import {
  AGE_BAND_SLUGS,
  AGE_BAND_LABELS,
  AGE_BAND_LEAD,
  AGE_BAND_THEMES,
  bandSlugToMatchString,
  type AgeBandSlug,
} from '@/lib/codex/themes'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ band: string }>
}

export async function generateStaticParams() {
  return AGE_BAND_SLUGS.map((band) => ({ band }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { band } = await params
  if (!(AGE_BAND_SLUGS as readonly string[]).includes(band)) return {}
  const slug = band as AgeBandSlug
  return {
    title: `${AGE_BAND_LABELS[slug]} — StunpreX`,
    description: AGE_BAND_LEAD[slug].slice(0, 155),
    openGraph: {
      title: `${AGE_BAND_LABELS[slug]} — StunpreX`,
      description: AGE_BAND_LEAD[slug].slice(0, 155),
      url: `https://www.stunprex.com/age-bands/${band}`,
      siteName: 'StunpreX',
      type: 'website',
      locale: 'en_US',
    },
  }
}

export default async function AgeBandPage({ params }: Props) {
  const { band } = await params
  if (!(AGE_BAND_SLUGS as readonly string[]).includes(band)) notFound()
  const slug = band as AgeBandSlug

  const matchStr = bandSlugToMatchString(slug)
  const drills   = getDrillsByAgeBand(matchStr)
  // Blog posts don't carry explicit age-band tags yet — empty state applies
  const posts    = getAllPostCards().filter(() => false) // placeholder until frontmatter added
  const themes   = AGE_BAND_THEMES[slug]
  const label    = AGE_BAND_LABELS[slug]

  return (
    <>
      <Header />
      <main>
        {/* Header block */}
        <section className="container-site py-16 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm font-ui text-brown/55">
              <li><Link href="/age-bands" className="hover:text-deepblue transition-colors">Age bands</Link></li>
              <li aria-hidden="true">·</li>
              <li className="text-brown/80">{label}</li>
            </ol>
          </nav>
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Age Band
          </p>
          <h1 className="font-heading text-deepblue">{label}</h1>
          <p className="mt-6 text-lg text-brown/80 font-body leading-relaxed max-w-3xl">
            {AGE_BAND_LEAD[slug]}
          </p>
        </section>

        {/* Drills section */}
        <section className="container-site pb-12">
          <h2 className="font-heading text-deepblue text-2xl mb-6">
            Drills for this age band
          </h2>
          {drills.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {drills.map((d) => <DrillCardSmall key={d.slug} drill={d} />)}
            </div>
          ) : (
            <p className="text-brown/55 font-body italic">
              More drills for this age band are in development.
            </p>
          )}
        </section>

        {/* Articles section */}
        <section className="container-site pb-12">
          <h2 className="font-heading text-deepblue text-2xl mb-6">
            Articles for this age
          </h2>
          {posts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => <PostCardSmall key={p.slug} post={p} />)}
            </div>
          ) : (
            <p className="text-brown/55 font-body italic">
              More articles for this age band are in development.
            </p>
          )}
        </section>

        {/* In the Codex */}
        <section className="container-site pb-24">
          <h2 className="font-heading text-deepblue text-2xl mb-6">In the Codex</h2>
          <aside
            aria-label="Conviction themes"
            className="rounded-lg border border-deepblue/15 bg-deepblue/[0.03] px-5 py-4 text-sm max-w-2xl"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-deepblue/50 font-ui">
              Conviction themes
            </p>
            <ul className="flex flex-wrap gap-2">
              {themes.map((theme) => (
                <li
                  key={theme}
                  className="inline-flex items-center rounded bg-deepblue/10 px-2 py-0.5 text-xs font-semibold text-deepblue font-ui"
                >
                  {theme}
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  )
}
