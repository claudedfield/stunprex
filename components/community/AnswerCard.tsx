/**
 * AnswerCard — renders a single answer within a question detail page.
 * Shows accepted badge, author, timestamp, markdown body, upvote button.
 * Server Component — UpvoteButton is client-side.
 */
import type { AnswerWithAuthor } from '@/lib/types/community'
import { formatRelativeTime } from '@/lib/community/utils'
import UserAvatar from './UserAvatar'
import UserHandle from './UserHandle'
import MarkdownBody from './MarkdownBody'
import UpvoteButton from './UpvoteButton'
import CommentList from './CommentList'
import type { CommentWithAuthor } from '@/lib/types/community'

interface AnswerCardProps {
  answer: AnswerWithAuthor
  comments: CommentWithAuthor[]
  isAuthenticated: boolean
  /** Current user ID — used to show edit/delete controls */
  currentUserId?: string
  currentUserRole?: string
  /** Whether this question's author can accept answers (and is current user) */
  canAccept?: boolean
  onAccept?: (answerId: string) => void
}

export default function AnswerCard({
  answer,
  comments,
  isAuthenticated,
  currentUserId,
  currentUserRole,
  canAccept,
}: AnswerCardProps) {
  const isAuthor = currentUserId === answer.author_id
  const isMod = currentUserRole === 'moderator' || currentUserRole === 'admin'
  const canEdit = isAuthor || isMod

  return (
    <div
      id={`answer-${answer.id}`}
      className={`rounded-lg border bg-white p-5 ${
        answer.is_accepted ? 'border-green-400/50 ring-1 ring-green-400/20' : 'border-deepblue/10'
      }`}
    >
      {/* Accepted badge */}
      {answer.is_accepted && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded bg-green-50 px-2 py-1 text-xs font-ui font-medium text-green-700">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Accepted answer
        </div>
      )}

      <div className="flex gap-4">
        {/* Upvote column */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <UpvoteButton
            targetType="answer"
            targetId={answer.id}
            initialCount={answer.upvote_count}
            initialUpvoted={answer.viewer_has_upvoted ?? false}
            isAuthenticated={isAuthenticated}
          />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <MarkdownBody content={answer.body} allowImages />

          {/* Author + meta */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-brown/50 font-ui">
              <UserAvatar
                displayName={answer.author.display_name}
                avatarUrl={answer.author.avatar_url}
                size="sm"
              />
              <UserHandle displayName={answer.author.display_name} role={answer.author.role} />
              <span aria-hidden="true">·</span>
              <time dateTime={answer.created_at} suppressHydrationWarning>
                {formatRelativeTime(answer.created_at)}
              </time>
            </div>

            {/* Edit / delete controls */}
            {canEdit && (
              <div className="flex items-center gap-3 text-xs font-ui text-brown/40">
                <a
                  href={`/community/answer/${answer.id}/edit`}
                  className="hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
                >
                  Edit
                </a>
              </div>
            )}
          </div>

          {/* Comments on this answer */}
          <CommentList
            comments={comments}
            targetType="answer"
            targetId={answer.id}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </div>
  )
}
