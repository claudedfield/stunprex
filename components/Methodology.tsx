import Link from 'next/link';

// Methodology preview — plain-language principles in place of Codex conviction numbers.
// Conviction numbers are not cited publicly while the Codex is in internal revision.
// Three principles: (1) develop player not position (C14), (2) process before outcome (C21),
// (3) holism (C11). None depend on unsourced statistics. All survive v0.7.2 revision.
const PREVIEW_PRINCIPLES = [
  {
    n: 1,
    title: 'Develop the player, not the position.',
    body:
      'Skills and abilities transfer across roles. Position is something you specialise into when foundations are universal — not something you lock in at age nine.',
  },
  {
    n: 2,
    title: 'Process before outcome.',
    body:
      'Praise the work, not the win. Track touches, scans, decisions, weak-foot reps — leading indicators. The horizon is long; the urgent verdict almost always lies.',
  },
  {
    n: 3,
    title: 'Holism is non-negotiable.',
    body:
      'Mental, physical, technical, tactical, social, emotional — none is the answer; all are the substrate. Train the whole player. Lifestyle around the work counts as the work.',
  },
];

export function Methodology() {
  return (
    <section className="py-20 md:py-28 bg-deepblue text-white">
      <div className="container-site">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <p className="font-ui uppercase tracking-widest text-sm text-orange mb-4">
              What we believe
            </p>
            <h2 className="font-heading text-white">A methodology that defends its own positions</h2>
            <p className="mt-6 text-white/85 text-lg leading-relaxed">
              Most platforms keep their methodology vague. StunpreX commits to specific
              positions — the ones players love, the ones parents argue with, the ones
              academies don&rsquo;t want to hear. They get refined over time. They
              don&rsquo;t get hidden.
            </p>
            <p className="mt-4 text-white/70">
              Thirty-six convictions on what to train and how. Five age-band pathways from
              Discovery to Mastery. A list of anti-patterns we refuse to produce, market,
              or recommend.
            </p>
            <Link href="/blog" className="btn-primary mt-8">
              Browse our articles
            </Link>
          </div>
          <ul className="lg:col-span-7 space-y-6">
            {PREVIEW_PRINCIPLES.map((c) => (
              <li
                key={c.n}
                className="bg-white/5 border border-white/15 rounded-lg p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-heading text-orange text-3xl leading-none">
                    {String(c.n).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-white font-heading mb-2">{c.title}</h3>
                    <p className="text-white/75 text-base leading-relaxed">{c.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
