import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Methodology — What We Believe About Football Development',
  description:
    'StunpreX is built on a single conviction: football greatness is trained, not born. Here is what we believe, how we train, and what we reject.',
  alternates: { canonical: 'https://stunprex.com/methodology' },
};

const beliefs: { title: string; body: string[] }[] = [
  {
    title: 'Greatness is earned',
    body: [
      `Popular coaching culture is full of talent mythology. "He was born for this." "She's a natural." These stories feel true because the players they describe are extraordinary. But they confuse the evidence.`,
      `What looks like natural talent is, overwhelmingly, early and deliberate development — sometimes years of unstructured street play that an observer mistook for 'just playing', sometimes a young player who started earlier or worked harder than those around them. Mainly physical characteristics are inherited: height, a predisposition toward fast-twitch muscle fibres, baseline lung capacity. What people call talent — the clean first touch, the scanning habit, the ability to read a situation before the ball arrives — is earned.`,
      `This matters because it changes what training is for. If talent is a fixed quantity, you sort players. If greatness is trained, you develop them.`,
      `StunpreX trains as if the next decade is what matters.`,
    ],
  },
  {
    title: 'First touch is the foundation',
    body: [
      `Before dribbling. Before shooting. Before tactics. The way a player receives the ball determines whether anything else is possible.`,
      `A clean receiving touch buys time, creates space, and protects the quality of every action that follows. A poor first touch makes average opponents into good ones and turns good situations into scrambles. Most of what a player does in possession is downstream of how cleanly they receive the ball.`,
      `That is why StunpreX training returns to the receiving touch constantly — both feet, every surface, from age eight onwards. The foundation does not get boring. The foundation gets better, and when it gets better, everything else improves with it.`,
    ],
  },
  {
    title: 'Scanning is a learnable habit',
    body: [
      `Studies of how elite midfielders use their eyes in match conditions consistently show the same finding: top performers scan substantially more often than average players. They look away from the ball in the seconds before it arrives. They build a picture of what is around them before the ball reaches their feet.`,
      `This habit is trainable. It is not a perceptual gift that some players are born with. The player who scans deliberately — at first prompted, eventually unconscious — arrives at the ball with a decision already forming. The player who doesn't arrives at the ball having to look for the first time, a fraction too late.`,
      `Introduce scanning deliberately from around age nine. Build it through cues at first. Chase the point where the cue disappears because the habit is already there.`,
    ],
  },
  {
    title: 'Both feet, or half a player',
    body: [
      `A player who cannot use their left foot is a solved problem at any decent level of the game. Defenders learn to push them onto it. Opposition midfielders learn to press the space that forces it. The one-footed player is predictable, and predictability limits what they can do.`,
      `StunpreX training dedicates a meaningful, protected share of solo practice time to the weak foot — at a rough ratio of about a third — until it stops being a gap. The exact proportion matters less than the principle: the weak foot has a protected training slot, not a reluctant occasional attempt. Two-footed is the floor, not the ceiling.`,
    ],
  },
  {
    title: 'Free play built the greats — protect it',
    body: [
      `Think about the environments that produced football's most creative players. Brazilian streets. Dutch backyards. Argentine potreros.`,
      `Unstructured play creates pattern recognition and adaptive problem-solving that no drill can fully replicate. Children playing freely invent their own rules, manage their own conflicts, experiment with their own solutions. They are not being coached; they are teaching themselves.`,
      `A development environment that fills every available minute with structured sessions is not giving players more. It is taking away something the structured sessions cannot replace.`,
      `Schedule free play like a session. Protect it from the instinct to turn it into something more organised.`,
    ],
  },
  {
    title: 'Develop the player, not the position',
    body: [
      `Until around age 14, no player should be locked into a defined position. Not the goalkeeper who "can't play outfield." Not the centre-back who "isn't technical enough" for midfield. Not the striker who "doesn't need to defend."`,
      `Position specialisation before the foundations are universal produces narrow players. A player who has only ever played right back has not developed — they have practised a limited subset of football. They will encounter situations their position has not prepared them for, and they will be exposed.`,
      `Rotate positions through training. Rotate through matches where possible. Let players experience the whole game from multiple vantage points before settling into one. Preferences emerge naturally, and they are more honest when they emerge from experience rather than early designation.`,
      `Specialisation from around age 14 is appropriate, when universal foundations are in place. Before that, the position is a cage the player doesn't need yet.`,
    ],
  },
  {
    title: 'Process before outcome',
    body: [
      `Wins and goals are lagging indicators. They tell you something, but they lie on bad days and on lucky days. They reward fortune alongside quality. They punish quality alongside misfortune. They are real — competition matters, winning matters — but they are not the metric of development.`,
      `The leading indicators are the repetitions: scanning moments, weak-foot touches, quality receptions, decision moments under pressure, sessions completed, habits maintained. These are the things the player can repeat regardless of the scoreline. They compound.`,
      `Track what you can repeat. The outcomes follow when the process is sustained.`,
    ],
  },
];

