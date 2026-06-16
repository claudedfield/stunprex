/**
 * StunpreX Drill Library — content layer helpers.
 * Reads MDX drills from /content/drills/. Only 'published' drills appear publicly.
 * All functions are server-only (filesystem access).
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Drill, DrillCard, DrillFrontmatter, CapacityFamily } from './types/drill';

export type { Drill, DrillCard };

const DRILLS_DIR = path.join(process.cwd(), 'content', 'drills');

// ─── Internal helpers ──────────────────────────────────────────────────────────

function parseDrill(slug: string, raw: string): Drill {
  const { data, content } = matter(raw);
  const fm = data as DrillFrontmatter;
  return {
    frontmatter: { ...fm, slug },
    slug,
    source: content,
  };
}

function parseDrillCard(slug: string, raw: string): DrillCard {
  const { data } = matter(raw);
  const fm = data as DrillFrontmatter;
  return {
    frontmatter: { ...fm, slug },
    slug,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────

/** Returns all published drills as DrillCards, sorted by drillId (ascending). */
export function getAllDrillCards(): DrillCard[] {
  if (!fs.existsSync(DRILLS_DIR)) return [];

  const files = fs.readdirSync(DRILLS_DIR).filter((f) => f.endsWith('.mdx'));
  const cards = files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const raw = fs.readFileSync(path.join(DRILLS_DIR, file), 'utf8');
      return parseDrillCard(slug, raw);
    })
    .filter((card) => card.frontmatter.status === 'published');

  return cards.sort((a, b) =>
    (a.frontmatter.drillId ?? '').localeCompare(b.frontmatter.drillId ?? ''),
  );
}

/** Returns a single full drill (with source) by slug. Null if not found or not published. */
export function getDrillBySlug(slug: string): Drill | null {
  const filePath = path.join(DRILLS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  const drill = parseDrill(slug, raw);

  if (drill.frontmatter.status !== 'published') return null;
  return drill;
}

/** Returns all DrillCards with a given capacity in their primary list. */
export function getDrillCardsByCapacity(capacity: CapacityFamily): DrillCard[] {
  return getAllDrillCards().filter((card) =>
    card.frontmatter.capacities.primary.includes(capacity),
  );
}

/** Returns all slugs of published drills (for generateStaticParams). */
export function getAllDrillSlugs(): string[] {
  if (!fs.existsSync(DRILLS_DIR)) return [];
  const files = fs.readdirSync(DRILLS_DIR).filter((f) => f.endsWith('.mdx'));
  return files
    .map((f) => f.replace(/\.mdx$/, ''))
    .filter((slug) => {
      const raw = fs.readFileSync(path.join(DRILLS_DIR, `${slug}.mdx`), 'utf8');
      const { data } = matter(raw);
      return (data as DrillFrontmatter).status === 'published';
    });
}

/** Returns all capacity families that have at least one published drill. */
export function getPublishedCapacities(): CapacityFamily[] {
  const all = getAllDrillCards();
  const set = new Set<CapacityFamily>();
  for (const card of all) {
    for (const cap of card.frontmatter.capacities.primary) {
      set.add(cap);
    }
  }
  return Array.from(set);
}
