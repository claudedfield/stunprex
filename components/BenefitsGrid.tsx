// Four benefits — rewritten against Codex convictions per Build Plan §A.3.
// "Capacity-tagged training" replaces "Personalised Training Plans" until AI personalisation actually ships.

const BENEFITS = [
  {
    title: 'Capacity-tagged training',
    body:
      'Every drill names the human capacities it builds — perceptual, cognitive, motor, communication, affective, adaptive. Train what you actually need.',
  },
  {
    title: 'A defended methodology',
    body:
      'Thirty-six convictions, five age-band pathways, and an anti-pattern list — published openly. The brand is its source code.',
  },
  {
    title: 'Process, not promises',
    body:
      'No fake testimonials. No countdown timers. No selling vapor. Progress is what gets measured, not what gets marketed.',
  },
  {
    title: 'Built for the long game',
    body:
      'For 13–24 players, the parents who fund them, and the coaches who multiply them. Designed to compound over years, not impress in weeks.',
  },
] as const;

export function BenefitsGrid() {
  return (
    <section className="py-20 md:py-28 bg-white border-y border-deepblue/10">
      <div className="container-site">
        <div className="max-w-2xl mb-14">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            What StunpreX offers
          </p>
          <h2 className="font-heading">Why StunpreX</h2>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {BENEFITS.map((item, idx) => (
            <li key={item.title} className="relative">
              <span className="font-heading text-orange/40 text-5xl absolute -top-2 -left-1 leading-none select-none">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="relative pt-7">
                <h3 className="text-deepblue mb-3 text-xl font-heading">{item.title}</h3>
                <p className="text-brown/85 text-base leading-relaxed">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
