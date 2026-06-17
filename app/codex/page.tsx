import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';

export const metadata = {
  title: 'Codex',
  description:
    'The StunpreX Codex — thirty-six convictions, five age-band pathways, and the anti-patterns we reject. The methodology, published openly.',
};

const PARTS = [
  { n: 'I',   title: 'The Manifesto',                  body: 'Thirty-six convictions on how individual football players develop. What to train, how to train, the player as a whole, the lifestyle around the work.' },
  { n: 'II',  title: 'The Capacities Framework',       body: 'Six families of human capacity — perceptual, cognitive, motor, communication, affective, adaptive — that name the substrate every drill exercises.' },
  { n: 'III', title: 'The Age-Band Pathways',          body: 'Five bands — 5–8 Discovery, 9–12 Foundation, 13–16 Development, 17–20 Specialisation, 21+ Mastery. Each with a defining principle and what to train.' },
  { n: 'IV',  title: 'The Player Operating Principles', body: 'On the ball, off the ball, defending, in transition, universal. The on-pitch heuristics, plus the operational core (Parent Compact, Sleep, Nutrition, Deselection, Goalkeeping…).' },
  { n: 'V',   title: 'The Anti-Patterns',              body: 'The cross-cutting errors in youth football culture the Codex was written against. Named openly. Defended in public.' },
];

export default function Page() {
  return (
    <>
      <Header />
      <main id="main-content">
        <PageHero
          eyebrow="The Codex — Version 0.7.1 · May 2026"
          title={<>The worldview &amp; methodology of individual football development</>}
          lede={<>Every great development brand is recognisable first by its convictions, second by its drills. La Masia, Coerver, Ajax&rsquo;s Total Football &mdash; each is a school of thought before it is a curriculum. This is StunpreX&rsquo;s.</>}
        >
          <p className="max-w-2xl text-brown/70 font-body">
            The Codex is the source code of the brand. The source code is open.
          </p>
        </PageHero>

        <section className="container-site py-12 md:py-20 border-t border-deepblue/15">
          <h2 className="font-heading mb-12">Five parts</h2>
          <ul className="space-y-10">
            {PARTS.map((p) => (
              <li key={p.n} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-2">
                  <span className="font-heading text-orange text-5xl leading-none">
                    Part&nbsp;{p.n}
                  </span>
                </div>
                <div className="md:col-span-10">
                  <h3 className="font-heading text-deepblue mb-2">{p.title}</h3>
                  <p className="text-brown/85 text-base leading-relaxed max-w-prose">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="container-site py-16 border-t border-deepblue/15">
          <p className="text-brown/85 italic max-w-prose text-lg">
            “Football greatness is built by deliberate training, disciplined habits, and the
            daily search for the better — practised long enough that ordinary players become
            uncommonly good.”
          </p>
          <p className="mt-3 font-ui uppercase tracking-widest text-xs text-brown/60">
            — Codex closing line
          </p>
          <div className="mt-10">
            <Link href="/" className="btn-primary">Back to home</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
