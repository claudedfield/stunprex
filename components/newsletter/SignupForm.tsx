'use client'
/**
 * D-NEWS-01: the newsletter sign-up. Name and email (the consent record carries the name, Grt. 6. § (2)),
 * posted to our own API (never in a URL); a hidden
 * `website` field catches bots. The age line (LEGAL-01b) and the privacy link (LEGAL-01d) sit
 * beside the action.
 */
import { useState } from 'react'

export function SignupForm({ source = 'site' }: { source?: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<{ ok?: boolean; message?: string } | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const website = (new FormData(e.currentTarget).get('website') as string) ?? ''
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, source, website }),
      })
      setState(await res.json())
    } catch {
      setState({ ok: false, message: 'Something went wrong. Please try again later.' })
    }
    setPending(false)
  }

  if (state?.ok) {
    return <p role="status" data-newsletter-result className="rounded border border-deepblue/20 bg-white p-4 font-body text-brown">{state.message}</p>
  }
  return (
    <form onSubmit={submit} data-newsletter-form className="space-y-3" noValidate>
      {state?.message ? <p role="alert" className="rounded bg-orange/10 px-3 py-2 text-sm text-orange font-body">{state.message}</p> : null}
      {/* LEGAL-02.6: what subscribing means, above the button. */}
      <p className="text-sm text-brown/80 font-body">By subscribing you agree that DField Kft. (StunpreX) emails you its newsletter, which also presents StunpreX content and services, until you unsubscribe.</p>
      <label htmlFor="newsletter-name" className="block font-ui text-sm font-medium text-deepblue">Your name</label>
      <input id="newsletter-name" type="text" name="name" autoComplete="name" required maxLength={80} value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40" />
      <label htmlFor="newsletter-email" className="block font-ui text-sm font-medium text-deepblue">Email address</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="newsletter-email" type="email" name="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40" />
        <button type="submit" disabled={pending || !name.trim() || !email.includes('@')} className="btn-primary whitespace-nowrap disabled:opacity-50">
          {pending ? 'Sending…' : 'Subscribe'}
        </button>
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="newsletter-website">Leave this empty</label>
        <input id="newsletter-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-xs text-brown/60 font-body">We keep your name with the record of your consent, as Hungarian law requires, and use it to greet you.</p>
      <p className="text-xs text-brown/60 font-body">We send a link to confirm first. Unsubscribe with one click in every issue. No tracking.</p>
      <p className="text-xs text-brown/60 font-body">For readers 16 and over. Parents are welcome to subscribe with their own address.</p>
      <p className="text-xs text-brown/60 font-body">
        How we use your data: <a href="/privacy" className="underline underline-offset-2">Privacy Notice</a>.
      </p>
    </form>
  )
}
