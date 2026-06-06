'use client'
/**
 * Sign-up form — same magic-link mechanism as sign-in.
 * Newsletter opt-in checkbox (default unchecked) stored in cookie for
 * the welcome page to pick up and save to the profile.
 */
import { useState, useTransition } from 'react'
import { signInWithMagicLink } from '@/lib/community/actions'

export default function SignUpForm() {
  const [email, setEmail] = useState('')
  const [newsletter, setNewsletter] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Store newsletter pref in a short-lived cookie for the welcome page to pick up
    if (newsletter) {
      document.cookie = `signup_newsletter=1; path=/; max-age=3600; SameSite=Lax`
    }

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
          Click the link to confirm your email and set up your profile.
          Link expires in 15 minutes.
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

        {/* Newsletter opt-in — default unchecked (brief §3) */}
        <div className="flex items-start gap-2.5">
          <input
            id="newsletter"
            type="checkbox"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-deepblue/30 text-deepblue accent-deepblue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
          />
          <label htmlFor="newsletter" className="text-xs font-body text-brown/60 leading-relaxed">
            Email me occasional updates from StunpreX — methodology notes, new content,
            and community highlights. You can unsubscribe any time.
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending || !email.includes('@')}
          className="w-full rounded bg-deepblue px-4 py-2.5 font-ui text-sm font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
        >
          {isPending ? 'Sending…' : 'Continue with email'}
        </button>
      </form>

      <p className="text-xs text-brown/40 font-body text-center">
        We&rsquo;ll send a one-click sign-in link. No password, no tracking.
      </p>
    </div>
  )
}