const capacities: { name: string; body: string }[] = [
  {
    name: 'Perceptual',
    body: `What the player can see, hear, feel, and infer. Scanning. Spatial awareness. Pattern recognition. Anticipation of the ball's trajectory and the opponent's intent.`,
  },
  {
    name: 'Cognitive',
    body: `What the player decides and regulates mentally. Decision-making under time and constraint. Working memory. Selective attention. Inhibition — the capacity to not do the obvious thing when the situation calls for something else.`,
  },
  {
    name: 'Motor',
    body: `What the player can physically do. Ball mastery. Balance. Speed and agility. Power. Technical execution with both feet, across every surface.`,
  },
  {
    name: 'Communication',
    body: `How the player coordinates with others. Verbal calls. Listening through the noise of play. Non-verbal signals. The timing of collective action.`,
  },
  {
    name: 'Affective',
    body: `How the player feels and sustains mentally. Composure under pressure. Post-mistake recovery. Confidence built from evidence. Joy in the game — foundational, not optional. Without joy, all the other capacities atrophy.`,
  },
  {
    name: 'Adaptive',
    body: `How the player handles novelty and surprise. Composure when something unexpected happens. Extracting a lesson from failure. Transferring skills across surfaces, formats, and opponent types.`,
  },
];

const rejects: { title: string; body: string }[] = [
  {
    title: 'Early specialisation pressure',
    body: `Football year-round before age 12–13 narrows motor diversity, increases injury risk, and accelerates burnout. The evidence for this is strong. Multi-sport development, broadly defined, builds the adaptive foundation that single-sport overload cannot.`,
  },
  {
    title: 'Position-locking in childhood',
    body: `The child designated as a goalkeeper at age 8 is not a goalkeeper by nature; they are a child who has been put in a position and told to stay there.`,
  },
  {
    title: 'Talent-spotting culture',
    body: `Selecting 9-year-olds as future professionals, discarding late developers, and building development programmes around picking winners rather than developing players are errors at the level of the premise. Talent is earned. The late developer is as real as the early one. Selection at U11 predicts nothing useful about a player at 22.`,
  },
  {
    title: 'Coaching that stops creativity',
    body: `"Don't try that." This is among the most expensive sentences in youth football. The creative attempt, the failed skill, the risky pass that doesn't come off — this is development. The player who is never allowed to fail is never allowed to learn.`,
  },
  {
    title: 'Pressure that destroys joy',
    body: `Players under chronic pressure — from coaches, from parents, from their own expectations — rarely visibly quit. Their quality quietly drops. The joy disappears, often during adolescence, often misread as a plateau or a focus problem. Once joy is gone, it takes years to rebuild. Watch for this signal more carefully than any technical or tactical one.`,
  },
  {
    title: 'Fabricated certainty',
    body: `The Codex makes claims about how players develop. Every claim carries an obligation: to have evidence for it, or to say plainly where the evidence is weak. Numbers circulate widely in coaching culture — exact session lengths, precise scanning frequencies, guaranteed rep counts — that trace back to nothing. StunpreX names what the evidence supports, acknowledges where it is weak or absent, and refuses to invent confidence it does not have.`,
  },
];

