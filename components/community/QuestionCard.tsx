/**
 * QuestionCard — compact question preview tile for the community index.
 * Shows title, category chip, tags, author, age, upvote count, answer count.
 * No activity tickers; counts are de-emphasised (brief §6 UX discipline).
 */
import Link from 'next/link'
import type { QuestionWithAuthor } from '@/lib/types/community'
import { CATEGORY_LABELS } from '@/lib/types/community'
import { formatRelativeTime, truncateToWords, stripMarkdown } from '@/lib/community/utils'
import UserAvatar from './UserAvatar'
import TagChip from './TagChip'

interface QuestionCardProps {
  question: QuestionWithAuthor
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const preview = truncateToWords(stripMarkdown(question.body), 140)

  return (
    <article className="rounded-lg border border-deepblue/10 bg-white p-4 transition-colors hover:border-deepblue/25">
      <div className="flex gap-3">
        {/* Stats column — upvotes + answers, de-emphasised */}
        <div className="hidden sm:flex flex-col items-center gap-1.5 pt-0.5 min-w-[40px] text-center">
          <div className="text-xs text-brown/40 font-ui">
            <div className="text-sm font-medium text-brown/60">{question.upvote_count}</div>
            <div>votes</div>
          </div>
          <div
            className={`text-xs font-ui rounded px-1 py-0.5 ${
              question.accepted_answer_id
                ? 'bg-green-100 text-green-700'
                : question.answer_count > 0
                  ? 'text-brown/50'
                  : 'text-brown/30'
            }`}
          >
            <div className="text-sm font-medium">{question.answer_count}</div>
            <div>ans</div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Category + meta line */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Link
              href={`/community/category/${question.category}`}
              className="rounded-full bg-deepblue/8 px-2 py-0.5 text-xs font-ui font-medium text-deepblue/80 hover:bg-deepblue/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
            >
              {CATEGORY_LABELS[question.category]}
            </Link>
            {question.is_pinned && (
              <span className="rounded-full bg-orange/10 px-2 py-0.5 text-xs font-ui font-medium text-orange">
                Pinned
              </span>
            )}
            {question.tags.slice(0, 3).map((tag) => (
              <TagChip key={tag.id} name={tag.label} slug={tag.slug} />
            ))}
          </div>

          {/* Title */}
          <Link
            href={`/community/${question.slug}`}
            className="block font-display font-semibold text-deepblue leading-snug hover:text-deepblue/75 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
          >
            {question.title}
          </Link>

          {/* Body preview */}
          {preview && (
            <p className="mt-1 text-sm text-brown/60 font-body leading-relaxed line-clamp-2">
              {preview}
            </p>
          )}

          {/* Author + timestamp */}
          <div className="mt-2 flex items-center gap-2 text-xs text-brown/40 font-ui">
            <UserAvatar
              displayName={question.author.display_name}
              avatarUrl={question.author.avatar_url}
              size="sm"
            />
            <Link
              href={`/community/u/${question.author.display_name}`}
              className="hover:text-deepblue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
            >
              {question.author.display_name}
            </Link>
            <span aria-hidden="true">·</span>
            <time dateTime={question.created_at} suppressHydrationWarning>
              {formatRelativeTime(question.created_at)}
            </time>
            {/* Mobile: inline counts */}
            <span className="sm:hidden ml-auto">
              {question.upvote_count > 0 && (
                <span className="mr-2">{question.upvote_count} votes</span>
              )}
              <span>{question.answer_count} ans</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
