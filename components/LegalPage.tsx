import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageHero } from './PageHero';

/**
 * LegalPage — shared shell for /imprint, /privacy, /cookies, /terms.
 *
 * One <h1> per page (rendered by PageHero); every heading inside `children`
 * is an <h2>. The "Last updated" date is a semantic <time> element so the
 * date is machine-readable, not just visible — legal pages are expected to
 * state when they last changed.
 *
 * Prose styling is applied here rather than per-page so all four read
 * identically; the arbitrary-variant selectors mirror the pattern already
 * used on the drill detail page.
 */
export interface LegalPageProps {
  /** The page H1. */
  title: string;
  /** ISO date (YYYY-MM-DD) this text last changed. */
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  const formatted = new Date(`${lastUpdated}T00:00:00Z`).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <>
      <Header />
      <main id="main-content">
        <PageHero eyebrow="Legal" title={title}>
          <p className="font-ui text-sm text-brown/60">
            Last updated:{' '}
            <time dateTime={lastUpdated} className="tabular-nums">
              {formatted}
            </time>
          </p>
        </PageHero>

        <section className="container-site py-14 md:py-20">
          <div
            className="max-w-3xl font-body text-brown/85 leading-relaxed space-y-6
              [&_h2]:font-heading [&_h2]:text-deepblue [&_h2]:text-xl [&_h2]:mt-10 [&_h2]:mb-3
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2
              [&_li]:text-brown/85
              [&_strong]:font-semibold [&_strong]:text-brown
              [&_a]:text-deepblue [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-orange"
          >
            {children}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
