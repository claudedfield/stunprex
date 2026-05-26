/**
 * /community/[slug] — Discussion detail with threaded comments.
 * Server Component: fetches post + comments, passes to client thread component.
 * Anonymous reading (no auth gate for reads).
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, getCommentsByPost, buildCommentTree, getCurrentProfile } from '@/lib/community/queries'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used below after post guard
import { truncateToWords, stripMarkdown } from '@/lib/community/utils'
import PostDetail from './PostDetail'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Not found — StunpreX Community' }

  const description = truncateToWords(stripMarkdown(post.body), 200)
  return {
    title: `${post.title} — StunpreX Community`,
    description,
    openGraph: {
      title: post.title,
      description,
      url: `https://stunprex.com/community/${slug}`,
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params

  const [post, currentProfile] = await Promise.all([
    getPostBySlug(slug),
    getCurrentProfile(),
  ])

  if (!post) notFound()

  const comments = buildCommentTree(await getCommentsByPost(post.id))

  return (
    <main className="min-h-screen bg-mint">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <PostDetail
          post={post}
          comments={comments}
          currentProfile={currentProfile}
        />
      </div>
    </main>
  )
}
