import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background image — empty pitch at sunset, no faces, calm and ambitious. */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero-pitch.jpg"
          alt=""
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Gradient overlay so text remains readable across the cinematic image. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(245,250,245,0.96) 0%, rgba(245,250,245,0.86) 35%, rgba(245,250,245,0.50) 60%, rgba(16,112,153,0.10) 100%)',
          }}
        />
      </div>

      <div className="container-site py-24 md:py-32 lg:py-40">
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
        <p className="mt-10 max-w-xl text-sm text-brown/70 italic">
          “Skills and abilities are not born with anyone. They get developed by hard work.”
        </p>
      </div>
    </section>
  );
}
