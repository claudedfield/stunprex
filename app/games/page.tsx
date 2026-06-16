import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';
import { GAMES } from '@/lib/games/registry';

export const metadata = {
  title: 'Cognitive Games',
  description:
    'Small games that train the perception, decision-making and attention a footballer leans on. Honestly scored — no inflated promises of on-pitch transfer.',
};

export default function Page() {
  const games = [...GAMES].sort((a, b) => a.order - b.order);
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        <PageHero
          eyebrow="Games"
          title="Train the mind your game leans on"
          lede="Small games for perception, decision-making and attention — the cognition behind good football. Honestly scored. We don’t claim they make you a better player; we claim they train the capacity, and they’re worth ten minutes."
        />

        <section className="container-site py-10 md:py-14">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => {
              const card = (
                <div
                  className={`flex h-full flex-col rounded-lg border border-deepblue/12 p-5 transition-colors ${
                    g.status === 'live'
                      ? 'bg-white hover:border-orange/50'
                      : 'bg-deepblue/[0.02]'
                  }`}
                >
                  <div className="mb-3 flex flex-wrap gap-2">
                    {g.capacities.map((c) => (
                      <span
                        key={c}
                        className="inline-block rounded-full bg-deepblue/8 px-2.5 py-0.5 font-ui text-[11px] uppercase tracking-ui text-deepblue"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-heading text-deepblue text-xl">{g.name}</h2>
                  <p className="mt-2 flex-1 text-brown/75 font-body text-sm leading-relaxed">
                    {g.tagline}
                  </p>
                  <p className="mt-4 font-ui text-xs uppercase tracking-widest text-orange">
                    {g.status === 'live' ? 'Play →' : 'Coming soon'}
                  </p>
                </div>
              );
              return (
                <li key={g.slug}>
                  {g.status === 'live' ? (
                    <Link href={`/games/${g.slug}`} className="block h-full">
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
