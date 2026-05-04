import Link from 'next/link';

// Methodology preview — Codex transparency as a credibility asset (Blueprint v2.1 §19).
// Three convictions chosen to be specific, falsifiable, and recognisably StunpreX.
const PREVIEW_CONVICTIONS = [
  {
    n: 4,
    title: 'First touch is the foundation skill.',
    body:
      'Before dribbling, before shooting, before tactics — the receiving touch determines whether anything else is possible. Train it daily, both feet, every surface.',
  },
  {
    n: 5,
    title: 'Scanning is a habit, not a gift.',
    body:
      'Top performers scan substantially more often than the average player. The behaviour is trainable; the habit is what separates them.',
  },
  {
    n: 6,
    title: 'Both feet, or half a player.',
    body:
      'A right-foot-only player is a solved problem at any decent level. Dedicate 30–40% of solo training to the weak foot until it disappears as an asset gap.',
  },
];

export function Methodology() {
  return (
    <section className="py-20 md:py-28 bg-deepblue text-white">
      <div className="container-site">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <p className="font-ui uppercase tracking-widest text-sm text-orange mb-4">
              The Codex — what StunpreX believes
            </p>
            <h2 className="font-heading text-white">A school of thought, published openly</h2>
            <p className="mt-6 text-white/85 text-lg leading-relaxed">
              Most platforms hide their methodology. StunpreX defends its convictions in
              public — the ones players love, the ones parents argue with, and the ones
              academies don&rsquo;t want to hear.
            </p>
            <p className="mt-4 text-white/70">
              Thirty-six convictions. Five age-band pathways. The Player Operating
              Principles. The anti-patterns we reject.
            </p>
            <Link href="/codex" className="btn-primary mt-8">
              Read the Codex
            </Link>
          </div>
          <ul className="lg:col-span-7 space-y-6">
            {PREVIEW_CONVICTIONS.map((c) => (
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
