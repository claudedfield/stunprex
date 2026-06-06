'use client'
/**
 * EditQuestionForm — pre-populated edit form for an existing question.
 * Reuses the same field structure as AskForm.
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { QuestionWithAuthor, QuestionCategory, TagRow } from '@/lib/types/community'
import { updateQuestion } from '@/lib/community/actions'

interface EditQuestionFormProps {
  question: QuestionWithAuthor
  categories: QuestionCategory[]
  categoryLabels: Record<QuestionCategory, string>
  tags: TagRow[]
}

export default function EditQuestionForm({
  question,
  categories,
  categoryLabels,
  tags,
}: EditQuestionFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(question.title)
  const [category, setCategory] = useState<QuestionCategory>(question.category)
  const [body, setBody] = useState(question.body)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    question.tags.map((t) => t.id)
  )
  const [error, setError] = useState<string | null>(null)
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append('title', title)
    fd.append('category', category)
    fd.append('body', body)
    selectedTagIds.forEach((id) => fd.append('tag_ids', id))

    startTransition(async () => {
      const result = await updateQuestion(question.id, fd)
      if (result.success && result.data) {
        router.push(`/community/${result.data.slug}`)
      } else if (!result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p className="rounded bg-orange/10 px-3 py-2 text-sm text-orange font-body" role="alert">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="edit-title" className="block font-ui text-sm font-medium text-deepblue mb-1">Title</label>
        <input
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
        />
      </div>

      <div>
        <label htmlFor="edit-category" className="block font-ui text-sm font-medium text-deepblue mb-1">Category</label>
        <select
          id="edit-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as QuestionCategory)}
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 bg-white"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{categoryLabels[cat]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="edit-body" className="block font-ui text-sm font-medium text-deepblue mb-1">Body</label>
        <textarea
          id="edit-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 resize-y min-h-[200px]"
        />
      </div>

      <div>
        <p className="font-ui text-sm font-medium text-deepblue mb-1.5">Tags <span className="text-brown/40 font-normal text-xs">— up to 5</span></p>
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
                  selected ? 'bg-deepblue text-white' : disabled ? 'bg-deepblue/5 text-brown/30 cursor-not-allowed' : 'bg-deepblue/8 text-deepblue/80 hover:bg-deepblue/15'
                }`}
              >
                {tag.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <a
          href={`/community/${question.slug}`}
          className="rounded px-4 py-2 text-sm font-ui text-brown/60 hover:text-brown border border-deepblue/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-deepblue px-4 py-2 text-sm font-ui font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
