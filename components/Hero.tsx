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
          Develop the player, not the position.
        </h1>
        <p className="mt-7 max-w-2xl text-lg text-brown/85 leading-relaxed">
          Individual soccer player development on a long horizon. Built on a methodology that
          develops the whole player — perceptual, cognitive, motor, communication, affective,
          adaptive — not the slot they happen to play.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/community" className="btn-primary">
            Join the community
          </Link>
          <Link href="/blog" className="btn-secondary">
            Read the blog
          </Link>
        </div>
        <p className="mt-10 max-w-xl text-sm text-brown/70 italic">
          “Skills and abilities are not born with anyone. They get developed by hard work.”
        </p>
      </div>
    </section>
  );
}
