import Image from 'next/image';

// Section divider — full-bleed brand imagery + a single Codex line.
// Uses the painterly silhouette (no faces, brand-coloured) as a calm visual breath
// between content blocks. Quote sourced from the StunpreX working version (2024) /
// Codex Conviction 1 in plain language.

export function PullQuote() {
  return (
    <section className="relative h-[420px] md:h-[520px] overflow-hidden">
      <Image
        src="/images/youth-development.jpg"
        alt="Young players in motion"
        fill
        quality={80}
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Dark gradient for legibility on top of the green painterly bg */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(7,40,30,0.85) 0%, rgba(7,40,30,0.45) 50%, rgba(7,40,30,0.10) 100%)',
        }}
      />
      <div className="relative h-full container-site flex flex-col justify-center max-w-2xl">
        <p className="font-ui uppercase tracking-widest text-xs text-orange/90 mb-4">
          What StunpreX believes
        </p>
        <p className="font-heading text-white text-3xl md:text-4xl leading-tight">
          Greatness is trained, not born.
        </p>
        <p className="mt-5 text-white/85 text-lg leading-relaxed">
          Roughly ninety percent method and effort, ten percent genetics. The player who
          treats themselves as a beginner-with-potential outdevelops the one who relies on
          talent.
        </p>
        <p className="mt-6 font-ui uppercase tracking-widest text-xs text-white/55">
          — Codex Conviction 1
        </p>
      </div>
    </section>
  );
}
