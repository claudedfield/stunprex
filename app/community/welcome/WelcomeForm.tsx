'use client'
/**
 * WelcomeForm — one-click "I'm ready" button on the first-time onboarding page.
 * Calls completeOnboarding() server action to flip profiles.onboarded = true,
 * then redirects to /community via the action's own redirect().
 * Cookie-based newsletter opt-in (set in SignUpForm) is picked up by completeOnboarding.
 */
import { useTransition } from 'react'
import { completeOnboarding } from '@/lib/community/actions'
import { trackSignupCompleted } from '@/lib/analytics/events'

export default function WelcomeForm() {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Fired on submit, not after the server action: completeOnboarding() ends in a
    // redirect(), which throws by design and would skip any code placed after the await.
    trackSignupCompleted()
    startTransition(async () => {
      await completeOnboarding()
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center rounded bg-deepblue px-6 py-2.5 text-sm font-ui font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
      >
        {isPending ? 'One moment…' : 'Go to the community →'}
      </button>
    </form>
  )
}
