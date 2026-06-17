'use client'
/**
 * EmailCaptureForm — working newsletter capture (posts to /api/newsletter, stored
 * in Postgres). Two variants:
 *   - 'block'  : large centred form (home newsletter section)
 *   - 'inline' : compact form (footer, end-of-article CTA)
 * Progressive enhancement: also works as a plain POST form if JS is disabled
 * (the API redirects in that case); with JS it submits via fetch and shows an
 * inline confirmation without a page reload.
 */
import { useState, type FormEvent } from 'react'

interface Props {
  source?: string
  variant?: 'block' | 'inline'
  className?: string
}

export function EmailCaptureForm({ source = 'site', variant = 'block', className = '' }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setStatus('success')
        setMessage("You're on the list. The first issue lands when it's ready, not before.")
      } else {
        setStatus('error')
        setMessage(
          data.error === 'invalid email'
            ? 'Please enter a valid email address.'
            : 'Something went wrong — please try again.'
        )
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong — please try again.')
    }
  }

  const isInline = variant === 'inline'

  if (status === 'success') {
    return (
      <p
        role="status"
        className={
          isInline
            ? `text-sm ${className}`
            : `font-body text-deepblue ${className}`
        }
      >
        ✓ {message}
      </p>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      action="/api/newsletter"
      method="post"
      className={
        isInline
          ? `flex flex-col gap-2 ${className}`
          : `flex flex-col sm:flex-row gap-3 justify-center ${className}`
      }
    >
      <input type="hidden" name="source" value={source} />
      <label htmlFor={`nl-email-${source}`} className="sr-only">
        Email address
      </label>
      <input
        id={`nl-email-${source}`}
        type="email"
        name="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        aria-invalid={status === 'error'}
        className={
          isInline
            ? 'w-full rounded-md border border-white/25 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-orange/50'
            : 'flex-1 max-w-sm px-5 py-3 rounded-md border border-deepblue/25 bg-white font-body text-brown focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange'
        }
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className={
          isInline
            ? 'rounded-md bg-orange px-4 py-2 text-sm font-ui font-medium text-white transition-colors hover:bg-orange/90 disabled:opacity-60'
            : 'btn-primary disabled:opacity-60'
        }
      >
        {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <p role="alert" className={isInline ? 'text-xs text-orange-200' : 'sm:basis-full text-sm text-orange'}>
          {message}
        </p>
      )}
    </form>
  )
}
