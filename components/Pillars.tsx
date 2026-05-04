import Link from 'next/link';

// Five priority pillars — Wave-2 ship sequence, Blueprint v2.1 §15.
const PILLARS = [
  { slug: 'dribbling',                   title: 'Dribbling',                  blurb: 'Broad search demand. Player-layer entry-point.', status: 'In production' },
  { slug: 'speed-and-agility',           title: 'Speed & Agility',            blurb: 'Mid-volume keyword set. Broad audience.',         status: 'Coming soon' },
  { slug: 'tactical-intelligence',       title: 'Tactical Intelligence',      blurb: 'Distinctive methodology. Coach/parent layer.',    status: 'Coming soon' },
  { slug: 'first-touch',                 title: 'First Touch',                blurb: 'Codex Conviction 4 made into a pillar.',          status: 'Coming soon' },
  { slug: 'strength-endurance-recovery', title: 'Strength · Endurance · Recovery', blurb: 'Physical conditioning anchor.',              status: 'Coming soon' },
] as const;

export function Pillars() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-site">
        <div className="max-w-2xl mb-12">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Wave-2 priority pillars
          </p>
          <h2 className="font-heading">Five pillars, five paths in</h2>
          <p className="mt-5 text-brown/80 text-lg">
            Each pillar gathers the convictions, drills, and articles that build that part of
            the player. Designed to be entered from a single search query and read in a single
            sitting.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p) => {
            const live = p.status === 'In production';
            return (
              <Link
                key={p.slug}
                href={live ? `/playbook/pillar/${p.slug}` : '#'}
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
