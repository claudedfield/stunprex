/**
 * /community/category/[slug] — Category filter page.
 * Dedicated SEO-friendly page per category. Public read.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getQuestions, getAllTags } from '@/lib/community/queries'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/types/community'
import type { QuestionCategory, SortOrder } from '@/lib/types/community'
import CommunityIndex from '../../CommunityIndex'

export const revalidate = 60

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  if (!ALL_CATEGORIES.includes(slug as QuestionCategory)) return { title: 'Not found' }
  const label = CATEGORY_LABELS[slug as QuestionCategory]
  return {
    title: `${label} — StunpreX Community`,
    description: `Questions and answers on ${label.toLowerCase()} in football player development.`,
    alternates: { canonical: `https://stunprex.com/community/category/${slug}` },
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  if (!ALL_CATEGORIES.includes(slug as QuestionCategory)) notFound()

  const category = slug as QuestionCategory
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const sort: SortOrder =
    sp.sort === 'top' || sp.sort === 'unanswered' ? (sp.sort as SortOrder) : 'newest'

  const [{ items: questions, total, totalPages }, tags] = await Promise.all([
    getQuestions({ category, page, perPage: 20, sort }),
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
            {CATEGORY_LABELS[category]}
          </nav>
          <h1 className="font-display text-3xl font-bold text-deepblue">
            {CATEGORY_LABELS[category]}
          </h1>
        </header>

        <CommunityIndex
          questions={questions}
          total={total}
          totalPages={totalPages}
          currentPage={page}
          currentCategory={category}
          currentSort={sort}
          tags={tags}
          categories={ALL_CATEGORIES}
          categoryLabels={CATEGORY_LABELS}
        />
      </div>
      </main>
      <Footer />
    </>
  )
}
