/**
 * /community/welcome — First-time onboarding page.
 * Auth.js redirects here after first sign-in (pages.newUser in auth.ts).
 * Once onboarded flag is set (via the form action), never shows again.
 *
 * Auth required. If already onboarded → redirect to /community.
 * robots: noindex (transient onboarding page; no SEO value).
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { auth } from '@/auth'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/types/community'
import WelcomeForm from './WelcomeForm'

export const metadata: Metadata = {
  title: 'Welcome — StunpreX Community',
  robots: { index: false, follow: false },
}

export default async function WelcomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/sign-in?next=/community/welcome')

  // If already onboarded, send straight to the community
  const onboarded = (session.user as typeof session.user & { onboarded?: boolean }).onboarded
  if (onboarded) redirect('/community')

  return (
    <>
      <Header />
      <main className="bg-mint">
        <section className="container-site py-16 md:py-20">
          <div className="mx-auto max-w-2xl">

            {/* Header */}
            <header className="mb-10">
              <p className="font-ui text-xs font-medium tracking-widest uppercase text-deepblue/50 mb-3">
                StunpreX Community
              </p>
              <h1 className="font-display text-3xl font-bold text-deepblue mb-5">
                Welcome.
              </h1>
              <p className="font-body text-base text-brown/80 leading-relaxed max-w-lg">
                This is a place for players, parents, coaches, and everyone who takes the game seriously
                on a long horizon. Ask questions, share what you&rsquo;ve learned, and engage with others
                who are building the same things you are — with patience and without shortcuts.
              </p>
              <p className="font-body text-sm text-brown/60 mt-3 leading-relaxed">
                Read anything without signing in. Post, answer, and upvote as a member.
                The bar for what belongs here is simple: genuine, useful, grounded.
              </p>
            </header>

            {/* Primary action — §2.2: CTA now points at /community/ask?category=General */}
            <section className="mb-8 rounded-lg border border-deepblue/15 bg-white/60 p-6">
              <h2 className="font-ui text-sm font-semibold text-deepblue mb-2">
                Your first move
              </h2>
              <p className="font-body text-sm text-brown/70 mb-4">
                Write your first post — share where you&rsquo;re at, who you&rsquo;re developing,
                what question you came here with.
              </p>
              <Link
                href="/community/ask?category=General"
                className="inline-flex items-center rounded bg-deepblue/8 border border-deepblue/20 px-4 py-2 text-sm font-ui text-deepblue hover:bg-deepblue/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
              >
                Write your first post →
              </Link>
            </section>

            {/* Secondary — browse by audience */}
            <section className="mb-10">
              <p className="font-ui text-xs font-medium text-brown/50 mb-3 uppercase tracking-wider">
                Or browse your area
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    href={`/community/category/${cat}`}
                    className="rounded-full bg-white border border-deepblue/20 px-3 py-1.5 text-xs font-ui text-brown/65 hover:text-deepblue hover:border-deepblue/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
                  >
                    {CATEGORY_LABELS[cat]}
                  </Link>
                ))}
              </div>
            </section>

            {/* Dismiss — marks onboarded in DB */}
            <WelcomeForm />

          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
