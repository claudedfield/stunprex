// /training — Drill library index. Server loads the full drill set; the client
// component handles search, multi-select facet filtering, and 12-per-page pagination.
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';
import { TrainingIndexClient } from './TrainingIndexClient';
import { getAllDrillCards } from '@/lib/drills';

export const metadata: Metadata = {
  title: 'Drill Library — StunpreX Training',
  description:
    'Codex-aligned football drills for individual player development. Filter by capacity family, age band, difficulty, and theme — each drill trains multiple capacities at once.',
  alternates: { canonical: 'https://stunprex.com/training' },
  openGraph: {
    title: 'Drill Library — StunpreX Training',
    description:
      'Codex-aligned football drills for individual player development.',
    type: 'website',
    url: 'https://stunprex.com/training',
  },
};

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

        <section className="container-site py-10 md:py-14">
          {drills.length === 0 ? (
            <p className="font-body text-brown/60">No drills published yet.</p>
          ) : (
            <TrainingIndexClient drills={drills} />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
