// /newsletter (D-NEWS-01): subscribe, and the archive of every issue sent.
import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { PageHero } from '@/components/PageHero'
import { SignupForm } from '@/components/newsletter/SignupForm'
import { listIssues } from '@/lib/newsletter/issues.mjs'
import { newsletterReady } from '@/lib/newsletter/core.mjs'

// Read at request time: whether sign-ups are open depends on the server's environment.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Newsletter',
  description: 'A weekly dispatch on individual soccer player development: methodology pieces and a drill of the week. Double opt-in, no tracking.',
  alternates: { canonical: '/newsletter' },
}

export default function NewsletterPage() {
  const issues = listIssues()
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        <PageHero eyebrow="Newsletter" title="A weekly dispatch on individual development"
          lede="Methodology pieces and a drill of the week, from stunprex.com. No hype, no tracking, and one click to unsubscribe." />
        <section className="py-12">
          <div className="container-site max-w-2xl">
            {newsletterReady() ? <SignupForm source="newsletter-page" /> : (
              <p className="font-body text-brown/80">Sign-ups open here soon.</p>
            )}
            <h2 className="font-heading text-deepblue text-2xl mt-14 mb-4">Past issues</h2>
            {issues.length === 0 ? (
              <p className="font-body text-brown/70">The first issue on stunprex.com is coming soon.</p>
            ) : (
              <ul className="space-y-3">
                {issues.map((i) => (
                  <li key={i.meta.slug}>
                    <Link href={`/newsletter/${i.meta.slug}`} className="font-body text-deepblue underline underline-offset-2">
                      #{i.meta.number}: {i.meta.subject}
                    </Link>
                    {i.meta.send_date ? <span className="ml-2 text-sm text-brown/60">{i.meta.send_date}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
