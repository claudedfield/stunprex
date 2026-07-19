// /blog/rss.xml — RSS 2.0 feed for all published posts.
// Hand-rolled — no dependency. Validates at https://validator.w3.org/feed/
import { getAllPostCards } from '@/lib/posts';

export const dynamic = 'force-static';
export const revalidate = false;

const SITE_URL = 'https://stunprex.com';
const FEED_TITLE = 'StunpreX Blog — Soccer Player Development';
const FEED_DESCRIPTION =
  'Methodology-first articles on individual soccer player development.';
const FEED_LANGUAGE = 'en';
const FEED_COPYRIGHT = `Copyright ${new Date().getFullYear()} StunpreX / DField Kft.`;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(isoDate: string): string {
  return new Date(isoDate).toUTCString();
}

export function GET() {
  const posts = getAllPostCards();

  const items = posts
    .map(({ frontmatter, slug }) => {
      const postUrl = `${SITE_URL}/blog/${slug}`;
      const pubDate = toRfc822(frontmatter.date);
      const categories = [frontmatter.category, frontmatter.keywords.primary].join(', ');
      return `
    <item>
      <title>${escapeXml(frontmatter.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${escapeXml(frontmatter.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(frontmatter.category)}</category>
      <dc:creator>StunpreX</dc:creator>
    </item>`;
    })
    .join('\n');

  const lastBuildDate =
    posts.length > 0 ? toRfc822(posts[0].frontmatter.date) : new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>${FEED_LANGUAGE}</language>
    <copyright>${escapeXml(FEED_COPYRIGHT)}</copyright>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
