import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
  CAPACITY_FAMILIES,
  CAPACITY_DESCRIPTIONS,
  CAPACITY_FAMILY_TO_SLUG,
} from '@/lib/codex/themes'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Six Capacities — StunpreX',
  description:
    'Football is not one skill. It is the layered development of six capacity families: Perceptual, Cognitive, Motor, Communication, Affective, and Adaptive.',
  openGraph: {
    title: 'The Six Capacities — StunpreX',
    description:
      'Football is not one skill. It is the layered development of six capacity families: Perceptual, Cognitive, Motor, Communication, Affective, and Adaptive.',
    url: 'https://www.stunprex.com/capacities',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
}

export default function CapacitiesPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-site py-16 md:py-24">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Methodology
          </p>
          <h1 className="font-heading text-deepblue">
            The six capacities of a complete player
          </h1>
          <p className="mt-6 text-lg text-brown/80 font-body leading-relaxed max-w-3xl">
            Football is not one skill. It is the layered development of six capacity families.
            Each StunpreX drill, article, and pro-breakdown is anchored to one or more of them
            — so you can train what you actually need, not what&apos;s easy to measure.
          </p>
        </section>

        <section className="container-site pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAPACITY_FAMILIES.map((family) => {
              const slug = CAPACITY_FAMILY_TO_SLUG[family]
              return (
                <div
                  key={family}
                  className="rounded-lg border border-deepblue/15 bg-white p-7 hover:border-deepblue/40 transition-colors flex flex-col"
                >
                  <h3 className="font-heading text-deepblue text-xl mb-2">{family}</h3>
                  <p className="text-sm text-brown/70 font-body leading-relaxed flex-1">
                    {CAPACITY_DESCRIPTIONS[family]}
                  </p>
                  <Link
                    href={`/capacities/${slug}`}
                    className="mt-5 inline-flex items-center text-sm font-semibold font-ui text-deepblue hover:text-orange transition-colors"
                  >
                    Explore {family} →
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
