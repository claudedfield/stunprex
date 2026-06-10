import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AGE_BAND_SLUGS, AGE_BAND_LABELS, AGE_BAND_DESCRIPTIONS } from '@/lib/codex/themes'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Age Bands — StunpreX',
  description:
    'Football development unfolds across five age bands. Each has its own priorities, risks, and capacity targets. Explore them here.',
  openGraph: {
    title: 'Age Bands — StunpreX',
    description:
      'Football development unfolds across five age bands. Each has its own priorities, risks, and capacity targets.',
    url: 'https://www.stunprex.com/age-bands',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
}

export default function AgeBandsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-site py-16 md:py-24">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Methodology
          </p>
          <h1 className="font-heading text-deepblue">
            Development across the five age bands
          </h1>
          <p className="mt-6 text-lg text-brown/80 font-body leading-relaxed max-w-3xl">
            Football development unfolds over a long horizon, with different priorities at each
            stage. Each band has its own risks, its own capacity targets, and its own definition
            of what good looks like. Training that ignores the band is training without context.
          </p>
        </section>

        <section className="container-site pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {AGE_BAND_SLUGS.map((slug) => (
              <div
                key={slug}
                className="rounded-lg border border-deepblue/15 bg-white p-7 hover:border-deepblue/40 transition-colors flex flex-col"
              >
                <h3 className="font-heading text-deepblue text-xl mb-2">
                  {AGE_BAND_LABELS[slug]}
                </h3>
                <p className="text-sm text-brown/70 font-body leading-relaxed flex-1">
                  {AGE_BAND_DESCRIPTIONS[slug]}
                </p>
                <Link
                  href={`/age-bands/${slug}`}
                  className="mt-5 inline-flex items-center text-sm font-semibold font-ui text-deepblue hover:text-orange transition-colors"
                >
                  Explore {AGE_BAND_LABELS[slug]} →
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
