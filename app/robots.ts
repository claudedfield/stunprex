import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://stunprex.com/sitemap.xml',
    host: 'https://stunprex.com',
  };
}
