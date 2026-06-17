'use client'
/**
 * CommunityIndex — client wrapper for the Q&A feed.
 * Handles category, sort, and tag filter nav via URL params.
 * No infinite scroll; pagination only (brief §6).
 */
import { usePathname } from 'next/navigation'
import type { QuestionWithAuthor, TagRow, QuestionCategory, SortOrder } from '@/lib/types/community'
import QuestionCard from '@/components/community/QuestionCard'
import { Pagination } from '@/components/blog/Pagination'

interface CommunityIndexProps {
  questions: QuestionWithAuthor[]
  total: number
  totalPages: number
  currentPage: number
  currentCategory?: QuestionCategory
  currentSearch?: string
  currentSort: SortOrder
  tags: TagRow[]
  categories: QuestionCategory[]
  categoryLabels: Record<QuestionCategory, string>
}

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'top', label: 'Most upvoted' },
  { value: 'unanswered', label: 'Unanswered' },
]

export default function CommunityIndex({
  questions,
  total,
  totalPages,
  currentPage,
  currentCategory,
  currentSearch,
  currentSort,
  tags,
  categories,
  categoryLabels,
}: CommunityIndexProps) {
  const pathname = usePathname()

  function buildUrl(overrides: {
    category?: QuestionCategory | null
    page?: number
    q?: string | null
    sort?: SortOrder
  }) {
    const p = new URLSearchParams()
    const cat = 'category' in overrides ? overrides.category : currentCategory
    const pg = 'page' in overrides ? overrides.page : currentPage
    const q = 'q' in overrides ? overrides.q : currentSearch
    const sort = 'sort' in overrides ? overrides.sort : currentSort

    if (cat) p.set('category', cat)
    if (pg && pg > 1) p.set('page', String(pg))
    if (q) p.set('q', q)
    if (sort && sort !== 'newest') p.set('sort', sort)

    const qs = p.toString()
    return `${pathname}${qs ? '?' + qs : ''}`
  }

  return (
    <div className="space-y-5">
      {/* Category filter */}
      <nav aria-label="Category filter" className="flex flex-wrap gap-2">
        <a
          href={buildUrl({ category: null, page: 1 })}
          className={`rounded-full px-3 py-1 text-xs font-ui font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1 ${
            !currentCategory
              ? 'bg-deepblue text-white'
              : 'bg-white text-brown/65 hover:text-deepblue border border-deepblue/20'
          }`}
        >
          All
        </a>
        {categories.map((cat) => (
          <a
            key={cat}
            href={buildUrl({ category: cat, page: 1 })}
            className={`rounded-full px-3 py-1 text-xs font-ui font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1 ${
              currentCategory === cat
                ? 'bg-deepblue text-white'
                : 'bg-white text-brown/65 hover:text-deepblue border border-deepblue/20'
            }`}
          >
            {categoryLabels[cat]}
          </a>
        ))}
      </nav>

      {/* Sort + popular tags row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-ui text-brown/40">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <a
              key={opt.value}
              href={buildUrl({ sort: opt.value, page: 1 })}
              className={`text-xs font-ui transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded ${
                currentSort === opt.value
                  ? 'text-deepblue font-medium'
                  : 'text-brown/50 hover:text-deepblue'
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>

        {/* Top tags — compact */}
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 6).map((tag) => (
            <a
              key={tag.id}
              href={`/community/tag/${tag.slug}`}
              className="rounded-full bg-deepblue/8 px-2 py-0.5 text-xs font-ui font-medium text-deepblue/70 hover:bg-deepblue/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
            >
              {tag.label}
            </a>
          ))}
        </div>
      </div>

      {/* Question list — never a dead room: always offer the full set */}
      {questions.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-brown/60 font-body text-sm">
            {currentSearch
              ? `No answered questions match “${currentSearch}” yet.`
              : 'No answered questions here yet.'}
          </p>
          <p className="mt-3 text-sm font-ui">
            <a
              href="/community"
              className="text-deepblue font-medium hover:text-deepblue/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
            >
              Browse all answered questions →
            </a>
          </p>
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {questions.map((q) => (
            <li key={q.id}>
              <QuestionCard question={q} />
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseHref={buildUrl({ page: 1 }).replace(/&?page=1/, '')}
        />
      )}

      {/* Result count — de-emphasised */}
      {total > 0 && (
        <p className="text-center text-xs text-brown/35 font-ui">
          {total} question{total !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
