/**
 * /signin — Canonical magic-link sign-in page.
 * Auth.js pages.signIn points here (auth.config.ts + auth.ts).
 * /auth/sign-in redirects 308 to here.
 */
import type { Metadata } from 'next'
import SignInForm from '../auth/sign-in/SignInForm'

export const metadata: Metadata = {
  title: 'Sign in — StunpreX',
  description: 'Sign in to the StunpreX community with a magic link. No password required.',
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-mint flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-deepblue mb-2">
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
  )
}
