/**
 * /community — Question index.
 * Public read. Paginated, category-filtered, sortable.
 * Revalidates at most every 60s (ISR).
 */
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { PageHero } from '@/components/PageHero'
import { getQuestions, getAllTags } from '@/lib/community/queries'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/types/community'
import type { QuestionCategory, SortOrder } from '@/lib/types/community'
import CommunityIndex from './CommunityIndex'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Community — StunpreX',
  description:
    'Questions, answers, and observations on football player development. Ask anything — methodology, coaching, player progress, parent corner.',
  openGraph: {
    title: 'Community — StunpreX',
    description: 'A calm, methodology-grounded Q&A community for football development.',
    url: 'https://stunprex.com/community',
  },
}

interface CommunityPageProps {
  searchParams: Promise<{
    category?: string
    page?: string
    q?: string
    sort?: string
  }>
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams
  const category = ALL_CATEGORIES.includes(params.category as QuestionCategory)
    ? (params.category as QuestionCategory)
    : undefined
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const search = params.q?.trim() || undefined
  const sort: SortOrder =
    params.sort === 'top' || params.sort === 'unanswered'
      ? (params.sort as SortOrder)
      : 'newest'

  const [{ items: questions, total, totalPages }, tags] = await Promise.all([
    getQuestions({ category, page, perPage: 20, search, sort }),
    getAllTags(),
  ])

  return (
    <>
      <Header />
      <main id="main-content">
        <PageHero
          eyebrow="Community"
          title="Questions, answered"
          lede="Real developmental questions, answered in the StunpreX Coach voice — calm, evidence-grounded, and methodology-first. Browse by category, or ask your own."
        >
          <a
            href="/community/ask"
            className="inline-flex items-center gap-1.5 rounded bg-orange px-5 py-2.5 text-sm font-ui font-medium text-white transition-colors hover:bg-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 focus-visible:ring-offset-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Ask a question
          </a>
        </PageHero>

        <section className="container-site py-12">
          <div className="mx-auto max-w-4xl">
            <CommunityIndex
              questions={questions}
              total={total}
              totalPages={totalPages}
              currentPage={page}
              currentCategory={category}
              currentSearch={search}
              currentSort={sort}
              tags={tags}
              categories={ALL_CATEGORIES}
              categoryLabels={CATEGORY_LABELS}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
