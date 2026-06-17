/**
 * /community — Question index.
 * Public read. Paginated, category-filtered, sortable.
 * Revalidates at most every 60s (ISR).
 */
import type { Metadata } from 'next'
import { getQuestions, getAllTags } from '@/lib/community/queries'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/types/community'
import type { QuestionCategory, SortOrder } from '@/lib/types/community'
import CommunityIndex from './CommunityIndex'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Community — StunpreX',
  description:
    'Questions, answers, and observations on football player development. Ask anything — methodology, coaching, player progress, parent corner.',
  openGraph: {
    title: 'Community — StunpreX',
    description: 'A calm, methodology-grounded Q&A community for football development.',
    url: 'https://stunprex.com/community',
  },
}

interface CommunityPageProps {
  searchParams: Promise<{
    category?: string
    page?: string
    q?: string
    sort?: string
  }>
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams
  const category = ALL_CATEGORIES.includes(params.category as QuestionCategory)
    ? (params.category as QuestionCategory)
    : undefined
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const search = params.q?.trim() || undefined
  const sort: SortOrder =
    params.sort === 'top' || params.sort === 'unanswered'
      ? (params.sort as SortOrder)
      : 'newest'

  const [{ items: questions, total, totalPages }, tags] = await Promise.all([
    getQuestions({ category, page, perPage: 20, search, sort }),
    getAllTags(),
  ])

  return (
    <main className="min-h-screen bg-mint">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-deepblue mb-1">
              Community
            </h1>
            <p className="text-brown/60 font-body text-sm">
              Questions and answers on football player development.
            </p>
          </div>
          <a
            href="/community/ask"
            className="inline-flex items-center gap-1.5 rounded bg-orange px-4 py-2 text-sm font-ui font-medium text-white transition-colors hover:bg-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 focus-visible:ring-offset-1 self-start"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Ask a question
          </a>
        </header>

        <CommunityIndex
          questions={questions}
          total={total}
          totalPages={totalPages}
          currentPage={page}
          currentCategory={category}
          currentSearch={search}
          currentSort={sort}
          tags={tags}
          categories={ALL_CATEGORIES}
          categoryLabels={CATEGORY_LABELS}
        />
      </div>
    </main>
  )
}
