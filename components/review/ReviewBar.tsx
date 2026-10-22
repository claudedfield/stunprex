'use client'

/**
 * The review bar (OT-063): shown on staging only, on a page that asks for a read. It asks the
 * server first, so on production (where /api/review answers 404) nothing is shown.
 */
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type Ask = { question: string; answer: string }

export function ReviewBar() {
  const pathname = usePathname()
  const [ask, setAsk] = useState<Ask | null>(null)
  const [open, setOpen] = useState(true)
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    fetch(`/api/review?path=${encodeURIComponent(pathname)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live && d?.pending) setAsk({ question: d.question, answer: d.answer }) })
      .catch(() => {})
    return () => { live = false }
  }, [pathname])

  if (!ask) return null

  async function send() {
    setState('sending')
    const r = await fetch('/api/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: pathname, text }) })
    const d = await r.json().catch(() => ({}))
    if (r.ok && d.ok) { setState('saved'); setText('') } else { setState('error'); setError(d.error ?? 'Could not save the note.') }
  }

  return (
    <aside data-review-bar aria-label="Review this page"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-orange bg-white/95 shadow-lg backdrop-blur-sm">
      <div className="container-site py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-ui text-xs uppercase tracking-widest text-orange">Review (test site only)</p>
          <button type="button" onClick={() => setOpen(!open)} className="font-ui text-xs text-deepblue underline" aria-expanded={open}>
            {open ? 'Hide' : 'Show'}
          </button>
        </div>
        {open && (
          <div className="mt-2 space-y-2">
            <p className="font-body text-sm text-brown" data-review-question>{ask.question}</p>
            <p className="font-body text-xs text-brown/60" data-review-default>If you write nothing: {ask.answer}</p>
            <label htmlFor="review-note" className="sr-only">Your note</label>
            <textarea id="review-note" value={text} onChange={(e) => { setText(e.target.value); if (state !== 'sending') setState('idle') }}
              rows={3} maxLength={5000} placeholder="Your marks or your answer"
              className="w-full rounded border border-deepblue/25 bg-white px-3 py-2 font-body text-sm text-brown focus:outline-none focus:ring-2 focus:ring-deepblue/30" />
            <div className="flex items-center gap-3">
              <button type="button" onClick={send} disabled={!text.trim() || state === 'sending'}
                className="rounded bg-deepblue px-4 py-2 font-ui text-sm font-medium text-mint disabled:opacity-50">
                {state === 'sending' ? 'Saving…' : 'Save note'}
              </button>
              {state === 'saved' && <span role="status" className="font-ui text-xs text-deepblue" data-review-saved>Saved. You can add another.</span>}
              {state === 'error' && <span role="alert" className="font-ui text-xs text-red-700">{error}</span>}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
