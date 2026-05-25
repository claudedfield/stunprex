import type { MetadataRoute } from 'next';
import { getAllPostCards } from '@/lib/posts';
import { CATEGORY_SLUGS } from '@/lib/types/post';

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

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...staticEntries, ...postEntries];
}
