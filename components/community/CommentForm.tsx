'use client'
/**
 * CommentForm — inline comment submission form.
 * Short clarification only; body ≤ 2000 chars.
 * Shows inline after clicking "Add a comment".
 */
import { useState, useTransition, useRef } from 'react'
import { createComment } from '@/lib/community/actions'

interface CommentFormProps {
  targetType: 'question' | 'answer'
  targetId: string
  onSuccess?: () => void
}

export default function CommentForm({ targetType, targetId, onSuccess }: CommentFormProps) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const remaining = 2000 - body.length

  function handleOpen() {
    setOpen(true)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function handleCancel() {
    setOpen(false)
    setBody('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || body.length < 10) {
      setError('Comment must be at least 10 characters.')
      return
    }
    setError(null)

    const fd = new FormData()
    fd.append('body', body)
    fd.append('target_type', targetType)
    fd.append('target_id', targetId)

    startTransition(async () => {
      const result = await createComment(fd)
      if (result.success) {
        setBody('')
        setOpen(false)
        onSuccess?.()
      } else {
        setError(result.error)
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="mt-3 text-xs font-ui text-brown/45 hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
      >
        Add a comment
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2" noValidate>
      {error && (
        <p className="text-xs text-orange font-body" role="alert">
          {error}
        </p>
      )}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Add a short clarification comment…"
        className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown placeholder:text-brown/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 resize-none"
      />
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-ui ${remaining < 50 ? 'text-orange' : 'text-brown/35'}`}>
          {remaining} chars left
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded px-3 py-1.5 text-xs font-ui text-brown/50 hover:text-brown transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || body.length < 10}
            className="rounded bg-deepblue px-3 py-1.5 text-xs font-ui font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
          >
            {isPending ? 'Posting…' : 'Post comment'}
          </button>
        </div>
      </div>
    </form>
  )
}
