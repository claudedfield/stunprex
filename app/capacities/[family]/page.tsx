import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DrillCardSmall } from '@/components/DrillCardSmall'
import { PostCardSmall } from '@/components/PostCardSmall'
import { getDrillsByCapacity } from '@/lib/drills'
import { getPostsByCapacity } from '@/lib/posts'
import {
  CAPACITY_SLUG_TO_FAMILY,
  CAPACITY_FAMILY_TO_SLUG,
  CAPACITY_LEAD,
  CAPACITY_THEMES,
  CAPACITY_FAMILIES,
  type CapacityFamilySlug,
} from '@/lib/codex/themes'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ family: string }>
}

export async function generateStaticParams() {
  return CAPACITY_FAMILIES.map((f) => ({ family: CAPACITY_FAMILY_TO_SLUG[f] }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { family: slug } = await params
  const family = CAPACITY_SLUG_TO_FAMILY[slug as CapacityFamilySlug]
  if (!family) return {}
  return {
    title: `${family} capacity — StunpreX`,
    description: CAPACITY_LEAD[family].slice(0, 155),
    openGraph: {
      title: `${family} capacity — StunpreX`,
      description: CAPACITY_LEAD[family].slice(0, 155),
      url: `https://www.stunprex.com/capacities/${slug}`,
      siteName: 'StunpreX',
      type: 'website',
      locale: 'en_US',
    },
  }
}

export default async function CapacityFamilyPage({ params }: Props) {
  const { family: slug } = await params
  const family = CAPACITY_SLUG_TO_FAMILY[slug as CapacityFamilySlug]
  if (!family) notFound()

  const drills = getDrillsByCapacity(family)
  const posts  = getPostsByCapacity(family)
  const themes = CAPACITY_THEMES[family]

  return (
    <>
      <Header />
      <main>
        {/* Header block */}
        <section className="container-site py-16 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm font-ui text-brown/55">
              <li><Link href="/capacities" className="hover:text-deepblue transition-colors">Capacities</Link></li>
              <li aria-hidden="true">·</li>
              <li className="text-brown/80">{family}</li>
            </ol>
          </nav>
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Capacity Family
          </p>
          <h1 className="font-heading text-deepblue">{family}</h1>
          <p className="mt-6 text-lg text-brown/80 font-body leading-relaxed max-w-3xl">
            {CAPACITY_LEAD[family]}
          </p>
        </section>

        {/* Drills section */}
        <section className="container-site pb-12">
          <h2 className="font-heading text-deepblue text-2xl mb-6">
            Drills that build {family}
          </h2>
          {drills.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {drills.map((d) => <DrillCardSmall key={d.slug} drill={d} />)}
            </div>
          ) : (
            <p className="text-brown/55 font-body italic">
              More drills on {family} are in development.
            </p>
          )}
        </section>

        {/* Articles section */}
        <section className="container-site pb-12">
          <h2 className="font-heading text-deepblue text-2xl mb-6">
            Articles on {family}
          </h2>
          {posts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => <PostCardSmall key={p.slug} post={p} />)}
            </div>
          ) : (
            <p className="text-brown/55 font-body italic">
              More articles on {family} are in development.
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
