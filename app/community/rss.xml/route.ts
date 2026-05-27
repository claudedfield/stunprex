/**
 * GET /community/rss.xml
 * RSS 2.0 feed — latest 50 published community questions.
 * Brief §10: "RSS feed at /community/rss.xml — latest 50 questions."
 * Cached 1 hour at the edge.
 */
import { getQuestions } from '@/lib/community/queries'

export const revalidate = 3600 // 1 h ISR

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Strip markdown syntax for a plain-text description. */
function stripMarkdown(md: string): string {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '')  // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // links → label
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

export async function GET() {
  const { items } = await getQuestions({ perPage: 50, sort: 'newest' })

  const now = new Date().toUTCString()

  const items_xml = items
    .map((q) => {
      const url = `https://stunprex.com/community/${encodeURIComponent(q.slug)}`
      const description = stripMarkdown(q.body).slice(0, 300)
      const pubDate = new Date(q.created_at).toUTCString()
      return `
    <item>
      <title>${escapeXml(q.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(q.category)}</category>
      <author>${escapeXml(q.author.display_name)}</author>
    </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>StunpreX Community — Latest Questions</title>
    <link>https://stunprex.com/community</link>
    <description>Latest questions from the StunpreX football development community.</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="https://stunprex.com/community/rss.xml" rel="self" type="application/rss+xml"/>
    ${items_xml}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
    },
  })
}
