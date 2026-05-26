'use client'
/**
 * CommunityIndex — Client Component wrapper for the discussion index.
 * Handles category filter, search, and sort state via URL params.
 * Session 2+ will populate PostCard; this session delivers the shell.
 */
import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { PostWithAuthor, PostCategory } from '@/lib/types/community'
import PostCard from '@/components/community/PostCard'
import { Pagination } from '@/components/blog/Pagination'

interface CommunityIndexProps {
  posts: PostWithAuthor[]
  total: number
  totalPages: number
  currentPage: number
  currentCategory?: PostCategory
  currentSearch?: string
  categories: PostCategory[]
  categoryLabels: Record<PostCategory, string>
}

export default function CommunityIndex({
  posts,
  total,
  totalPages,
  currentPage,
  currentCategory,
  currentSearch,
  categories,
  categoryLabels,
}: CommunityIndexProps) {
  const router = useRouter()
  const pathname = usePathname()

  const buildUrl = useCallback(
    (overrides: { category?: PostCategory | null; page?: number; q?: string | null }) => {
      const params = new URLSearchParams()
      const cat = 'category' in overrides ? overrides.category : currentCategory
      const pg = 'page' in overrides ? overrides.page : currentPage
      const q = 'q' in overrides ? overrides.q : currentSearch

      if (cat) params.set('category', cat)
      if (pg && pg > 1) params.set('page', String(pg))
      if (q) params.set('q', q)

      const qs = params.toString()
      return `${pathname}${qs ? '?' + qs : ''}`
    },
    [pathname, currentCategory, currentPage, currentSearch]
  )

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2">
          <a
            href={buildUrl({ category: null, page: 1 })}
            className={`rounded-full px-3 py-1 text-xs font-ui font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1 ${
              !currentCategory
                ? 'bg-deepblue text-white'
                : 'bg-white text-brown/70 hover:text-deepblue border border-deepblue/20'
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
                  : 'bg-white text-brown/70 hover:text-deepblue border border-deepblue/20'
              }`}
            >
              {categoryLabels[cat]}
            </a>
          ))}
        </div>

        {/* New post link */}
        <a
          href="/community/new"
          className="inline-flex items-center gap-1.5 rounded bg-orange px-3 py-1.5 text-xs font-ui font-medium text-white transition-colors hover:bg-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 focus-visible:ring-offset-1"
        >
          + New discussion
        </a>
      </div>

      {/* Post list */}
      {posts.length === 0 ? (
        <p className="py-12 text-center text-brown/50 font-body text-sm">
          {currentSearch
            ? `No discussions matched "${currentSearch}".`
            : currentCategory
            ? 'No discussions in this category yet — start one.'
            : 'No discussions yet — start one.'}
        </p>
      ) : (
        <ul className="space-y-3" role="list">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}

      {/* Pagination — reuse blog's component */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseHref={pathname + (currentCategory ? `?category=${currentCategory}` : '')}
        />
      )}

      {/* Result count — de-emphasised */}
      {total > 0 && (
        <p className="text-center text-xs text-brown/40 font-ui">
          {total} discussion{total !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
