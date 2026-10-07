/**
 * /auth/verify: where the link in the sign-in mail leads (D-AUTH-02).
 *
 * With ?token=, the page shows one button. Pressing it is a POST that finishes the sign-in, so a
 * mail scanner that only fetches the link signs nobody in and makes no account. Without a token,
 * or after an expired one, it says what to do next.
 */
import type { Metadata } from 'next'
import { signInWithLink } from '@/lib/community/actions'

export const metadata: Metadata = {
  title: { absolute: 'Sign in · StunpreX' },
  robots: { index: false, follow: false },
  // The token must not travel to any other page as a referrer.
  referrer: 'no-referrer',
}

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string; expired?: string }> }) {
  const { token, expired } = await searchParams
  const hasToken = typeof token === 'string' && /^[A-Za-z0-9_-]{20,100}$/.test(token)

  return (
    <main id="main-content" className="min-h-screen bg-mint flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="rounded-lg border border-deepblue/20 bg-white p-8">
          {hasToken && !expired ? (
            <form action={signInWithLink} data-signin-step="link">
              <h1 className="font-display text-xl font-bold text-deepblue mb-2">Sign in to StunpreX</h1>
              <p className="text-brown/70 font-body text-sm mb-6">
                Press the button to finish signing in on this device.
              </p>
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="w-full rounded bg-deepblue px-4 py-2.5 font-ui text-sm font-medium text-white transition-colors hover:bg-deepblue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
              >
                Sign in
              </button>
              <p className="text-brown/45 font-body text-xs mt-4">The link lasts 15 minutes and works once.</p>
            </form>
          ) : expired ? (
            <div data-signin-step="expired">
              <h1 className="font-display text-xl font-bold text-deepblue mb-2">This link no longer works</h1>
              <p className="text-brown/70 font-body text-sm">
                It has expired, was already used, or a newer sign-in mail replaced it. Ask for a new code.
              </p>
            </div>
          ) : (
            <div data-signin-step="wait">
              <h1 className="font-display text-xl font-bold text-deepblue mb-2">Check your email</h1>
              <p className="text-brown/70 font-body text-sm mb-4">
                We&rsquo;ve sent you a six-digit sign-in code, and a link.
              </p>
              <p className="text-brown/45 font-body text-xs">
                Both last 15 minutes. If you don&rsquo;t see the mail, check your spam folder.
              </p>
            </div>
          )}
        </div>

        <a
          href="/signin"
          className="mt-4 inline-block text-xs font-ui text-brown/50 hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
        >
          ← Back to sign in
        </a>
      </div>
    </main>
  )
}
