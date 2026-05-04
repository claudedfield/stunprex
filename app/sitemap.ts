import type { MetadataRoute } from 'next';

const ROUTES = [
  '/', '/codex', '/methodology', '/about', '/pricing',
  '/playbook', '/training', '/community', '/games', '/reviews', '/shop', '/me',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((path) => ({
    url: `https://stunprex.com${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
