'use client'
/**
 * Sign-in form Client Component.
 * Handles magic-link email submission and Google OAuth button.
 * Shows calm, non-coercive copy (Codex Q8 UX discipline).
 */
import { useState, useTransition } from 'react'
import { signInWithMagicLink, signInWithGoogle } from '@/lib/community/actions'

export default function SignInForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append('email', email)
    startTransition(async () => {
      const r = await signInWithMagicLink(fd)
      setResult(r)
    })
  }

  function handleGoogle() {
    startTransition(async () => {
      await signInWithGoogle()
    })
  }

  if (result?.success) {
    return (
      <div className="rounded-lg border border-deepblue/20 bg-white p-6 text-center">
        <p className="font-body text-deepblue font-medium mb-1">Check your email</p>
        <p className="text-brown/70 font-body text-sm">{result.message}</p>
        <p className="text-brown/50 font-body text-xs mt-4">
          The link expires in 1 hour. You can close this tab.
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

      <form onSubmit={handleMagicLink} className="space-y-4">
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
          disabled={isPending || !email}
          className="w-full rounded bg-deepblue px-4 py-2.5 font-ui text-sm font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
        >
          {isPending ? 'Sending…' : 'Send sign-in link'}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-deepblue/10" />
        <span className="text-xs text-brown/40 font-ui">or</span>
        <div className="h-px flex-1 bg-deepblue/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded border border-deepblue/20 px-4 py-2.5 font-ui text-sm font-medium text-brown transition-colors hover:bg-mint/60 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
      >
        {/* Google SVG icon — inline to avoid external fetch */}
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-xs text-brown/40 font-body">
        No account? Just enter your email above — we&rsquo;ll create one for you.
      </p>
    </div>
  )
}