export default function MethodologyPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <PageHero
          eyebrow="Methodology"
          title="The Methodology"
          lede="StunpreX is built on one conviction above all others: football greatness is trained, not born. This is the plain-language version of what we believe — the ideas behind every drill, every article, and every coaching answer on this platform."
        />

        {/* What we believe */}
        <section className="container-site py-14 md:py-20 border-b border-deepblue/10">
          <h2 className="font-heading text-deepblue mb-10">What we believe</h2>
          <div className="space-y-12 max-w-3xl">
            {beliefs.map((b) => (
              <div key={b.title}>
                <h3 className="font-heading text-deepblue text-xl mb-3">{b.title}</h3>
                <div className="space-y-4 text-brown/85 text-lg leading-relaxed">
                  {b.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* The six capacities */}
        <section className="container-site py-14 md:py-20 border-b border-deepblue/10">
          <h2 className="font-heading text-deepblue mb-4">The six capacities</h2>
          <p className="max-w-3xl text-brown/85 text-lg leading-relaxed mb-10">
            Every player, in every moment of a match, is expressing a combination of human
            capacities — not just physical ones. StunpreX training develops six families of
            capacity simultaneously, because the game demands them simultaneously.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {capacities.map((c) => (
              <div
                key={c.name}
                className="rounded-xl border border-deepblue/12 bg-deepblue/[0.02] p-6"
              >
                <h3 className="font-ui uppercase tracking-widest text-sm text-orange mb-2">
                  {c.name}
                </h3>
                <p className="text-brown/85 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
          <p className="max-w-3xl text-brown/85 text-lg leading-relaxed mt-10">
            The most valuable drills layer these capacities deliberately. A drill that adds a
            decision requirement to a technical exercise trains three families in the time it
            used to train one. A drill that builds in a communication constraint while the
            technique is under pressure trains five. This is the design principle behind every
            drill in the <Link href="/training">StunpreX library</Link>.
          </p>
        </section>

        {/* What we reject */}
        <section className="container-site py-14 md:py-20 border-b border-deepblue/10">
          <h2 className="font-heading text-deepblue mb-4">What we reject</h2>
          <p className="max-w-3xl text-brown/85 text-lg leading-relaxed mb-10">
            Football development culture contains patterns so common they feel normal. They are
            not normal. They are errors — sometimes well-intentioned errors — that cap
            development, cause harm, and waste the critical years.
          </p>
          <div className="space-y-8 max-w-3xl">
            {rejects.map((r) => (
              <div key={r.title}>
                <h3 className="font-heading text-deepblue text-lg mb-2">{r.title}</h3>
                <p className="text-brown/85 text-lg leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The single sentence */}
        <section className="container-site py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="font-heading text-deepblue text-2xl leading-snug">
              StunpreX believes football greatness is built by deliberate training, disciplined
              habits, and the daily search for the better — practised long enough that ordinary
              players become uncommonly good.
            </p>
            <p className="mt-6 text-brown/85 text-lg leading-relaxed">
              This is the school of thought. Every drill, every article, every coaching answer
              on this platform traces back to it.
            </p>
            <p className="mt-8 text-brown/70 italic leading-relaxed">
              The full methodology — all thirty-six convictions, the age-band pathways, and the
              anti-patterns — is documented in the Codex. It is open: the ideas StunpreX defends
              in public, the evidence grades we assign to our own claims, and the errors we
              refuse to repeat.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/codex" className="btn-primary">
                Read the Codex
              </Link>
              <Link href="/training" className="btn-secondary">
                See the drills
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
