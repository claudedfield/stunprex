/**
 * /feed.xml — RSS 2.0 feed of published blog posts.
 * Generates from the same MDX source as /blog.
 * Cache-Control: 10 min (revalidate=600).
 */
import { NextResponse } from 'next/server';
import { getAllPostCards } from '@/lib/posts';

export const revalidate = 600;

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(): Promise<NextResponse> {
  const posts = getAllPostCards();
  const base = 'https://www.stunprex.com';
  const now = new Date().toUTCString();

  const items = posts
    .map(({ frontmatter, slug }) => {
      const url = `${base}/blog/${slug}`;
      return `    <item>
      <title>${escXml(frontmatter.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(frontmatter.date).toUTCString()}</pubDate>
      <description>${escXml(frontmatter.description)}</description>
      <category>${escXml(frontmatter.category)}</category>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>StunpreX</title>
    <link>${base}</link>
    <description>Individual soccer player development — methodology-first. Articles, drills, and a community for players, parents, and coaches. Free.</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
}
