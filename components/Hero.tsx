import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle backdrop accent — orange + deep blue gradient at low opacity */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          background:
            'radial-gradient(circle at 20% 0%, #FA961C 0%, transparent 40%), radial-gradient(circle at 80% 100%, #107099 0%, transparent 50%)',
        }}
      />
      <div className="container-site py-20 md:py-28 lg:py-36">
        <p className="font-ui uppercase tracking-widest text-sm text-orange mb-5">
          The methodology behind individual development
        </p>
        <h1 className="max-w-4xl font-heading">
          Train Smarter. Play Better.
          <br />
          <span className="text-orange">Reach Your Full Potential.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-lg text-brown/85 leading-relaxed">
          StunpreX is a soccer player development hub built on a public methodology — the
          Codex. Convictions, drills, and pathways for players, parents, and coaches who
          want development that compounds.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/onboarding" className="btn-primary">
            Find your path
          </Link>
          <Link href="/codex" className="btn-secondary">
            Read the Codex
          </Link>
        </div>
        <p className="mt-8 text-sm text-brown/60 italic max-w-2xl">
          “Football greatness is built by deliberate training, disciplined habits, and the
          daily search for the better — practised long enough that ordinary players become
          uncommonly good.”
        </p>
      </div>
    </section>
  );
}
