import type { MetadataRoute } from 'next';
import { getAllPostCards } from '@/lib/posts';
import { getQuestions } from '@/lib/community/queries';

const BASE = 'https://www.stunprex.com';

// Priority / changeFrequency legend:
//   1.0 weekly    — home
//   0.9 daily     — blog index (new posts arrive frequently)
//   0.8 monthly   — blog posts, community posts
//   0.75 weekly   — community index
//   0.7 monthly   — pillar pages with real content (about, codex, methodology)
//   0.5 monthly   — primary audience-hub pages (for-players, for-parents, for-coaches)
//   0.3 yearly    — ComingSoon placeholders, legal pages

type StaticRoute = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
};

const STATIC_ROUTES: StaticRoute[] = [
  // Core
  { path: '/',            priority: 1.0, changeFrequency: 'weekly' },
  { path: '/blog',        priority: 0.9, changeFrequency: 'daily' },
  { path: '/community',   priority: 0.75, changeFrequency: 'weekly' },
  { path: '/about',       priority: 0.7, changeFrequency: 'monthly' },
  { path: '/codex',       priority: 0.7, changeFrequency: 'monthly' },
  { path: '/methodology', priority: 0.7, changeFrequency: 'monthly' },
  // Audience hubs
  { path: '/for-players',  priority: 0.5, changeFrequency: 'monthly' },
  { path: '/for-parents',  priority: 0.5, changeFrequency: 'monthly' },
  { path: '/for-coaches',  priority: 0.5, changeFrequency: 'monthly' },
  // ComingSoon placeholders
  { path: '/pricing',   priority: 0.3, changeFrequency: 'yearly' },
  { path: '/training',  priority: 0.3, changeFrequency: 'yearly' },
  { path: '/games',     priority: 0.3, changeFrequency: 'yearly' },
  { path: '/playbook',  priority: 0.3, changeFrequency: 'yearly' },
  // Legal
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms',   priority: 0.3, changeFrequency: 'yearly' },
  { path: '/imprint', priority: 0.3, changeFrequency: 'yearly' },
  // Blog category pages
  { path: '/blog/category/methodology',     priority: 0.6, changeFrequency: 'monthly' },
  { path: '/blog/category/drills',          priority: 0.6, changeFrequency: 'monthly' },
  { path: '/blog/category/pro-breakdown',   priority: 0.6, changeFrequency: 'monthly' },
  { path: '/blog/category/operational-core',priority: 0.6, changeFrequency: 'monthly' },
  { path: '/blog/category/reflections',     priority: 0.6, changeFrequency: 'monthly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${BASE}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })
  );

  // Dynamic blog post entries — each with its actual lastModified date
  const posts = getAllPostCards();
  const postEntries: MetadataRoute.Sitemap = posts.map(({ frontmatter, slug }) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: new Date(frontmatter.lastModified ?? frontmatter.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Dynamic community question entries — all published questions
  // Fetch up to 1 000; paginated sitemap deferred to v1.1 per §10 brief.
  let questionEntries: MetadataRoute.Sitemap = [];
  // Only query if POSTGRES_URL is present — avoids VercelPostgresError at build time.
  if (process.env.POSTGRES_URL) {
    try {
      const { items } = await getQuestions({ perPage: 1000, sort: 'newest' });
      questionEntries = items.map((q) => ({
        url: `${BASE}/community/${encodeURIComponent(q.slug)}`,
        lastModified: new Date(q.updated_at),
        changeFrequency: 'weekly',
        priority: 0.75,
      }));
    } catch {
      // Non-fatal — skip community entries if DB is unreachable.
    }
  }

  return [...staticEntries, ...postEntries, ...questionEntries];
}
