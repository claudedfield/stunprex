'use client'
/**
 * D-AUTH-02: the second step of signing in, shared by the sign-in and sign-up forms. The visitor
 * types the six-digit code from the mail; the server answers with Auth.js's callback address,
 * and the browser goes there. BotTrap is the field no person sees: a request that fills it is
 * answered like a real one and is not mailed.
 */
import { useState, useTransition } from 'react'
import { signInWithCode } from '@/lib/community/actions'

export function BotTrap({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
      <label htmlFor="website">Website</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

export function SignInCodeStep({ email, message, onBack }: { email: string; message?: string; onBack: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCode(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append('email', email)
    fd.append('code', code)
    startTransition(async () => {
      const r = await signInWithCode(fd)
      if (r.success && r.data) window.location.assign(r.data.url)
      else if (!r.success) setError(r.error)
    })
  }

  return (
    <div className="rounded-lg border border-deepblue/20 bg-white p-6 text-center" data-signin-step="code">
      <p className="font-body text-deepblue font-medium mb-1">Check your email</p>
      <p className="text-brown/70 font-body text-sm">{message}</p>
      <form onSubmit={handleCode} className="mt-5 space-y-3" noValidate>
        <label htmlFor="signin-code" className="block font-ui text-sm font-medium text-deepblue">
          Six-digit code
        </label>
        <input
          id="signin-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]*"
          maxLength={7}
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(null) }}
          className="w-40 mx-auto block rounded border border-deepblue/20 px-3 py-2 text-center font-mono text-lg tracking-widest text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
        />
        {error && (
          <p className="rounded bg-orange/10 px-3 py-2 text-sm text-orange font-body" role="alert" data-signin-code-error>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending || code.replace(/\D/g, '').length !== 6}
          className="w-full rounded bg-deepblue px-4 py-2.5 font-ui text-sm font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
        >
          {isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-brown/45 font-body text-xs mt-4">
        The code lasts 15 minutes. The email also has a link, if you would rather open it on the
        device where you read your mail.
      </p>
      <button type="button" onClick={onBack} className="mt-3 text-xs font-ui text-deepblue underline underline-offset-2">
        Use a different address, or send a new code
      </button>
    </div>
  )
}
