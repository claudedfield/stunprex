/**
 * /auth/verify — "Check your email" holding page.
 * Auth.js redirects here after verifyRequest (pages.verifyRequest config).
 */
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Check your email — StunpreX',
  robots: { index: false, follow: false },
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-mint flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="rounded-lg border border-deepblue/20 bg-white p-8">
          {/* Envelope icon */}
          <svg
            className="mx-auto mb-4 h-12 w-12 text-deepblue/40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>

          <h1 className="font-display text-xl font-bold text-deepblue mb-2">
            Check your email
          </h1>
          <p className="text-brown/70 font-body text-sm mb-4">
            We&rsquo;ve sent you a sign-in link. Click it to continue.
          </p>
          <p className="text-brown/45 font-body text-xs">
            The link expires in 15 minutes. If you don&rsquo;t see it,
            check your spam folder.
          </p>
        </div>

        <a
          href="/auth/sign-in"
          className="mt-4 inline-block text-xs font-ui text-brown/50 hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
        >
          ← Back to sign in
        </a>
      </div>
    </main>
  )
}
