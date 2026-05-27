/**
 * /community/search — Full-text search results page.
 * Public read. Falls back to DB ILIKE search (no FlexSearch on server).
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { getQuestions } from '@/lib/community/queries'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/types/community'
import QuestionCard from '@/components/community/QuestionCard'
import { Pagination } from '@/components/blog/Pagination'

export const metadata: Metadata = {
  title: 'Search — StunpreX Community',
  robots: { index: false, follow: false },
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams
  const query = sp.q?.trim() ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))

  const { items: questions, total, totalPages } =
    query.length >= 2
      ? await getQuestions({ search: query, page, perPage: 20 })
      : { items: [], total: 0, totalPages: 0 }

  const baseHref = query ? `/community/search?q=${encodeURIComponent(query)}&` : '/community/search?'

  return (
    <main className="min-h-screen bg-mint">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <nav className="mb-2 text-xs font-ui text-brown/45" aria-label="Breadcrumb">
            <Link href="/community" className="hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded">
              Community
            </Link>
            <span className="mx-1.5" aria-hidden="true">/</span>
            Search
          </nav>
          <h1 className="font-display text-2xl font-bold text-deepblue mb-4">
            {query ? `Results for "${query}"` : 'Search'}
          </h1>

          {/* Search form */}
          <form action="/community/search" method="GET">
            <div className="flex gap-2">
              <input
                type="search"
                name="q"
                defaultValue={query}
                autoFocus
                placeholder="Search questions…"
                className="flex-1 rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown placeholder:text-brown/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
              />
              <button
                type="submit"
                className="rounded bg-deepblue px-4 py-2 text-sm font-ui font-medium text-white transition-colors hover:bg-deepblue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
              >
                Search
              </button>
            </div>
          </form>
        </header>

        {query.length < 2 ? (
          <p className="text-sm text-brown/50 font-body">
            Enter at least 2 characters to search.
          </p>
        ) : questions.length === 0 ? (
          <p className="text-sm text-brown/50 font-body py-8">
            No questions matched &ldquo;{query}&rdquo;.{' '}
            <Link href="/community/ask" className="text-deepblue underline hover:text-deepblue/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded">
              Ask a question
            </Link>
          </p>
        ) : (
          <>
            <p className="mb-4 text-xs text-brown/40 font-ui">
              {total} result{total !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
            <ul className="space-y-3" role="list">
              {questions.map((q) => (
                <li key={q.id}>
                  <QuestionCard question={q} />
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  baseHref={baseHref}
                />
              </div>
            )}
          </>
        )}

        {/* Category browse suggestion */}
        <div className="mt-10 border-t border-deepblue/10 pt-6">
          <p className="text-xs text-brown/50 font-ui mb-2">Browse by category:</p>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/community/category/${cat}`}
                className="rounded-full bg-white border border-deepblue/20 px-3 py-1 text-xs font-ui text-brown/65 hover:text-deepblue hover:border-deepblue/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
              >
                {CATEGORY_LABELS[cat]}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
