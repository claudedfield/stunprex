// /newsletter/unsubscribe?token=... (D-NEWS-01): the visible link in every issue. One click, no question.
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { LinkLanding } from '@/components/newsletter/LinkLanding'

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen py-16">
        <div className="container-site max-w-xl space-y-4">
          <h1 className="font-heading text-deepblue text-3xl">Newsletter</h1>
          <LinkLanding action="unsubscribe" token={token}
            done={<p className="font-body text-brown">You are unsubscribed. We will not send you the newsletter again.</p>}
            invalid={<p className="font-body text-brown">This unsubscribe link is not valid. If you still receive the newsletter, reply to any issue and we remove you by hand.</p>} />
        </div>
      </main>
      <Footer />
    </>
  )
}
