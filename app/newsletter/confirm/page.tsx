// /newsletter/confirm?token=... (D-NEWS-01): the link in the confirmation mail.
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { LinkLanding } from '@/components/newsletter/LinkLanding'
import { SignupForm } from '@/components/newsletter/SignupForm'

export const metadata: Metadata = { title: 'Confirm your subscription', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen py-16">
        <div className="container-site max-w-xl space-y-4">
          <h1 className="font-heading text-deepblue text-3xl">Newsletter</h1>
          <LinkLanding action="confirm" token={token}
            done={<p className="font-body text-brown">You are subscribed. The next issue comes to this address. Every issue has a one-click unsubscribe link.</p>}
            expired={<div className="space-y-4"><p className="font-body text-brown">This confirmation link has expired. Enter your address again and we send a new one.</p><SignupForm source="expired-link" /></div>}
            invalid={<div className="space-y-4"><p className="font-body text-brown">This link is not valid, or it has expired: a request that is not confirmed within 7 days is deleted. Enter your details again and we send a new link.</p><SignupForm source="invalid-link" /></div>} />
        </div>
      </main>
      <Footer />
    </>
  )
}
