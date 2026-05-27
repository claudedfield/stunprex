import type { MetadataRoute } from 'next';
import { getAllPostCards } from '@/lib/posts';
import { getQuestions } from '@/lib/community/queries';

const STATIC_ROUTES = [
  '/',
  '/blog',
  '/community',
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `https://stunprex.com${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/blog' ? 0.9 : 0.7,
  }));

  // Dynamic blog post entries — each with its actual lastModified date
  const posts = getAllPostCards();
  const postEntries: MetadataRoute.Sitemap = posts.map(({ frontmatter, slug }) => ({
    url: `https://stunprex.com/blog/${slug}`,
    lastModified: new Date(frontmatter.lastModified ?? frontmatter.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Dynamic community question entries — all published questions
  // Fetch up to 1 000; paginated sitemap deferred to v1.1 per §10 brief.
  let questionEntries: MetadataRoute.Sitemap = [];
  try {
    const { items } = await getQuestions({ perPage: 1000, sort: 'newest' });
    questionEntries = items.map((q) => ({
      url: `https://stunprex.com/community/${encodeURIComponent(q.slug)}`,
      lastModified: new Date(q.updated_at),
      changeFrequency: 'weekly',
      priority: 0.75,
    }));
  } catch {
    // If DB is unavailable (e.g. local dev without credentials), skip community entries gracefully
  }

  return [...staticEntries, ...postEntries, ...questionEntries];
}
