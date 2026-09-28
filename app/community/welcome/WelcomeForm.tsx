'use client'
/**
 * WelcomeForm: the terms step at the end of first-time onboarding (LEGAL-01a, 01b).
 *
 * Two separate, unticked checkboxes: the Terms of Use at the current version, and the age line.
 * The button stays disabled until both are ticked; completeOnboarding() checks both again on the
 * server, records the version and the times, marks the profile onboarded and redirects to /community.
 */
import { useState, useTransition } from 'react'
import { completeOnboarding } from '@/lib/community/actions'
import { trackSignupCompleted } from '@/lib/analytics/events'
import { TERMS_VERSION_LABEL } from '@/lib/legal'

export default function WelcomeForm() {
  const [terms, setTerms] = useState(false)
  const [age, setAge] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    // Fired on submit, not after the server action: completeOnboarding() ends in a
    // redirect(), which throws by design and would skip any code placed after the await.
    trackSignupCompleted()
    startTransition(async () => {
      const r = await completeOnboarding(fd)
      if (r && !r.success) setError(r.error)
    })
  }

  const box = 'mt-0.5 h-4 w-4 rounded border-deepblue/30 accent-deepblue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40'
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <p className="rounded bg-orange/10 px-3 py-2 text-sm text-orange font-body" role="alert">{error}</p>
      ) : null}
      <div className="flex items-start gap-2.5">
        <input id="accept_terms" name="accept_terms" type="checkbox" checked={terms}
          onChange={(e) => setTerms(e.target.checked)} className={box} />
        <label htmlFor="accept_terms" className="text-sm font-body text-brown/80 leading-relaxed">
          I have read and accept the{' '}
          <a href="/terms" className="text-deepblue underline underline-offset-2">Terms of Use</a>{' '}
          (version {TERMS_VERSION_LABEL}).
        </label>
      </div>
      <div className="flex items-start gap-2.5">
        <input id="confirm_age" name="confirm_age" type="checkbox" checked={age}
          onChange={(e) => setAge(e.target.checked)} className={box} />
        <label htmlFor="confirm_age" className="text-sm font-body text-brown/80 leading-relaxed">
          I am 16 or older. (Parents: use your own account; do not let a player under 16 use it.)
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending || !terms || !age}
        className="inline-flex items-center rounded bg-deepblue px-6 py-2.5 text-sm font-ui font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
      >
        {isPending ? 'One moment…' : 'Go to the community →'}
      </button>
    </form>
  )
}
