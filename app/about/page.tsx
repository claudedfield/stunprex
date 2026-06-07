import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description:
    'StunpreX is a methodology-first soccer player development hub by DField Kft. — free, long-horizon, deliberately not engagement-bait.',
  openGraph: {
    title: 'About — StunpreX',
    description:
      'StunpreX is a methodology-first soccer player development hub by DField Kft. — free, long-horizon, deliberately not engagement-bait.',
    url: 'https://www.stunprex.com/about',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About — StunpreX',
    description:
      'StunpreX is a methodology-first soccer player development hub by DField Kft. — free, long-horizon, deliberately not engagement-bait.',
  },
};

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <section className="container-site py-20 md:py-28 max-w-3xl">
          {/* Eyebrow + H1 */}
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            About
          </p>
          <h1 className="font-heading">The thinking behind the methodology</h1>

          {/* Section 1 — opening */}
          <div className="mt-8 space-y-6 text-brown/85 text-lg leading-relaxed">
            <p>
              StunpreX is a digital business built on individual football player development.
              A methodology-first hub for the player, the parent, the coach, and the wider
              football community. The mission is to help any party involved in a player&apos;s
              development serve that player at the highest level, on a long horizon, without
              the routine harms of modern youth football.
            </p>
          </div>

          {/* Section 2 */}
          <div className="mt-12">
            <h2 className="font-heading">Football is more than the sum of its drills</h2>
            <div className="mt-6 space-y-6 text-brown/85 text-lg leading-relaxed">
              <p>
                Football is a multidimensional human activity — intelligence, perception,
                creativity, discipline, emotion, adaptability, decision-making, technical
                mastery, social interaction, and character, all combined under constantly
                changing conditions.
              </p>
              <p>
                The player is developed as a whole. The lifestyle around the work matters as
                much as the work. Mental, physical, technical, tactical, social, emotional —
                none of these is the answer; all of them are the substrate.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="mt-12">
            <h2 className="font-heading">What we believe</h2>
            <div className="mt-6 space-y-6 text-brown/85 text-lg leading-relaxed">
              <p>These are the values that govern every drill, every article, every decision:</p>
              <ul className="mt-2 space-y-3 list-none pl-0">
                {[
                  'Long-term development over short-term success.',
                  'Understanding over memorization.',
                  'Intelligent adaptation over rigid automation.',
                  'Discipline over hype.',
                  'Creativity over mechanical repetition.',
                  'Efficient multi-capacity training over isolated single-purpose work.',
                  'Sustainable growth over early specialization or external pressure.',
                ].map((item) => (
                  <li key={item} className="flex items-baseline gap-3 text-brown/85 text-lg leading-relaxed">
                    <span className="text-orange shrink-0 select-none font-semibold">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Football emerges through experience, guided learning, environmental influence,
                self-awareness, reflection, and long-term developmental processes — many of
                which cannot yet be measured numerically. We name them anyway.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="mt-12">
            <h2 className="font-heading">What we refuse</h2>
            <div className="mt-6 space-y-6 text-brown/85 text-lg leading-relaxed">
              <p>
                The brand refuses to produce, evaluate-pass, or recommend: clickbait
                headlines, fake testimonials, manipulative urgency, fearmongering at parents,
                premium-luxury positioning, fabricated statistics, early position-locking
                before age 14, talent-spotting culture, and the algorithmic engagement-bait
                tone that dominates so much of football content online.
              </p>
              <p>
                These are gates, not aspirations. We hold them at the editorial layer, not
                in willpower.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="mt-12">
            <h2 className="font-heading">How we work</h2>
            <div className="mt-6 space-y-6 text-brown/85 text-lg leading-relaxed">
              <p>
                StunpreX runs lean and methodology-first. The work — articles, drills, analysis,
                evaluation — passes through a system designed to hold the same quality bar at every
                piece. The brand refuses the patterns of high-volume content businesses: engagement-bait,
                fabricated statistics, premium-luxury positioning, the pressure to publish more rather
                than publish better.
              </p>
              <p>
                What that means for you: every drill traces to a defended principle. Every article cites
                sources or removes the claim. Every recommendation passes through gates designed to catch
                the things willpower alone misses. The discipline is structural, not aspirational.
              </p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="mt-12">
            <h2 className="font-heading">Why this is free</h2>
            <div className="mt-6 space-y-6 text-brown/85 text-lg leading-relaxed">
              <p>
                Foundational methodology content on StunpreX is free, not as a funnel and
                not as a marketing tactic. The brand is built around an affordability stance:
                serious player development should be accessible to every serious young player,
                anywhere — regardless of family income, club tier, or country.
              </p>
              <p>
                That stance is not a feature. It&apos;s the reason the project exists.
              </p>
            </div>
          </div>

          {/* CTA block */}
          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/community" className="btn-primary">
              Join the community
            </Link>
            <Link href="/blog" className="btn-secondary">
              Read the latest articles
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
