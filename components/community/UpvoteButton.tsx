'use client'
/**
 * UpvoteButton — toggles upvote on a question or answer.
 * Client Component: optimistic count update via useTransition.
 * De-emphasised per brief §6 (no public voter lists, count shown small).
 */
import { useState, useTransition } from 'react'
import { toggleUpvote } from '@/lib/community/actions'

interface UpvoteButtonProps {
  targetType: 'question' | 'answer'
  targetId: string
  initialCount: number
  initialUpvoted: boolean
  /** If false, renders a disabled button with sign-in tooltip */
  isAuthenticated: boolean
}

export default function UpvoteButton({
  targetType,
  targetId,
  initialCount,
  initialUpvoted,
  isAuthenticated,
}: UpvoteButtonProps) {
  const [upvoted, setUpvoted] = useState(initialUpvoted)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!isAuthenticated) return
    // Optimistic update
    setUpvoted((v) => !v)
    setCount((c) => (upvoted ? c - 1 : c + 1))

    startTransition(async () => {
      const result = await toggleUpvote(targetType, targetId)
      if (result.success && result.data !== undefined) {
        setUpvoted(result.data.upvoted)
        setCount(result.data.count)
      } else if (!result.success) {
        // Revert optimistic update on failure
        setUpvoted((v) => !v)
        setCount((c) => (upvoted ? c + 1 : c - 1))
      }
    })
  }

  if (!isAuthenticated) {
    return (
      <a
        href="/auth/sign-in"
        className="inline-flex flex-col items-center gap-0.5 text-brown/40 font-ui hover:text-deepblue/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
        aria-label="Sign in to upvote"
        title="Sign in to upvote"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
        <span className="text-xs">{count}</span>
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={upvoted ? 'Remove upvote' : 'Upvote'}
      aria-pressed={upvoted}
      className={`inline-flex flex-col items-center gap-0.5 font-ui transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded ${
        upvoted
          ? 'text-deepblue'
          : 'text-brown/40 hover:text-deepblue/60'
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={upvoted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
      <span className="text-xs">{count}</span>
    </button>
  )
}
