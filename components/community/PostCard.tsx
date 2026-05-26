/**
 * PostCard — compact post preview tile used in the community index.
 * Shows title, category chip, author, age, reaction count, comment count.
 * No fake activity tickers, no notification-bait (COO Q8 UX discipline).
 */
import Link from 'next/link'
import type { PostWithAuthor } from '@/lib/types/community'
import { CATEGORY_LABELS } from '@/lib/types/community'
import { formatRelativeTime, truncateToWords, stripMarkdown } from '@/lib/community/utils'
import UserAvatar from './UserAvatar'

interface PostCardProps {
  post: PostWithAuthor
}

export default function PostCard({ post }: PostCardProps) {
  const preview = truncateToWords(stripMarkdown(post.body), 160)

  return (
    <article className="rounded-lg border border-deepblue/10 bg-white p-4 transition-colors hover:border-deepblue/25">
      <div className="flex items-start gap-3">
        {/* Author avatar */}
        <UserAvatar
          displayName={post.author.display_name}
          avatarUrl={post.author.avatar_url}
          size="sm"
        />

        <div className="flex-1 min-w-0">
          {/* Category + meta line */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="rounded-full bg-deepblue/8 px-2 py-0.5 text-xs font-ui font-medium text-deepblue">
              {CATEGORY_LABELS[post.category]}
            </span>
            <span className="text-xs text-brown/40 font-ui">
              {post.author.display_name}
            </span>
            <span className="text-xs text-brown/30 font-ui" suppressHydrationWarning>
              · {formatRelativeTime(post.created_at)}
            </span>
          </div>

          {/* Title */}
          <Link
            href={`/community/${post.slug}`}
            className="block font-display font-semibold text-deepblue leading-snug hover:text-deepblue/75 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
          >
            {post.title}
          </Link>

          {/* Body preview */}
          {preview && (
            <p className="mt-1 text-sm text-brown/65 font-body leading-relaxed line-clamp-2">
              {preview}
            </p>
          )}

          {/* Footer — reaction count, de-emphasised (COO Q8) */}
          <div className="mt-2 flex items-center gap-3 text-xs text-brown/40 font-ui">
            {post.reaction_count > 0 && (
              <span aria-label={`${post.reaction_count} reaction${post.reaction_count !== 1 ? 's' : ''}`}>
                👍 {post.reaction_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
