import type { ReactNode } from 'react';

/**
 * PageHero — the unified hero standard for every secondary page.
 *
 * The home page keeps its own cinematic `Hero` (full-bleed image, two CTAs);
 * that distinction is intentional — a landing hero is not an interior hero.
 * Every OTHER top-level page uses this component so padding, eyebrow style,
 * heading colour, lede treatment and alignment are identical across the site.
 *
 * Standard (locked):
 *  - vertical rhythm: py-16 md:py-20
 *  - subtle tinted band by default (border-b + bg-deepblue/[0.02]) to separate hero from body
 *  - eyebrow: font-ui, uppercase, tracking-widest, text-sm, text-orange, mb-3
 *  - h1: font-heading, text-deepblue, max-w-3xl
 *  - lede: text-lg, text-brown/80, font-body, max-w-2xl, mt-6
 */
export interface PageHeroProps {
  /** Small uppercase label above the title (optional). */
  eyebrow?: string;
  /** The H1. String or rich nodes. */
  title: ReactNode;
  /** Supporting sentence(s) under the title (optional). */
  lede?: ReactNode;
  /** CTAs or extra content rendered under the lede (optional). */
  children?: ReactNode;
  /** Subtle tinted band + bottom border. Default true. */
  tinted?: boolean;
}

export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  tinted = true,
}: PageHeroProps) {
  return (
    <section
      className={
        tinted ? 'border-b border-deepblue/8 bg-deepblue/[0.02]' : undefined
      }
    >
      <div className="container-site py-16 md:py-20">
        {eyebrow ? (
          <p className="font-ui text-sm uppercase tracking-widest text-orange mb-3">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-deepblue max-w-3xl">{title}</h1>
        {lede ? (
          <p className="mt-6 max-w-2xl text-lg text-brown/80 font-body leading-relaxed">
            {lede}
          </p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
