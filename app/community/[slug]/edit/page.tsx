/**
 * /community/[slug]/edit — Edit own question.
 * Auth required; ownership or mod/admin role required.
 */
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getQuestionBySlug, getAllTags } from '@/lib/community/queries'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/types/community'
import EditQuestionForm from './EditQuestionForm'

export const metadata: Metadata = {
  title: 'Edit question — StunpreX Community',
  robots: { index: false, follow: false },
}

interface EditPageProps {
  params: Promise<{ slug: string }>
}

export default async function EditQuestionPage({ params }: EditPageProps) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(`/auth/sign-in?next=/community/${slug}/edit`)

  const [question, tags] = await Promise.all([
    getQuestionBySlug(slug),
    getAllTags(),
  ])

  if (!question) notFound()

  const userId = session.user.id
  const sessionUser = session.user as typeof session.user & { role?: string }
  const role = sessionUser.role ?? 'user'
  const canEdit =
    userId === question.author_id ||
    role === 'moderator' ||
    role === 'admin'

  if (!canEdit) redirect(`/community/${slug}`)

  return (
    <main className="min-h-[60vh] bg-mint">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <nav className="mb-3 text-xs font-ui text-brown/45" aria-label="Breadcrumb">
            <a href="/community" className="hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded">Community</a>
            <span className="mx-1.5" aria-hidden="true">/</span>
            <a href={`/community/${slug}`} className="hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded">Question</a>
            <span className="mx-1.5" aria-hidden="true">/</span>
            Edit
          </nav>
          <h1 className="font-display text-2xl font-bold text-deepblue">Edit question</h1>
        </header>

        <EditQuestionForm
          question={question}
          categories={ALL_CATEGORIES}
          categoryLabels={CATEGORY_LABELS}
          tags={tags}
        />
      </div>
    </main>
  )
}
