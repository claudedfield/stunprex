'use client'
/**
 * PostDetail — full post view with comment thread.
 * Client Component: handles reaction toggle, report flyout, comment form state.
 * Built in Session 2+ for full interactivity; this stub renders structure.
 */
import Link from 'next/link'
import type { PostWithAuthor, CommentWithAuthor, ProfileRow } from '@/lib/types/community'
import { CATEGORY_LABELS } from '@/lib/types/community'
import { formatRelativeTime, stripMarkdown } from '@/lib/community/utils'
import UserAvatar from '@/components/community/UserAvatar'
import MarkdownBody from '@/components/community/MarkdownBody'

interface PostDetailProps {
  post: PostWithAuthor
  comments: CommentWithAuthor[]
  currentProfile: ProfileRow | null
}

export default function PostDetail({ post, comments, currentProfile }: PostDetailProps) {
  return (
    <article>
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm font-ui text-brown/50" aria-label="Breadcrumb">
        <Link href="/community" className="hover:text-deepblue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded">
          Community
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <Link
          href={`/community?category=${post.category}`}
          className="hover:text-deepblue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
        >
          {CATEGORY_LABELS[post.category]}
        </Link>
      </nav>

      {/* Post header */}
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-deepblue mb-3 leading-snug">
          {post.title}
        </h1>
        <div className="flex items-center gap-3">
          <UserAvatar
            displayName={post.author.display_name}
            avatarUrl={post.author.avatar_url}
            size="sm"
          />
          <div className="text-sm font-ui text-brown/60">
            <Link
              href={`/community/u/${post.author.display_name}`}
              className="text-deepblue hover:text-deepblue/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
            >
              {post.author.display_name}
            </Link>
            <span className="mx-1.5 text-brown/30" aria-hidden="true">·</span>
            <time dateTime={post.created_at} suppressHydrationWarning>
              {formatRelativeTime(post.created_at)}
            </time>
          </div>
        </div>
      </header>

      {/* Featured image */}
      {post.image_url && (
        <div className="mb-6 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt=""
            className="w-full max-h-80 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Post body — markdown rendered via MarkdownBody */}
      <div className="mb-6 rounded-lg border border-deepblue/10 bg-white p-6">
        <MarkdownBody content={post.body} />
      </div>

      {/* Reaction — de-emphasised count (COO Q8) */}
      <div className="mb-8 flex items-center gap-4 text-sm font-ui text-brown/50">
        {/* ReactionButton goes here in Session 2 */}
        <span>{post.reaction_count} {post.reaction_count === 1 ? 'person found this useful' : 'people found this useful'}</span>
      </div>

      {/* Comments section */}
      <section aria-labelledby="comments-heading">
        <h2 id="comments-heading" className="font-display text-lg font-semibold text-deepblue mb-4">
          {comments.length === 0 ? 'No replies yet' : `${comments.length} ${comments.length === 1 ? 'reply' : 'replies'}`}
        </h2>

        {/* CommentThread + CommentForm go here in Session 2 */}
        {!currentProfile ? (
          <div className="rounded-lg border border-deepblue/10 bg-white p-4 text-center">
            <p className="text-sm text-brown/60 font-body mb-3">
              Sign in to reply to this discussion.
            </p>
            <Link
              href={`/auth/sign-in?next=/community/${post.slug}`}
              className="inline-block rounded bg-deepblue px-4 py-2 text-sm font-ui font-medium text-white hover:bg-deepblue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-deepblue/10 bg-white p-4">
            <p className="text-sm text-brown/50 font-ui">
              Comment form — Session 2
            </p>
          </div>
        )}
      </section>
    </article>
  )
}
