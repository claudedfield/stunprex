import Link from 'next/link';

// Five priority pillars — methodology coverage map. Internal planning lives in the COO Plan, not in this comment.
const PILLARS = [
  { slug: 'dribbling',                   title: 'Dribbling',                       blurb: 'Beat the defender. Carry the ball with intent. Make the move that decides the moment.', status: 'In production' },
  { slug: 'speed-and-agility',           title: 'Speed & Agility',                 blurb: 'The burst the moment demands. The recovery the next moment requires.',                   status: 'Coming soon' },
  { slug: 'tactical-intelligence',       title: 'Tactical Intelligence',           blurb: 'The decision before the touch. Read the game so the game stops surprising you.',         status: 'Coming soon' },
  { slug: 'first-touch',                 title: 'First Touch',                     blurb: 'The skill that makes every other skill possible. Receive cleanly, under pressure, on either foot.', status: 'Coming soon' },
  { slug: 'strength-endurance-recovery', title: 'Strength · Endurance · Recovery', blurb: 'Train harder than you play. Recover smarter than you train.',                            status: 'Coming soon' },
] as const;

export function Pillars() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-site">
        <div className="max-w-2xl mb-12">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            What StunpreX trains
          </p>
          <h2 className="font-heading">Five pillars, five paths in</h2>
          <p className="mt-5 text-brown/80 text-lg">
            Each pillar gathers the principles, drills, and articles that develop one part of
            the player. Entered from a single question, read in a single sitting.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p) => {
            const live = p.status === 'In production';
            return (
              <Link
                key={p.slug}
                href={live ? `/blog/develop-the-player-not-the-position` : '#'}
                aria-disabled={!live}
                className={`group block rounded-lg border-2 p-6 transition-all
                  ${live
                    ? 'border-deepblue/15 hover:border-orange hover:-translate-y-0.5 bg-white cursor-pointer'
                    : 'border-deepblue/10 bg-white/50 cursor-default'
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-heading text-deepblue group-hover:text-orange transition-colors">
                    {p.title}
                  </h3>
                  <span className={`font-ui uppercase tracking-widest text-[10px] px-2 py-1 rounded-full
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
