import type { MetadataRoute } from 'next';
import { getAllPostCards } from '@/lib/posts';
import { getAllDrillSlugs } from '@/lib/drills';
import { getQuestions } from '@/lib/community/queries';
import { SEED_QUESTIONS } from '@/lib/community/seed';
import { GAMES } from '@/lib/games/registry';
import { ALL_CATEGORIES } from '@/lib/types/community';

const STATIC_ROUTES = [
  '/',
  '/blog',
  '/training',
  '/games',
  '/community',
  '/capacities',
  '/pricing',
  '/about',
  '/codex',
  '/methodology',
  // Blog category pages
  '/blog/category/methodology',
  '/blog/category/drills',
  '/blog/category/pro-breakdown',
  '/blog/category/operational-core',
  '/blog/category/reflections',
];

const CAPACITY_SLUGS = [
  'perceptual',
  'cognitive',
  'motor',
  'communication',
  'affective',
  'adaptive',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `https://stunprex.com${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/blog' ? 0.9 : 0.7,
  }));

  // Capacity family pages
  const capacityEntries: MetadataRoute.Sitemap = CAPACITY_SLUGS.map((slug) => ({
    url: `https://stunprex.com/capacities/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Live game pages
  const gameEntries: MetadataRoute.Sitemap = GAMES.filter((g) => g.status === 'live').map((g) => ({
    url: `https://stunprex.com/games/${g.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Drill detail pages
  const drillEntries: MetadataRoute.Sitemap = getAllDrillSlugs().map((slug) => ({
    url: `https://stunprex.com/training/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Community category pages
  const communityCategoryEntries: MetadataRoute.Sitemap = ALL_CATEGORIES.map((cat) => ({
    url: `https://stunprex.com/community/category/${cat}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  // Dynamic blog post entries — each with its actual lastModified date
  const posts = getAllPostCards();
  const postEntries: MetadataRoute.Sitemap = posts.map(({ frontmatter, slug }) => ({
    url: `https://stunprex.com/blog/${slug}`,
    lastModified: new Date(frontmatter.lastModified ?? frontmatter.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Curated seed community questions — always present (static, no DB needed).
  const seedSlugs = new Set(SEED_QUESTIONS.map((q) => q.slug));
  const seedQuestionEntries: MetadataRoute.Sitemap = SEED_QUESTIONS.map((q) => ({
    url: `https://stunprex.com/community/${encodeURIComponent(q.slug)}`,
    lastModified: new Date(q.updated_at),
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  // Dynamic community question entries (real user Q&A) — only if DB reachable at build.
  let dbQuestionEntries: MetadataRoute.Sitemap = [];
  if (process.env.POSTGRES_URL) {
    try {
      const { items } = await getQuestions({ perPage: 1000, sort: 'newest' });
      dbQuestionEntries = items
        .filter((q) => !seedSlugs.has(q.slug))
        .map((q) => ({
          url: `https://stunprex.com/community/${encodeURIComponent(q.slug)}`,
          lastModified: new Date(q.updated_at),
          changeFrequency: 'weekly',
          priority: 0.75,
        }));
    } catch {
      // Non-fatal — skip DB-backed entries if unreachable.
    }
  }

  return [
    ...staticEntries,
    ...capacityEntries,
    ...gameEntries,
    ...drillEntries,
    ...communityCategoryEntries,
    ...postEntries,
    ...seedQuestionEntries,
    ...dbQuestionEntries,
  ];
}
