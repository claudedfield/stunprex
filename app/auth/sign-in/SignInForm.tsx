'use client'
/**
 * Sign-in form — magic-link only.
 * No Google OAuth, no password (brief §3: magic-link only at v1).
 * Non-coercive copy; "No account?" handled gracefully.
 */
import { useState, useTransition } from 'react'
import { signInWithMagicLink } from '@/lib/community/actions'

export default function SignInForm() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append('email', email)
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
    return (
      <div className="rounded-lg border border-deepblue/20 bg-white p-6 text-center">
        <p className="font-body text-deepblue font-medium mb-1">Check your email</p>
        <p className="text-brown/70 font-body text-sm">{result.message}</p>
        <p className="text-brown/45 font-body text-xs mt-4">
          The link expires in 15 minutes. You can close this tab.
        </p>
      </div>
    )
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
            htmlFor="email"
            className="block font-ui text-sm font-medium text-deepblue mb-1"
          >
            Email address
          </label>
          <input
            id="email"
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
        <button
          type="submit"
          disabled={isPending || !email.includes('@')}
          className="w-full rounded bg-deepblue px-4 py-2.5 font-ui text-sm font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
        >
          {isPending ? 'Sending…' : 'Send sign-in link'}
        </button>
      </form>

      <p className="text-center text-xs text-brown/40 font-body">
        No account? Just enter your email — we&rsquo;ll create one.{' '}
        <a
          href="/auth/sign-up"
          className="text-deepblue underline underline-offset-2 hover:text-deepblue/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
        >
          Sign up
        </a>
      </p>
    </div>
  )
}
