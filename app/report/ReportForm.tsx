'use client'
/**
 * LEGAL-03.2: the report form. Open to anyone. A signed-in member is answered at the account's
 * address and is not asked for a name. Ticking the child-safety box makes name and email optional.
 */
import { useActionState, useState } from 'react'
import { submitPublicReport } from '@/lib/community/report-actions'

const field = 'w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40'
const label = 'block font-ui text-sm font-medium text-deepblue mb-1'

export function ReportForm({ type, id, url, signedIn }: { type: string; id: string; url: string; signedIn: boolean }) {
  const [state, action, pending] = useActionState(submitPublicReport, null)
  const [child, setChild] = useState(false)

  if (state?.ok) {
    return (
      <div role="status" data-report-result="sent" className="rounded-lg border border-deepblue/20 bg-white p-6">
        <p className="font-body text-deepblue font-medium mb-1">Thank you. We have your report.</p>
        <p className="font-body text-sm text-brown/75">
          A person will look at it. If you gave an email address, or reported while signed in, we write to you
          now to confirm, and again with the outcome.
        </p>
      </div>
    )
  }

  return (
    <form action={action} data-report-form className="rounded-lg border border-deepblue/20 bg-white p-6 space-y-5" noValidate>
      {state && !state.ok && (
        <p role="alert" data-report-result="error" className="rounded bg-orange/10 px-3 py-2 text-sm text-orange font-body">{state.error}</p>
      )}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={id} />

      <div>
        <label htmlFor="report-url" className={label}>What this is about</label>
        <input id="report-url" name="url" type="text" defaultValue={url} readOnly={Boolean(url)} required
          placeholder="/community/…" className={`${field} ${url ? 'bg-mint/60 text-brown/70' : ''}`} />
        <p className="mt-1 text-xs font-body text-brown/50">
          {url ? 'The address of the post or page you are reporting.' : 'The address of the page or post on stunprex.com.'}
        </p>
      </div>

      <div>
        <label htmlFor="report-what" className={label}>What is wrong, and why</label>
        <textarea id="report-what" name="what" required rows={5} maxLength={3000} className={`${field} resize-y`} />
      </div>

      <div className="flex items-start gap-2">
        <input id="report-child" name="child_safety" type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-deepblue/30" />
        <label htmlFor="report-child" className="font-body text-sm text-brown">
          This is about the sexual abuse or exploitation of a child.
          <span className="block text-xs text-brown/60">If you tick this, you do not have to give your name or an email address.</span>
        </label>
      </div>

      {signedIn ? (
        <p className="font-body text-sm text-brown/70" data-report-contact="member">
          You are signed in. We will answer you at your account&rsquo;s email address.
        </p>
      ) : (
        <fieldset className="space-y-3" data-report-contact="visitor">
          <legend className="font-ui text-sm font-medium text-deepblue">
            Your name and email, so that we can answer you{child ? ' (optional)' : ''}
          </legend>
          <div>
            <label htmlFor="report-name" className={label}>Name{child ? ' (optional)' : ''}</label>
            <input id="report-name" name="name" type="text" autoComplete="name" maxLength={80} required={!child} className={field} />
          </div>
          <div>
            <label htmlFor="report-email" className={label}>Email address{child ? ' (optional)' : ''}</label>
            <input id="report-email" name="email" type="email" autoComplete="email" maxLength={254} required={!child} className={field} />
          </div>
          <p className="text-xs font-body text-brown/50">
            We use them only to answer you about this report. See our{' '}
            <a href="/privacy" className="text-deepblue underline underline-offset-2">Privacy Notice</a>.
          </p>
        </fieldset>
      )}

      {/* Bot trap: hidden from people and from assistive technology; a filled value means nothing is stored. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="report-website">Website</label>
        <input id="report-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-start gap-2">
        <input id="report-good-faith" name="good_faith" type="checkbox" required className="mt-1 h-4 w-4 rounded border-deepblue/30" />
        <label htmlFor="report-good-faith" className="font-body text-sm text-brown">
          I believe, in good faith, that what I report is accurate and complete.
        </label>
      </div>

      <button type="submit" disabled={pending}
        className="rounded bg-deepblue px-4 py-2.5 font-ui text-sm font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1">
        {pending ? 'Sending…' : 'Send report'}
      </button>
    </form>
  )
}
