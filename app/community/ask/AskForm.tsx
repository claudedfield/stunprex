'use client'
/**
 * AskForm — multi-step question form with preview.
 * Step 1: compose (title, category, body, tags).
 * Step 2: preview — renders markdown, confirms before submit.
 * Brief §6: posting friction is welcome.
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { QuestionCategory, TagRow } from '@/lib/types/community'
import { createQuestion } from '@/lib/community/actions'
import MarkdownBody from '@/components/community/MarkdownBody'

interface AskFormProps {
  initialCategory?: QuestionCategory | ''
  categories: QuestionCategory[]
  categoryLabels: Record<QuestionCategory, string>
  tags: TagRow[]
}

type Step = 'compose' | 'preview'

export default function AskForm({ categories, categoryLabels, tags, initialCategory = '' }: AskFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('compose')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<QuestionCategory | ''>(initialCategory)
  const [body, setBody] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev
    )
  }

  function validateCompose() {
    const e: Record<string, string> = {}
    if (title.length < 15) e.title = 'Title must be at least 15 characters.'
    if (title.length > 200) e.title = 'Title must be 200 characters or fewer.'
    if (!category) e.category = 'Please select a category.'
    if (body.length < 30) e.body = 'Question body must be at least 30 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    if (validateCompose()) setStep('preview')
  }

  function handleSubmit() {
    const fd = new FormData()
    fd.append('title', title)
    fd.append('category', category)
    fd.append('body', body)
    selectedTagIds.forEach((id) => fd.append('tag_ids', id))

    startTransition(async () => {
      const result = await createQuestion(fd)
      if (result.success && result.data) {
        router.push(`/community/${result.data.slug}`)
      } else if (!result.success) {
        setSubmitError(result.error)
        setStep('compose')
      }
    })
  }

  if (step === 'preview') {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-deepblue/20 bg-white p-6">
          <p className="text-xs font-ui font-medium text-deepblue/50 uppercase tracking-wide mb-4">
            Preview — review before posting
          </p>

          <h2 className="font-display text-xl font-bold text-deepblue mb-2">{title}</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="rounded-full bg-deepblue/8 px-2 py-0.5 text-xs font-ui font-medium text-deepblue/80">
              {categoryLabels[category as QuestionCategory]}
            </span>
            {selectedTagIds.map((id) => {
              const tag = tags.find((t) => t.id === id)
              return tag ? (
                <span key={id} className="rounded-full bg-deepblue/5 px-2 py-0.5 text-xs font-ui text-deepblue/65">
                  {tag.label}
                </span>
              ) : null
            })}
          </div>

          <MarkdownBody content={body} allowImages />
        </div>

        {submitError && (
          <p className="rounded bg-orange/10 px-3 py-2 text-sm text-orange font-body" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => setStep('compose')}
            className="rounded px-4 py-2 text-sm font-ui text-brown/60 hover:text-brown transition-colors border border-deepblue/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
          >
            Edit question
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded bg-orange px-4 py-2 text-sm font-ui font-medium text-white transition-colors hover:bg-orange/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40"
          >
            {isPending ? 'Posting…' : 'Post question'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handlePreview} className="space-y-5" noValidate>
      {/* Title */}
      <div>
        <label htmlFor="title" className="block font-ui text-sm font-medium text-deepblue mb-1">
          Question title <span className="text-brown/40 font-normal text-xs">(be specific)</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="e.g. How do I help a U13 improve scanning before receiving the ball?"
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown placeholder:text-brown/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
        />
        {errors.title && <p className="mt-1 text-xs text-orange font-body" role="alert">{errors.title}</p>}
        <p className="mt-0.5 text-xs text-brown/35 font-ui text-right">{title.length}/200</p>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block font-ui text-sm font-medium text-deepblue mb-1">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as QuestionCategory)}
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 bg-white"
        >
          <option value="">Select a category…</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{categoryLabels[cat]}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-orange font-body" role="alert">{errors.category}</p>}
      </div>

      {/* Body */}
      <div>
        <label htmlFor="body" className="block font-ui text-sm font-medium text-deepblue mb-1">
          Question body{' '}
          <span className="text-brown/40 font-normal text-xs">
            — context, what you&rsquo;ve tried, what you&rsquo;re specifically asking
          </span>
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="Describe the situation, what you know, what you've already tried, and what specific answer you're looking for. Markdown is supported."
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown placeholder:text-brown/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 resize-y min-h-[200px]"
        />
        {errors.body && <p className="mt-1 text-xs text-orange font-body" role="alert">{errors.body}</p>}
      </div>

      {/* Tags */}
      <div>
        <p className="font-ui text-sm font-medium text-deepblue mb-1.5">
          Tags{' '}
          <span className="text-brown/40 font-normal text-xs">
            — up to 5, optional
          </span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const selected = selectedTagIds.includes(tag.id)
            const disabled = !selected && selectedTagIds.length >= 5
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => !disabled && toggleTag(tag.id)}
                disabled={disabled}
                aria-pressed={selected}
                className={`rounded-full px-2.5 py-1 text-xs font-ui transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 ${
                  selected
                    ? 'bg-deepblue text-white'
                    : disabled
                      ? 'bg-deepblue/5 text-brown/30 cursor-not-allowed'
                      : 'bg-deepblue/8 text-deepblue/80 hover:bg-deepblue/15'
                }`}
              >
                {tag.label}
              </button>
            )
          })}
        </div>
        {selectedTagIds.length >= 5 && (
          <p className="mt-1 text-xs text-brown/40 font-ui">Maximum 5 tags.</p>
        )}
      </div>

      {/* Submit → preview */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="rounded bg-deepblue px-5 py-2.5 text-sm font-ui font-medium text-white transition-colors hover:bg-deepblue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
        >
          Preview question →
        </button>
      </div>
    </form>
  )
}
