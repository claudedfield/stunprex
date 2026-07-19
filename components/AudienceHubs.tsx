import Link from 'next/link';

// Four audience hubs — Blueprint v2.1 §3. Reached from CTAs, not from primary nav.
const HUBS = [
  {
    href: '/for-players',
    title: 'For players',
    line: 'Every age band, 5 to 21+. Daily training, drill library, the Coach.',
    accent: 'orange' as const,
  },
  {
    href: '/for-parents',
    title: 'For parents',
    line: 'The Parent Compact. What helps. What to leave to the coach.',
    accent: 'deepblue' as const,
  },
  {
    href: '/for-coaches',
    title: 'For coaches',
    line: 'Drill library, tactical content, coach certification path.',
    accent: 'deepblue' as const,
  },
];

export function AudienceHubs() {
  return (
    <section className="py-20 md:py-24">
      <div className="container-site">
        <div className="max-w-2xl mb-10">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Pick your path in
          </p>
          <h2 className="font-heading">Three audiences, one methodology</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {HUBS.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              className="group rounded-lg border border-deepblue/15 bg-white p-7 hover:border-orange hover:shadow-md transition-all"
            >
              <h3
                className={`font-heading mb-3 transition-colors ${
                  h.accent === 'orange'
                    ? 'text-orange'
                    : 'text-deepblue group-hover:text-orange'
                }`}
              >
                {h.title}
              </h3>
              <p className="text-brown/80 text-base leading-relaxed">{h.line}</p>
              <span className="font-ui uppercase tracking-widest text-xs text-deepblue mt-5 inline-block group-hover:text-orange transition-colors">
                Enter →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
