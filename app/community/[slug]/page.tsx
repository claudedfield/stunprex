/**
 * /community/[slug] — Question detail page.
 * Public read. QAPage + BreadcrumbList JSON-LD. Server-rendered.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
  getQuestionBySlug,
  getAnswersByQuestion,
  getComments,
} from '@/lib/community/queries'
import { truncateToWords, stripMarkdown } from '@/lib/community/utils'
import { CATEGORY_LABELS } from '@/lib/types/community'
import QuestionDetail from './QuestionDetail'

interface QuestionPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: QuestionPageProps): Promise<Metadata> {
  const { slug } = await params
  const question = await getQuestionBySlug(slug)
  if (!question) return { title: 'Not found — StunpreX Community' }

  const description = truncateToWords(stripMarkdown(question.body), 155)
  return {
    title: `${question.title} — StunpreX Community`,
    description,
    openGraph: {
      title: question.title,
      description,
      url: `https://stunprex.com/community/${slug}`,
      type: 'article',
      publishedTime: question.created_at,
      modifiedTime: question.updated_at,
    },
    alternates: {
      canonical: `https://stunprex.com/community/${slug}`,
    },
  }
}

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { slug } = await params
  const session = await auth()
  const viewerUserId = session?.user?.id

  const question = await getQuestionBySlug(slug, viewerUserId)
  if (!question) notFound()

  const [answers, questionComments] = await Promise.all([
    getAnswersByQuestion(question.id, viewerUserId),
    getComments('question', question.id),
  ])

  // Fetch comments for all answers in parallel
  const answerCommentMap = new Map<string, Awaited<ReturnType<typeof getComments>>>()
  await Promise.all(
    answers.map(async (a) => {
      const comments = await getComments('answer', a.id)
      answerCommentMap.set(a.id, comments)
    })
  )

  const isAuthenticated = !!session?.user?.id
  const currentUserId = session?.user?.id
  const currentUserRole = (session?.user as ({ role?: string } | null | undefined))?.role ?? 'user'

  // JSON-LD: QAPage + BreadcrumbList
  const siteUrl = 'https://stunprex.com'
  const pageUrl = `${siteUrl}/community/${slug}`
  const categoryLabel = CATEGORY_LABELS[question.category]
  const questionDescription = truncateToWords(stripMarkdown(question.body), 300)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'QAPage',
        '@id': pageUrl,
        url: pageUrl,
        name: question.title,
        description: questionDescription,
        mainEntity: {
          '@type': 'Question',
          name: question.title,
          text: questionDescription,
          dateCreated: question.created_at,
          author: {
            '@type': 'Person',
            name: question.author.display_name,
          },
          answerCount: question.answer_count,
          ...(question.accepted_answer_id && answers.length > 0
            ? {
                acceptedAnswer: answers
                  .filter((a) => a.id === question.accepted_answer_id)
                  .map((a) => ({
                    '@type': 'Answer',
                    text: truncateToWords(stripMarkdown(a.body), 300),
                    dateCreated: a.created_at,
                    author: { '@type': 'Person', name: a.author.display_name },
                    upvoteCount: a.upvote_count,
                  }))[0],
              }
            : {}),
          suggestedAnswer: answers
            .filter((a) => a.id !== question.accepted_answer_id)
            .slice(0, 3)
            .map((a) => ({
              '@type': 'Answer',
              text: truncateToWords(stripMarkdown(a.body), 200),
              dateCreated: a.created_at,
              author: { '@type': 'Person', name: a.author.display_name },
              upvoteCount: a.upvote_count,
            })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Community', item: `${siteUrl}/community` },
          { '@type': 'ListItem', position: 3, name: categoryLabel, item: `${siteUrl}/community/category/${question.category}` },
          { '@type': 'ListItem', position: 4, name: question.title, item: pageUrl },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main id="main-content" className="min-h-screen bg-mint">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <QuestionDetail
            question={question}
            answers={answers}
            questionComments={questionComments}
            answerCommentMap={Object.fromEntries(answerCommentMap)}
            isAuthenticated={isAuthenticated}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
