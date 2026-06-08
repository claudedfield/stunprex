import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DrillLibrary } from '@/components/drills/DrillLibrary';
import { getAllDrillCards } from '@/lib/drills';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Training',
  description:
    'The methodology made physical. Drills that build named capacities, in service of named convictions, at age-appropriate levels.',
  openGraph: {
    title: 'Training — StunpreX',
    description:
      'The methodology made physical. Drills that build named capacities, in service of named convictions, at age-appropriate levels.',
    url: 'https://www.stunprex.com/training',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Training — StunpreX',
    description:
      'The methodology made physical. Drills that build named capacities, in service of named convictions, at age-appropriate levels.',
  },
};

export default function TrainingPage() {
  const drills = getAllDrillCards();

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="container-site py-16 md:py-24">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Training
          </p>
          <h1 className="font-heading mt-3">Training</h1>
          <p className="mt-6 text-brown/85 text-lg leading-relaxed max-w-3xl">
            The methodology made physical. Each drill builds named capacities, in service of named
            convictions, at age-appropriate levels.
          </p>
        </section>

        {/* Drill library with filters */}
        <section className="container-site pb-24">
          <DrillLibrary drills={drills} />
        </section>
      </main>
      <Footer />
    </>
  );
}
