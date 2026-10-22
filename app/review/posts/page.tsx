/** /review/posts (staging only): articles in content/posts that are drafts, so have no public page yet. */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { reviewOpen, pendingPages } from '@/lib/review'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: { absolute: 'Articles not yet published · StunpreX test site' }, robots: { index: false, follow: false } }

export default function ReviewPostsPage() {
  if (!reviewOpen()) notFound()
  const drafts = pendingPages().filter((p) => p.path.startsWith('/review/posts/'))
  return (
    <>
      <Header />
      <main id="main-content" className="container-site min-h-[60vh] py-12">
        <h1 className="font-heading text-deepblue text-3xl mb-6">Articles not yet published</h1>
        {drafts.length === 0 ? (
          <p className="font-body text-brown/70">None.</p>
        ) : (
          <ul className="space-y-3" data-review-drafts>
            {drafts.map((p) => (
              <li key={p.path}><Link href={p.path} className="font-heading text-lg text-deepblue hover:underline">{p.title}</Link></li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  )
}
