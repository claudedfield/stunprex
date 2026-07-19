import Link from 'next/link';

// Five priority pillars.
interface Pillar {
  slug: string;
  title: string;
  blurb: string;
  status: 'Live' | 'Coming soon';
  /** Destination for a live pillar. */
  href?: string;
}

const PILLARS: Pillar[] = [
  { slug: 'dribbling',                   title: 'Dribbling',                  blurb: 'Tight-space control, weak foot, and beating a defender under pressure.', status: 'Live', href: '/blog/soccer-dribbling-drills' },
  { slug: 'speed-and-agility',           title: 'Speed & Agility',            blurb: 'Acceleration, change of direction, and the movement that gets a player there first.', status: 'Coming soon' },
  { slug: 'tactical-intelligence',       title: 'Tactical Intelligence',      blurb: 'Reading the game, scanning, and the decisions that separate good players from great ones.', status: 'Coming soon' },
  { slug: 'first-touch',                 title: 'First Touch',                blurb: 'The receiving skill that determines whether anything else in possession is possible.', status: 'Coming soon' },
  { slug: 'strength-endurance-recovery', title: 'Strength · Endurance · Recovery', blurb: 'The physical foundation — built safely, at the right age, without shortcuts.', status: 'Coming soon' },
];

export function Pillars() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-site">
        <div className="max-w-2xl mb-12">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Training pillars
          </p>
          <h2 className="font-heading">Five pillars, five paths in</h2>
          <p className="mt-5 text-brown/80 text-lg">
            Each pillar gathers the principles, drills, and articles that build that part of
            the player. Designed to be entered from a single search query and read in a single
            sitting.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p) => {
            const live = p.status === 'Live';
            return (
              <Link
                key={p.slug}
                href={live ? (p.href ?? '#') : '#'}
                aria-disabled={!live}
                className={`group block rounded-lg border-2 p-6 transition-all
                  ${live
                    ? 'border-deepblue/15 hover:border-orange hover:-translate-y-0.5 bg-white cursor-pointer'
                    : 'border-deepblue/10 bg-white/50 cursor-default'
                  }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-heading text-deepblue group-hover:text-orange transition-colors">
                    {p.title}
                  </h3>
                  {/* Status pill — fixed box: never shrinks or wraps, so it is identical
                      across every tile and stays top-right regardless of title line count. */}
                  <span className={`shrink-0 whitespace-nowrap inline-flex items-center font-ui uppercase tracking-widest text-[10px] leading-none px-2.5 py-1 rounded-full
                    ${live ? 'bg-orange/15 text-orange' : 'bg-brown/10 text-brown/60'}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-brown/75 text-sm leading-relaxed">{p.blurb}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
