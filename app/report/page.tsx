/**
 * /report: report content or conduct on StunpreX (LEGAL-03.2). Open to anyone: no account, no
 * accepted terms. Posts link here with the item filled in (?type=&id=&url=); from the footer the
 * visitor gives the address. robots: noindex.
 */
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { auth } from '@/auth'
import { ReportForm } from './ReportForm'

export const metadata: Metadata = {
  title: { absolute: 'Report content · StunpreX' },
  description: 'Report a post, a comment or a page on StunpreX. Anyone can report; no account is needed.',
  robots: { index: false, follow: false },
}

const TYPES = ['question', 'answer', 'comment', 'user', 'other']

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ type?: string; id?: string; url?: string }> }) {
  const q = await searchParams
  const type = TYPES.includes(q.type ?? '') ? (q.type as string) : 'other'
  const id = typeof q.id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(q.id) ? q.id : ''
  const url = typeof q.url === 'string' && q.url.startsWith('/') && !q.url.startsWith('//') && q.url.length <= 300 && !/[\s<>"'\\]/.test(q.url) ? q.url : ''
  const session = await auth()

  return (
    <>
      <Header />
      <main id="main-content" className="bg-mint px-4 py-16 md:py-20 min-h-[60vh]">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="font-heading text-deepblue text-3xl mb-2">Report content</h1>
          <p className="text-brown/70 font-body text-sm mb-8">
            Tell us about a post, a comment or a page that you think breaks our rules or the law. Anyone can
            report; you do not need an account. A person reads every report.
          </p>
          <ReportForm type={type} id={id} url={url} signedIn={Boolean(session?.user?.id)} />
          <p className="mt-6 text-xs font-body text-brown/50">
            If someone is in immediate danger, call your local emergency number first (112 in the European Union).
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
