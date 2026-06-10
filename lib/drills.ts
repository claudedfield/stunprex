// StunpreX drill library — content layer helpers
// Reads MDX drills from /content/drills/. Only 'published' status drills appear publicly.
// All functions are server-only (filesystem access).

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Drill, DrillCard, DrillFrontmatter } from './types/drill';
export type { Drill, DrillCard };

const DRILLS_DIR = path.join(process.cwd(), 'content', 'drills');

// ─── Internal helpers ──────────────────────────────────────────────────────────

function parseDrill(slug: string, raw: string): Drill {
  const { data, content } = matter(raw);
  const fm = data as DrillFrontmatter;
  return {
    frontmatter: {
      ...fm,
      slug,
      lastModified: fm.lastModified ?? fm.date,
    },
    slug,
    source: content,
  };
}

function parseDrillCard(slug: string, raw: string): DrillCard {
  const { data } = matter(raw);
  const fm = data as DrillFrontmatter;
  return {
    frontmatter: {
      ...fm,
      slug,
      lastModified: fm.lastModified ?? fm.date,
    },
    slug,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────

/** Returns all published drills as DrillCards, sorted by drillId ascending. */
export function getAllDrillCards(): DrillCard[] {
  if (!fs.existsSync(DRILLS_DIR)) return [];

  const files = fs.readdirSync(DRILLS_DIR).filter((f) => f.endsWith('.mdx'));
  const cards = files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const raw = fs.readFileSync(path.join(DRILLS_DIR, file), 'utf8');
      return parseDrillCard(slug, raw);
    })
    .filter((d) => d.frontmatter.status === 'published')
    .sort((a, b) => a.frontmatter.drillId.localeCompare(b.frontmatter.drillId));

  return cards;
}

/** Returns a single drill by slug, or null if not found / not published. */
export function getDrill(slug: string): Drill | null {
  const filePath = path.join(DRILLS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  const drill = parseDrill(slug, raw);
  if (drill.frontmatter.status !== 'published') return null;
  return drill;
}

/** Returns all published slugs — used for generateStaticParams. */
export function getAllDrillSlugs(): string[] {
  return getAllDrillCards().map((d) => d.slug);
}

/** Returns published DrillCards whose capacity arrays include the given family. */
export function getDrillsByCapacity(family: string): DrillCard[] {
  return getAllDrillCards().filter((d) => {
    const { primary, secondary } = d.frontmatter.codexAnchors.capacities
    return (
      (Array.isArray(primary) ? primary : [primary]).includes(family) ||
      (Array.isArray(secondary) ? secondary : secondary ? [secondary] : []).includes(family)
    )
  })
}

/** Returns published DrillCards whose ageBand includes the given band string (en-dash form). */
export function getDrillsByAgeBand(bandMatch: string): DrillCard[] {
  return getAllDrillCards().filter((d) => {
    const { introducible, central, maintenance } = d.frontmatter.ageBand
    return (
      introducible?.includes(bandMatch) ||
      central?.includes(bandMatch) ||
      maintenance?.includes(bandMatch)
    )
  })
}
