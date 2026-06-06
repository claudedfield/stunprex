'use client'
/**
 * QuestionDetail — full question view with answers + comments.
 * Client Component: answer form state, accept answer handler.
 */
import { useState, useTransition } from 'react'
import Link from 'next/link'
import type {
  QuestionWithAuthor,
  AnswerWithAuthor,
  CommentWithAuthor,
} from '@/lib/types/community'
import { CATEGORY_LABELS } from '@/lib/types/community'
import { formatRelativeTime } from '@/lib/community/utils'
import UserAvatar from '@/components/community/UserAvatar'
import UserHandle from '@/components/community/UserHandle'
import TagChip from '@/components/community/TagChip'
import MarkdownBody from '@/components/community/MarkdownBody'
import UpvoteButton from '@/components/community/UpvoteButton'
import AnswerCard from '@/components/community/AnswerCard'
import CommentList from '@/components/community/CommentList'
import ReportFlyout from '@/components/community/ReportFlyout'
import { createAnswer, acceptAnswer } from '@/lib/community/actions'

interface QuestionDetailProps {
  question: QuestionWithAuthor
  answers: AnswerWithAuthor[]
  questionComments: CommentWithAuthor[]
  answerCommentMap: Record<string, CommentWithAuthor[]>
  isAuthenticated: boolean
  currentUserId?: string
  currentUserRole?: string
}

export default function QuestionDetail({
  question,
  answers,
  questionComments,
  answerCommentMap,
  isAuthenticated,
  currentUserId,
  currentUserRole,
}: QuestionDetailProps) {
  const [answerBody, setAnswerBody] = useState('')
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [isSubmitting, startTransition] = useTransition()

  const isAuthor = currentUserId === question.author_id
  const isMod = currentUserRole === 'moderator' || currentUserRole === 'admin'
  const canEdit = isAuthor || isMod

  function handleAnswerSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (answerBody.length < 30) {
      setAnswerError('Answer must be at least 30 characters.')
      return
    }
    setAnswerError(null)

    const fd = new FormData()
    fd.append('body', answerBody)
    fd.append('question_id', question.id)

    startTransition(async () => {
      const result = await createAnswer(fd)
      if (result.success) {
        setAnswerBody('')
      } else {
        setAnswerError(result.error)
      }
    })
  }

  function handleAccept(answerId: string) {
    startTransition(async () => {
      await acceptAnswer(question.id, answerId)
    })
  }

  return (
    <article>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs font-ui text-brown/45 flex-wrap" aria-label="Breadcrumb">
        <Link href="/community" className="hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded">
          Community
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/community/category/${question.category}`}
          className="hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
        >
          {CATEGORY_LABELS[question.category]}
        </Link>
      </nav>

      {/* Question */}
      <div className="rounded-lg border border-deepblue/10 bg-white p-6">
        <header className="mb-4">
          {question.is_pinned && (
            <span className="mb-2 inline-block rounded-full bg-orange/10 px-2 py-0.5 text-xs font-ui font-medium text-orange">
              Pinned
            </span>
          )}
          <h1 className="font-display text-xl font-bold text-deepblue leading-snug mb-3">
            {question.title}
          </h1>

          {/* Author + meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-brown/50 font-ui">
            <UserAvatar
              displayName={question.author.display_name}
              avatarUrl={question.author.avatar_url}
              size="sm"
            />
            <UserHandle displayName={question.author.display_name} role={question.author.role} />
            <span aria-hidden="true">·</span>
            <time dateTime={question.created_at} suppressHydrationWarning>
              {formatRelativeTime(question.created_at)}
            </time>
            <span aria-hidden="true">·</span>
            <span>{question.view_count} views</span>
          </div>

          {/* Tags */}
          {question.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {question.tags.map((tag) => (
                <TagChip key={tag.id} name={tag.label} slug={tag.slug} />
              ))}
            </div>
          )}
        </header>

        {/* Body */}
        <MarkdownBody content={question.body} allowImages />

        {/* Actions row */}
        <div className="mt-5 flex items-center justify-between flex-wrap gap-3 border-t border-deepblue/8 pt-4">
          <UpvoteButton
            targetType="question"
            targetId={question.id}
            initialCount={question.upvote_count}
            initialUpvoted={question.viewer_has_upvoted ?? false}
            isAuthenticated={isAuthenticated}
          />

          <div className="flex items-center gap-4 text-xs font-ui text-brown/40">
            {canEdit && (
              <Link
                href={`/community/${question.slug}/edit`}
                className="hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
              >
                Edit
              </Link>
            )}
            {isAuthenticated && !isAuthor && (
              <ReportFlyout targetType="question" targetId={question.id} />
            )}
          </div>
        </div>

        {/* Question comments */}
        <CommentList
          comments={questionComments}
          targetType="question"
          targetId={question.id}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Answers section */}
      <section aria-labelledby="answers-heading" className="mt-8">
        <h2 id="answers-heading" className="font-display text-lg font-semibold text-deepblue mb-4">
          {answers.length === 0
            ? 'No answers yet'
            : `${answers.length} answer${answers.length !== 1 ? 's' : ''}`}
        </h2>

        {answers.length > 0 && (
          <ul className="space-y-4" role="list">
            {answers.map((answer) => (
              <li key={answer.id}>
                <AnswerCard
                  answer={answer}
                  comments={answerCommentMap[answer.id] ?? []}
                  isAuthenticated={isAuthenticated}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  canAccept={isAuthor && !question.accepted_answer_id}
                  onAccept={handleAccept}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Post an answer */}
      <section aria-labelledby="answer-form-heading" className="mt-8">
        <h2 id="answer-form-heading" className="font-display text-lg font-semibold text-deepblue mb-4">
          Your answer
        </h2>

        {isAuthenticated ? (
          <form onSubmit={handleAnswerSubmit} className="space-y-3" noValidate>
            {answerError && (
              <p className="text-sm text-orange font-body rounded bg-orange/10 px-3 py-2" role="alert">
                {answerError}
              </p>
            )}
            <textarea
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              rows={8}
              placeholder="Share your answer. Markdown is supported — code blocks, links, images from approved hosts."
              className="w-full rounded-lg border border-deepblue/20 px-4 py-3 font-body text-sm text-brown placeholder:text-brown/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 resize-y min-h-[180px]"
              aria-label="Your answer"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-brown/35 font-ui">
                Markdown supported. Be clear and specific.
              </p>
              <button
                type="submit"
                disabled={isSubmitting || answerBody.length < 30}
                className="rounded bg-deepblue px-4 py-2 text-sm font-ui font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
              >
                {isSubmitting ? 'Posting…' : 'Post answer'}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg border border-deepblue/10 bg-white p-6 text-center">
            <p className="text-sm text-brown/60 font-body mb-3">
              Sign in to post an answer.
            </p>
            <Link
              href={`/auth/sign-in?next=/community/${question.slug}`}
              className="inline-block rounded bg-deepblue px-4 py-2 text-sm font-ui font-medium text-white hover:bg-deepblue/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
            >
              Sign in
            </Link>
          </div>
        )}
      </section>
    </article>
  )
}
