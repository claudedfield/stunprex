/**
 * /auth/sign-in — Sign-in page.
 * Magic-link (email OTP) as primary method; Google OAuth as secondary.
 * No password auth at v1 (COO Q3).
 */
import type { Metadata } from 'next'
import SignInForm from './SignInForm'

export const metadata: Metadata = {
  title: 'Sign in — StunpreX Community',
  description: 'Sign in to join the StunpreX community.',
  robots: { index: false, follow: false },
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
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
        <SignInForm searchParams={searchParams} />
      </div>
    </main>
  )
}
