'use client'
/**
 * D-NEWS-01: the page a confirm or unsubscribe link opens. The change is made by a POST from the
 * browser as the page opens, not by the page load itself, so a mail scanner that only fetches the
 * link changes nothing. No question is asked and nothing else needs clicking.
 */
import { useEffect, useState, type ReactNode } from 'react'

export function LinkLanding({ action, token, done, expired, invalid }: {
  action: 'confirm' | 'unsubscribe'; token: string; done: ReactNode; expired?: ReactNode; invalid: ReactNode
}) {
  const [outcome, setOutcome] = useState<'working' | 'done' | 'expired' | 'invalid'>('working')
  useEffect(() => {
    const req = action === 'confirm'
      ? fetch('/api/newsletter/confirm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })
      : fetch(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`, { method: 'POST' })
    req.then((r) => setOutcome(r.ok ? 'done' : r.status === 410 ? 'expired' : 'invalid')).catch(() => setOutcome('invalid'))
  }, [action, token])
  if (outcome === 'working') return <p className="font-body text-brown/70">One moment…</p>
  return <div data-landing={outcome}>{outcome === 'done' ? done : outcome === 'expired' ? (expired ?? invalid) : invalid}</div>
}
