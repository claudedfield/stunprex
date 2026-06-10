/**
 * /community/ask — New question form with preview step.
 * Auth required. Redirect to sign-in if not authenticated.
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getAllTags } from '@/lib/community/queries'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/types/community'
import type { QuestionCategory } from '@/lib/types/community'
import AskForm from './AskForm'

export const metadata: Metadata = {
  title: 'Ask a question — StunpreX Community',
  description: 'Ask a question about football player development.',
  robots: { index: false, follow: false },
}

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/sign-in?next=/community/ask')
  }

  const [tags, params] = await Promise.all([getAllTags(), searchParams])

  const initialCategory =
    params.category && ALL_CATEGORIES.includes(params.category as QuestionCategory)
      ? (params.category as QuestionCategory)
      : null

  return (
    <main className="min-h-[60vh] bg-mint">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <nav className="mb-3 text-xs font-ui text-brown/45" aria-label="Breadcrumb">
            <a href="/community" className="hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded">
              Community
            </a>
            <span className="mx-1.5" aria-hidden="true">/</span>
            Ask a question
          </nav>
          <h1 className="font-display text-2xl font-bold text-deepblue">
            Ask a question
          </h1>
          <p className="mt-1 text-sm text-brown/60 font-body max-w-xl">
            Be specific. A good question has context, a clear ask, and shows you&rsquo;ve
            thought about it. Short questions often get poor answers.
          </p>
        </header>

        <AskForm
          categories={ALL_CATEGORIES}
          categoryLabels={CATEGORY_LABELS}
          tags={tags}
          initialCategory={initialCategory}
        />
      </div>
    </main>
  )
}
