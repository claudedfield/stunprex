/**
 * /community — Discussion index.
 * Anonymous reading (no auth gate). Paginated posts, category filter, search.
 * COO Q5: public read access via Supabase RLS anon policy.
 */
import type { Metadata } from 'next'
import { getPosts } from '@/lib/community/queries'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/types/community'
import type { PostCategory } from '@/lib/types/community'
import CommunityIndex from './CommunityIndex'

export const metadata: Metadata = {
  title: 'Community — StunpreX',
  description:
    'A space for players, parents, coaches, and anyone who cares about football development done right. Post questions, share observations, start conversations.',
  openGraph: {
    title: 'Community — StunpreX',
    description:
      'Methodology debates welcome. A calm, engaged community built on long-horizon thinking.',
    url: 'https://stunprex.com/community',
  },
}

interface CommunityPageProps {
  searchParams: Promise<{
    category?: string
    page?: string
    q?: string
  }>
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams
  const category = ALL_CATEGORIES.includes(params.category as PostCategory)
    ? (params.category as PostCategory)
    : undefined
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const search = params.q?.trim() || undefined

  const { posts, total, totalPages } = await getPosts({
    category,
    page,
    perPage: 20,
    search,
  })

  return (
    <main className="min-h-screen bg-mint">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold text-deepblue mb-2">
            Community
          </h1>
          <p className="text-brown/70 font-body">
            Questions, observations, and conversations about football development.
          </p>
        </header>
        <CommunityIndex
          posts={posts}
          total={total}
          totalPages={totalPages}
          currentPage={page}
          currentCategory={category}
          currentSearch={search}
          categories={ALL_CATEGORIES}
          categoryLabels={CATEGORY_LABELS}
        />
      </div>
    </main>
  )
}
