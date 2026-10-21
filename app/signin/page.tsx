/**
 * /signin — Canonical magic-link sign-in page.
 * Auth.js pages.signIn points here (auth.config.ts + auth.ts).
 * /auth/sign-in redirects 308 to here.
 */
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import SignInForm from '../auth/sign-in/SignInForm'
import { auth } from '@/auth'
import { safeNext } from '@/lib/auth/next'
import { SignedInNotice } from '@/components/SignedInNotice'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { KeepSignedIn } from '@/components/auth/KeepSignedIn'

export const metadata: Metadata = {
  title: { absolute: 'Sign in · StunpreX' },
  description: 'Sign in to the StunpreX community with a code sent to your email. No password required.',
  robots: { index: false, follow: false },
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  // A signed-in visitor sees who they are and what they can do, not the form and not a silent
  // redirect (owner report, 4 Oct 2026).
  const session = await auth()
  const signedInAs = session?.user?.id
    ? ((session.user as { display_name?: string }).display_name ?? 'a member')
    : null
  const params = await searchParams
  const next = safeNext(params.next)
  // Auth.js sends a sign-in that did not finish back here with ?error= (a Google sign-in refused,
  // or its step expired). Its code is not shown; one plain sentence is.
  const failed = Boolean(params.error) && !signedInAs
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
              Enter your email and we&rsquo;ll send you a six-digit sign-in code.
              No password required.
            </p>
          </div>
          {failed && (
            <p role="alert" className="mb-5 rounded border border-orange/30 bg-white px-4 py-3 font-body text-sm text-brown" data-signin-error>
              That sign-in did not finish. Please try again, or sign in with a code sent to your email.
            </p>
          )}
          {signedInAs ? <SignedInNotice name={signedInAs} next={next} /> : <><KeepSignedIn /><GoogleButton next={next} /><SignInForm /></>}
        </div>
      </main>
      <Footer />
    </>
  )
}
