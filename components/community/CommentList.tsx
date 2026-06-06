/**
 * CommentList — flat list of comments for a question or answer.
 * Server Component; CommentForm is the only interactive part.
 */
import type { CommentWithAuthor } from '@/lib/types/community'
import { formatRelativeTime } from '@/lib/community/utils'
import UserHandle from './UserHandle'
import CommentForm from './CommentForm'

interface CommentListProps {
  comments: CommentWithAuthor[]
  targetType: 'question' | 'answer'
  targetId: string
  isAuthenticated: boolean
}

export default function CommentList({
  comments,
  targetType,
  targetId,
  isAuthenticated,
}: CommentListProps) {
  return (
    <div className="mt-4 border-t border-deepblue/8 pt-3">
      {comments.length > 0 && (
        <ul className="space-y-2 mb-2" role="list">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2 text-sm font-body text-brown/75">
              <span className="shrink-0 text-brown/25 select-none" aria-hidden="true">—</span>
              <div>
                <span className="font-body text-brown/80">{comment.body}</span>
                <span className="ml-2 text-xs text-brown/40 font-ui">
                  <UserHandle
                    displayName={comment.author.display_name}
                  />
                  <span className="mx-1" aria-hidden="true">·</span>
                  <time dateTime={comment.created_at} suppressHydrationWarning>
                    {formatRelativeTime(comment.created_at)}
                  </time>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isAuthenticated ? (
        <CommentForm targetType={targetType} targetId={targetId} />
      ) : (
        <a
          href="/auth/sign-in"
          className="mt-2 block text-xs font-ui text-brown/40 hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
        >
          Sign in to comment
        </a>
      )}
    </div>
  )
}
