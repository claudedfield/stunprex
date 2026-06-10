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
import { Chip } from '@/components/Chip'

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
        <Chip
          href={buildUrl({ category: null, page: 1 })}
          active={!currentCategory}
        >
          All
        </Chip>
        {categories.map((cat) => (
          <Chip
            key={cat}
            href={buildUrl({ category: cat, page: 1 })}
            active={currentCategory === cat}
          >
            {categoryLabels[cat]}
          </Chip>
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
            <Chip key={tag.id} href={`/community/tag/${tag.slug}`}>
              {tag.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Question list */}
      {questions.length === 0 ? (
        <p className="py-12 text-center text-brown/50 font-body text-sm">
          {currentSearch
            ? `No questions matched &ldquo;${currentSearch}&rdquo;.`
            : currentCategory
              ? 'No questions in this category yet — ask one.'
              : 'No questions yet — be the first to ask one.'}
        </p>
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
