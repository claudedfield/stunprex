/**
 * /signin — Canonical magic-link sign-in page.
 * Auth.js pages.signIn points here (auth.config.ts + auth.ts).
 * /auth/sign-in redirects 308 to here.
 */
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import SignInForm from '../auth/sign-in/SignInForm'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { safeNext } from '@/lib/auth/next'

export const metadata: Metadata = {
  title: { absolute: 'Sign in · StunpreX' },
  description: 'Sign in to the StunpreX community with a magic link. No password required.',
  robots: { index: false, follow: false },
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  // A signed-in visitor has no use for this form: on to where they were going.
  const session = await auth()
  if (session?.user?.id) redirect(safeNext((await searchParams).next))
  return (
    <>
      <Header />
      <main
        id="main-content"
        className="bg-mint flex items-center justify-center px-4 py-16 md:py-24 min-h-[60vh]"
      >
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-heading text-deepblue text-3xl mb-2">
              Sign in
            </h1>
            <p className="text-brown/70 font-body text-sm">
              Enter your email and we&rsquo;ll send you a sign-in link.
              No password required.
            </p>
          </div>
          <SignInForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
