'use client'

import { useState, useTransition } from 'react'
import { sendGoogleConfirmCode } from '@/lib/community/actions'
import { SignInCodeStep } from '@/components/auth/SignInCodeStep'

export function GoogleConfirmStep({ email }: { email: string }) {
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (sent) return <SignInCodeStep email={email} message={sent} onBack={() => setSent(null)} />

  return (
    <div className="space-y-4 font-body text-sm text-brown">
      <p>
        You signed in with Google as <strong>{email}</strong>. This address is not a Gmail or Google
        Workspace address, so we email you a six-digit code once, to confirm it is yours. After that,
        Google sign-in is one click.
      </p>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => {
          setError(null)
          const r = await sendGoogleConfirmCode()
          if (r.success && r.data) setSent(r.data.message)
          else if (!r.success) setError(r.error)
        })}
        className="w-full rounded bg-deepblue px-4 py-2.5 font-ui text-sm font-medium text-mint hover:bg-deepblue/90 disabled:opacity-60"
      >
        {isPending ? 'Sending…' : 'Email me the code'}
      </button>
    </div>
  )
}
