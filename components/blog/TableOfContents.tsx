'use client';
// TableOfContents — auto-generated from H2/H3 headings. Renders for posts ≥ 1,200 words.
// Active heading highlighted as the reader scrolls.
// extractHeadings/slugify live in lib/toc.ts (server-safe) — a client module may not
// export a function the server calls.
import { useEffect, useRef, useState } from 'react';
import type { Heading } from '@/lib/toc';

interface Props {
  headings: Heading[];
}

export function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!headings.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="rounded-lg border border-deepblue/12 bg-white/60 p-5 text-sm"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-deepblue/50 font-ui">
        Contents
      </p>
      <ol className="space-y-1.5">
        {headings.map(({ id, text, level }) => (
          <li key={id} className={level === 3 ? 'pl-3' : ''}>
            <a
              href={`#${id}`}
              className={`block rounded px-2 py-1 transition-colors leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1 ${
                activeId === id
                  ? 'bg-orange/10 text-orange font-semibold'
                  : 'text-brown/65 hover:text-deepblue'
              }`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

