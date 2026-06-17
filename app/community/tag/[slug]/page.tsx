/**
 * /community/tag/[slug] — Tag filter page.
 * Lists all questions with this tag. Public read.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getQuestions, getTagBySlug, getAllTags } from '@/lib/community/queries'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/types/community'
import type { SortOrder } from '@/lib/types/community'
import CommunityIndex from '../../CommunityIndex'

export const revalidate = 60

interface TagPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params
  const tag = await getTagBySlug(slug)
  if (!tag) return { title: 'Not found' }
  return {
    title: `#${tag.label} — StunpreX Community`,
    description:
      tag.description ??
      `Questions tagged ${tag.label} in the StunpreX football development community.`,
    alternates: { canonical: `https://stunprex.com/community/tag/${slug}` },
  }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params
  const tag = await getTagBySlug(slug)
  if (!tag) notFound()

  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const sort: SortOrder =
    sp.sort === 'top' || sp.sort === 'unanswered' ? (sp.sort as SortOrder) : 'newest'

  const [{ items: questions, total, totalPages }, allTags] = await Promise.all([
    getQuestions({ tagSlug: slug, page, perPage: 20, sort }),
    getAllTags(),
  ])

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-mint">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <nav className="mb-2 text-xs font-ui text-brown/45" aria-label="Breadcrumb">
            <a href="/community" className="hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded">
              Community
            </a>
            <span className="mx-1.5" aria-hidden="true">/</span>
            #{tag.label}
          </nav>
          <h1 className="font-display text-3xl font-bold text-deepblue">
            #{tag.label}
          </h1>
          {tag.description && (
            <p className="mt-1 text-sm text-brown/60 font-body">{tag.description}</p>
          )}
          <p className="mt-0.5 text-xs text-brown/40 font-ui">
            {tag.question_count} question{tag.question_count !== 1 ? 's' : ''}
          </p>
        </header>

        <CommunityIndex
          questions={questions}
          total={total}
          totalPages={totalPages}
          currentPage={page}
          currentSort={sort}
          tags={allTags}
          categories={ALL_CATEGORIES}
          categoryLabels={CATEGORY_LABELS}
        />
      </div>
      </main>
      <Footer />
    </>
  )
}
