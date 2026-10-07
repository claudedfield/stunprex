'use client'
/**
 * Sign-up form: the same mechanism as sign-in (a six-digit code by email, D-AUTH-02).
 * LEGAL-01a: no newsletter box here. The old box set a cookie nothing read, so a consent was
 * collected and never acted on; the newsletter is a link to its own page instead.
 */
import { useState, useTransition } from 'react'
import { signInWithMagicLink } from '@/lib/community/actions'
import { BotTrap, SignInCodeStep } from '@/components/auth/SignInCodeStep'

export default function SignUpForm() {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const fd = new FormData()
    fd.append('email', email)
    fd.append('website', website)
    // Where to land after signing in (?next=), checked on the server.
    fd.append('next', new URLSearchParams(window.location.search).get('next') ?? '')
    startTransition(async () => {
      const r = await signInWithMagicLink(fd)
      if (r.success && r.data) {
        setResult({ success: true, message: r.data.message })
      } else if (!r.success) {
        setResult({ error: r.error })
      }
    })
  }

  if (result?.success) {
    return <SignInCodeStep email={email} message={result.message} onBack={() => setResult(null)} />
  }

  return (
    <div className="rounded-lg border border-deepblue/20 bg-white p-6 space-y-5">
      {result?.error && (
        <p className="rounded bg-orange/10 px-3 py-2 text-sm text-orange font-body" role="alert">
          {result.error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="signup-email"
            className="block font-ui text-sm font-medium text-deepblue mb-1"
          >
            Email address
          </label>
          <input
            id="signup-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown placeholder:text-brown/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
            placeholder="you@example.com"
          />
        </div>

        <BotTrap value={website} onChange={setWebsite} />
        <button
          type="submit"
          disabled={isPending || !email.includes('@')}
          className="w-full rounded bg-deepblue px-4 py-2.5 font-ui text-sm font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
        >
          {isPending ? 'Sending…' : 'Continue with email'}
        </button>
        {/* LEGAL-01a: creating an account means accepting the terms; LEGAL-01d: the privacy link beside the action. */}
        <p className="text-center text-xs text-brown/50 font-body">
          Creating an account means accepting our{' '}
          <a href="/terms" className="text-deepblue underline underline-offset-2">
            Terms of Use
          </a>
          . See our{' '}
          <a href="/privacy" className="text-deepblue underline underline-offset-2">
            Privacy Notice
          </a>
          .
        </p>
      </form>

      <p className="text-xs text-brown/40 font-body text-center">
        No password. We send a one-time sign-in code.
      </p>
      <p className="text-xs text-brown/50 font-body text-center">
        Want the newsletter?{' '}
        <a href="/#newsletter" className="text-deepblue underline underline-offset-2">
          Subscribe here
        </a>
        .
      </p>
    </div>
  )
}
