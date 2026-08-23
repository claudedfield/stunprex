import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';

export const metadata = {
  title: 'About',
  description:
    'What StunpreX is — a methodology-first hub for individual football development, built for the player doing the work, the parent funding it, and the coach multiplying it across a squad.',
};

export default function Page() {
  return (
    <>
      <Header />
      <main id="main-content">
        <PageHero
          eyebrow="About"
          title="What StunpreX is"
          lede="A methodology-first hub for individual football development — built for the player doing the work, the parent funding it, and the coach multiplying it across a squad."
        />

        {/* Opening */}
        <section className="container-site py-14 md:py-16 border-b border-deepblue/10">
          <p className="max-w-3xl text-brown/85 text-lg leading-relaxed">
            Football asks for much more than technique. A player reads a situation before the
            ball arrives, decides under time pressure, executes with the body, talks to the
            people around them, handles the feeling of failing in front of others, and adapts
            when the game changes shape mid-match. Most training addresses one of those.
            StunpreX is built to develop all of them, deliberately, across years rather than
            seasons.
          </p>
        </section>

        {/* How the methodology is put together */}
        <section className="container-site py-14 md:py-20 border-b border-deepblue/10">
          <h2 className="font-heading text-deepblue mb-8">
            How the methodology is put together
          </h2>
          <div className="max-w-3xl space-y-6 text-brown/85 text-lg leading-relaxed">
            <p>
              <strong className="font-semibold text-brown">Six trained capacities</strong> — perceptual,
              cognitive, motor, communication, affective, adaptive — name what a drill actually
              exercises. Every drill here is tagged with the ones it builds, so training can be
              aimed instead of accumulated.
            </p>
            <p>
              <strong className="font-semibold text-brown">Five age-band pathways</strong>, from 5–8
              through 21+, each with its own developmental priority. A nine-year-old and a
              sixteen-year-old are not doing smaller and larger versions of the same session.
            </p>
            <p>
              <strong className="font-semibold text-brown">On-pitch operating principles</strong> for
              the decisions that recur every match: on the ball, off it, defending, in
              transition.
            </p>
            <p>
              <strong className="font-semibold text-brown">A published list of what we refuse to build
              around</strong> — because a methodology unwilling to say what it rejects is not
              saying very much.
            </p>
          </div>
        </section>

        {/* What we refuse, and why */}
        <section className="container-site py-14 md:py-20 border-b border-deepblue/10">
          <h2 className="font-heading text-deepblue mb-8">What we refuse, and why</h2>
          <div className="max-w-3xl space-y-6 text-brown/85 text-lg leading-relaxed">
            <p>
              We do not lock a child into a position. Specialisation before the body has
              finished arriving costs more than it returns, so positions rotate — including
              inside matches — and the foundations stay universal.
            </p>
            <p>
              We do not run talent identification. Sorting children by how they look at eleven
              mistakes an early growth spurt for a ceiling, and quietly discards the late
              developer who would have been better at twenty.
            </p>
            <p>
              We do not manufacture urgency. No countdown timers, no vanishing places, no
              telling parents their child is running out of time. Development does not work on
              that clock, and neither does honest work.
            </p>
            <p>
              We do not invent evidence. Where research supports a claim we say so; where it is
              thin or contested we say that instead. Some of what matters most in development
              cannot be measured well yet, and pretending otherwise would be the easier, worse
              choice.
            </p>
          </div>
        </section>

        {/* Who it is for */}
        <section className="container-site py-14 md:py-20 border-b border-deepblue/10">
          <h2 className="font-heading text-deepblue mb-8">Who it is for</h2>
          <div className="max-w-3xl space-y-6 text-brown/85 text-lg leading-relaxed">
            <p>
              <strong className="font-semibold text-brown">Players</strong>, at every age band — from
              first touches to the edge of the professional game.
            </p>
            <p>
              <strong className="font-semibold text-brown">Parents</strong>, who fund the years and
              carry the doubt, and who deserve something better than being sold to.
            </p>
            <p>
              <strong className="font-semibold text-brown">Coaches</strong>, who multiply whatever they
              understand across everyone they work with.
            </p>
            <p>
              <strong className="font-semibold text-brown">Anyone thinking seriously</strong> about how
              footballers actually develop.
            </p>
            <p>
              StunpreX is gender-neutral by design. The methodology does not change by who is
              training.
            </p>
          </div>
        </section>

        {/* Where this stands today */}
        <section className="container-site py-14 md:py-20">
          <h2 className="font-heading text-deepblue mb-8">Where this stands today</h2>
          <div className="max-w-3xl space-y-6 text-brown/85 text-lg leading-relaxed">
            <p>
              Early, and openly so. The drill library and the training games are live and free
              to use, the community is open, and the methodology itself is in revision — the
              current pass will be published when it is finished, not before.
            </p>
            <p>
              Pricing is not set. Putting numbers against a product still taking shape would be
              a promise we cannot yet keep.
            </p>
            <p>English is the working language, with selected pieces in Spanish.</p>
          </div>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/methodology" className="btn-primary">
              See what we believe
            </Link>
            <Link href="/training" className="btn-secondary">
              Browse the drill library
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
