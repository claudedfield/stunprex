// Server-safe table-of-contents helpers.
// extractHeadings() is called from the server (blog post page) to build the TOC,
// so it must live outside any 'use client' module — Next forbids calling a
// client-exported function from the server.

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Slugify heading text into an anchor id. Must match the id MDX headings render with. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/** Extract H2/H3 headings from MDX source string — called server-side. */
export function extractHeadings(source: string): Heading[] {
  const lines = source.split('\n');
  const headings: Heading[] = [];

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);

    if (h2) {
      const text = h2[1].replace(/[*_`]/g, '').trim();
      headings.push({ id: slugify(text), text, level: 2 });
    } else if (h3) {
      const text = h3[1].replace(/[*_`]/g, '').trim();
      headings.push({ id: slugify(text), text, level: 3 });
    }
  }

  return headings;
}
