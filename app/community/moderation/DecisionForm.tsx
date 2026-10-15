'use client'
/**
 * LEGAL-03.2: a moderator's decision on a report, recorded with its reason. Where the reporter
 * can be reached, the server mails the outcome. Recording a decision does not itself hide or
 * remove anything: the moderator does that on the post, then records it here.
 */
import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { decideReport } from '@/lib/community/report-actions'

export function DecisionForm({ reportId, canAnswer }: { reportId: string; canAnswer: boolean }) {
  const [state, action, pending] = useActionState(decideReport, null)
  const router = useRouter()
  // Held in state: React clears an uncontrolled form after its action runs, and a moderator who is
  // sent back for a longer reason must not lose the decision already chosen.
  const [decision, setDecision] = useState('')
  const [reason, setReason] = useState('')
  // Once recorded, the queue is read again, so the decided report leaves it.
  useEffect(() => { if (state?.ok) router.refresh() }, [state, router])
  if (state?.ok) return <p role="status" data-decision-result="recorded" className="mt-2 text-xs font-ui text-deepblue">Decision recorded.</p>
  return (
    <form action={action} data-decision-form className="mt-3 space-y-2">
      <input type="hidden" name="report_id" value={reportId} />
      {state && !state.ok && <p role="alert" className="text-xs font-ui text-orange">{state.error}</p>}
      <label className="block text-xs font-ui text-brown/60" htmlFor={`decision-${reportId}`}>Decision</label>
      <select id={`decision-${reportId}`} name="decision" required value={decision} onChange={(e) => setDecision(e.target.value)}
        className="w-full rounded border border-deepblue/20 px-2 py-1.5 text-sm font-body text-brown">
        <option value="" disabled>Choose…</option>
        <option value="left">Left in place</option>
        <option value="hidden">Hidden</option>
        <option value="removed">Removed</option>
        <option value="restricted">Account restricted</option>
      </select>
      <label className="block text-xs font-ui text-brown/60" htmlFor={`reason-${reportId}`}>
        Reason, in one or two plain sentences{canAnswer ? ' (sent to the person who reported when the content is left in place)' : ''}
      </label>
      <textarea id={`reason-${reportId}`} name="reason" required rows={2} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)}
        className="w-full rounded border border-deepblue/20 px-2 py-1.5 text-sm font-body text-brown" />
      <button type="submit" disabled={pending}
        className="rounded bg-deepblue px-3 py-1.5 text-xs font-ui font-medium text-white hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40">
        {pending ? 'Recording…' : 'Record decision'}
      </button>
    </form>
  )
}
