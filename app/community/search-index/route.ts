/**
 * GET /community/search-index
 * Returns a lightweight JSON array of all published questions for FlexSearch
 * client-side index hydration. Called once per page load by CommunityIndex
 * when the user opens the search dialog.
 *
 * Cached for 5 minutes at the CDN edge (no Vercel KV required at v1).
 * Public — no auth. Contains only title + slug + category + tag labels (no bodies).
 */
import { NextResponse } from 'next/server'
import { getSearchIndexData } from '@/lib/community/queries'

// Never pre-render at build time — requires live DB. Edge-cached via Cache-Control.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getSearchIndexData()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[search-index] failed:', err)
    return NextResponse.json([], { status: 500 })
  }
}
