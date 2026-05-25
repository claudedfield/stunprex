// /blog/search-index — static JSON search index for FlexSearch.
// Loaded client-side by SearchBar on first keystroke. No auth needed.
import { NextResponse } from 'next/server';
import { buildSearchIndex } from '@/lib/posts';

export const dynamic = 'force-static';
export const revalidate = false;

export function GET() {
  const index = buildSearchIndex();
  return NextResponse.json(index, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}
