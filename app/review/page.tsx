/** /review (staging only): every page waiting for the owner's read, with its question. */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { reviewOpen, pendingPages } from '@/lib/review'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: { absolute: 'Review · StunpreX test site' }, robots: { index: false, follow: false } }

export default function ReviewPage() {
  if (!reviewOpen()) notFound()
  const pages = pendingPages()
  return (
    <>
      <Header />
      <main id="main-content" className="container-site min-h-[60vh] py-12">
        <h1 className="font-heading text-deepblue text-3xl mb-2">Waiting for your read</h1>
        <p className="font-body text-sm text-brown/70 mb-8">
          Each page has a bar at the bottom with one question and a box for your marks. Articles that
          have no page yet are under <Link href="/review/posts" className="underline text-deepblue">articles not yet published</Link>.
        </p>
        {pages.length === 0 ? (
          <p className="font-body text-brown/70" data-review-empty>Nothing is waiting.</p>
        ) : (
          <ul className="space-y-4" data-review-list>
            {pages.map((p) => (
              <li key={p.path} className="rounded border border-deepblue/10 bg-white p-4">
                <p className="font-ui text-[10px] uppercase tracking-widest text-orange">{p.kind}</p>
                <Link href={p.path} className="font-heading text-lg text-deepblue hover:underline">{p.title}</Link>
                <p className="mt-1 font-body text-sm text-brown/70">{p.question}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  )
}
