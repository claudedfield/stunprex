// /newsletter/<slug> (D-NEWS-01): an issue on the web, built from the same file the mail is sent from.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SignupForm } from '@/components/newsletter/SignupForm'
import { findIssue, listIssues } from '@/lib/newsletter/issues.mjs'

export function generateStaticParams() {
  return listIssues().map((i) => ({ slug: i.meta.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const issue = findIssue((await params).slug)
  if (!issue) return {}
  return { title: issue.meta.title, description: issue.meta.preview, alternates: { canonical: `/newsletter/${issue.meta.slug}` } }
}

export default async function IssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const issue = findIssue((await params).slug)
  if (!issue) notFound()
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen py-16">
        <article className="container-site max-w-2xl">
          <p className="font-ui text-xs uppercase tracking-widest text-orange mb-2">Newsletter #{issue.meta.number}{issue.meta.send_date ? ` · ${issue.meta.send_date}` : ''}</p>
          <h1 className="font-heading text-deepblue text-3xl mb-8">{issue.meta.title}</h1>
          <div className="prose-site font-body text-brown leading-relaxed space-y-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.body}</ReactMarkdown>
          </div>
          {issue.meta.byline ? <p className="mt-8 font-body text-brown/80">{issue.meta.byline}</p> : null}
          <div className="mt-14 rounded-xl border border-deepblue/15 bg-deepblue/[0.03] p-6">
            <h2 className="font-heading text-deepblue text-xl mb-4">Get the next issue</h2>
            <SignupForm source={`issue-${issue.meta.number}`} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
