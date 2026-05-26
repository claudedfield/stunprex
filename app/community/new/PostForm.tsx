'use client'
/**
 * PostForm — two-step post creation form (write → preview → publish).
 * Step 1: title, category, body (markdown), optional image URL.
 * Step 2: preview rendered via MarkdownBody.
 * COO Q8: preview step dampens reactive posting.
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPost, type ActionResult } from '@/lib/community/actions'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/types/community'
import type { PostCategory } from '@/lib/types/community'
import MarkdownBody from '@/components/community/MarkdownBody'

type Step = 'write' | 'preview'

interface PostFormProps {
  authorDisplayName: string
}

export default function PostForm({ authorDisplayName }: PostFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('write')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<PostCategory>('general')
  const [imageUrl, setImageUrl] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    // Basic client-side pre-check before showing preview
    if (!title.trim() || !body.trim() || title.length > 200) return
    setStep('preview')
  }

  function handlePublish() {
    const fd = new FormData()
    fd.append('title', title)
    fd.append('body', body)
    fd.append('category', category)
    if (imageUrl) fd.append('image_url', imageUrl)

    startTransition(async () => {
      const result: ActionResult<{ slug: string }> = await createPost(fd)
      if (result.success && result.data) {
        router.push(`/community/${result.data.slug}`)
      } else if (!result.success) {
        setGlobalError(result.error)
        setFieldErrors((result.fieldErrors as Record<string, string[]>) ?? {})
        setStep('write')
      }
    })
  }

  if (step === 'preview') {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-deepblue/15 bg-white p-6">
          <p className="text-xs text-brown/40 font-ui mb-1 uppercase tracking-wide">Preview</p>
          <h2 className="font-display text-xl font-bold text-deepblue mb-1">{title}</h2>
          <p className="text-xs text-brown/40 font-ui mb-4">
            {CATEGORY_LABELS[category]} · {authorDisplayName}
          </p>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="w-full max-h-60 object-cover rounded mb-4" loading="lazy" />
          )}
          <MarkdownBody content={body} />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep('write')}
            className="flex-1 rounded border border-deepblue/20 px-4 py-2.5 font-ui text-sm font-medium text-brown hover:bg-mint/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
          >
            ← Edit
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="flex-1 rounded bg-deepblue px-4 py-2.5 font-ui text-sm font-medium text-white hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
          >
            {isPending ? 'Publishing…' : 'Publish discussion'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handlePreview} className="space-y-5">
      {globalError && (
        <p className="rounded bg-orange/10 px-3 py-2 text-sm text-orange font-body" role="alert">
          {globalError}
        </p>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block font-ui text-sm font-medium text-deepblue mb-1">
          Title <span className="text-brown/40 font-normal">({title.length}/200)</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown placeholder:text-brown/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
          placeholder="What's the discussion about?"
        />
        {fieldErrors.title && (
          <p className="mt-1 text-xs text-orange font-ui">{fieldErrors.title[0]}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block font-ui text-sm font-medium text-deepblue mb-1">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as PostCategory)}
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1 bg-white"
        >
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      <div>
        <label htmlFor="body" className="block font-ui text-sm font-medium text-deepblue mb-1">
          Body
          <span className="ml-1.5 text-xs text-brown/40 font-normal">Markdown supported</span>
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={10}
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown placeholder:text-brown/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1 resize-y"
          placeholder="Write your post…"
        />
        {fieldErrors.body && (
          <p className="mt-1 text-xs text-orange font-ui">{fieldErrors.body[0]}</p>
        )}
      </div>

      {/* Image URL — optional */}
      <div>
        <label htmlFor="image_url" className="block font-ui text-sm font-medium text-deepblue mb-1">
          Featured image URL
          <span className="ml-1.5 text-xs text-brown/40 font-normal">Optional — must be HTTPS from an allowed host</span>
        </label>
        <input
          id="image_url"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown placeholder:text-brown/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
          placeholder="https://images.unsplash.com/…"
        />
        <p className="mt-1 text-xs text-brown/40 font-ui">
          Allowed: Imgur, Unsplash, Wikimedia, stunprex.com
        </p>
        {fieldErrors.image_url && (
          <p className="mt-1 text-xs text-orange font-ui">{fieldErrors.image_url[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!title.trim() || !body.trim()}
        className="w-full rounded bg-deepblue px-4 py-2.5 font-ui text-sm font-medium text-white hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
      >
        Preview →
      </button>
    </form>
  )
}
