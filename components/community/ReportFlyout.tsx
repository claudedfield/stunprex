'use client'
/**
 * ReportFlyout — inline report dialog triggered by a small "Report" link.
 * Shows a reason select + optional detail; submits via submitReport action.
 * Calm, non-alarming tone (brief §6).
 */
import { useState, useTransition } from 'react'
import { submitReport } from '@/lib/community/actions'

const REASONS = [
  { value: 'spam', label: 'Spam or self-promotion' },
  { value: 'misinformation', label: 'Misinformation or inaccurate advice' },
  { value: 'harmful', label: 'Harmful or inappropriate content' },
  { value: 'off-topic', label: 'Off-topic for this community' },
  { value: 'other', label: 'Other' },
] as const

interface ReportFlyoutProps {
  targetType: 'question' | 'answer' | 'comment' | 'user'
  targetId: string
}

export default function ReportFlyout({ targetType, targetId }: ReportFlyoutProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) return

    const fd = new FormData()
    fd.append('target_type', targetType)
    fd.append('target_id', targetId)
    fd.append('reason', reason)
    if (detail) fd.append('detail', detail)

    startTransition(async () => {
      const res = await submitReport(fd)
      if (res.success) {
        setResult('success')
      } else {
        setResult('error')
        setErrorMsg(res.error)
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-ui text-brown/30 hover:text-brown/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
      >
        Report
      </button>
    )
  }

  return (
    <div
      className="rounded-lg border border-deepblue/15 bg-white p-4 shadow-sm mt-2 max-w-sm"
      role="dialog"
      aria-label="Report content"
    >
      {result === 'success' ? (
        <div className="text-sm font-body text-brown/70">
          <p className="font-medium text-deepblue mb-1">Report received</p>
          <p>Thank you — a moderator will review this.</p>
          <button
            type="button"
            onClick={() => { setOpen(false); setResult('idle') }}
            className="mt-3 text-xs font-ui text-brown/50 hover:text-brown transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm font-display font-semibold text-deepblue">Report this content</p>

          {result === 'error' && (
            <p className="text-xs text-orange font-body" role="alert">{errorMsg}</p>
          )}

          <div>
            <label htmlFor="report-reason" className="block text-xs font-ui font-medium text-brown/70 mb-1">
              Reason
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full rounded border border-deepblue/20 px-2 py-1.5 text-sm font-body text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
            >
              <option value="">Select a reason…</option>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-detail" className="block text-xs font-ui font-medium text-brown/70 mb-1">
              Additional detail <span className="text-brown/40 font-normal">(optional)</span>
            </label>
            <textarea
              id="report-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full rounded border border-deepblue/20 px-2 py-1.5 text-sm font-body text-brown placeholder:text-brown/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 resize-none"
              placeholder="Any additional context…"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setResult('idle') }}
              className="rounded px-3 py-1.5 text-xs font-ui text-brown/50 hover:text-brown transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !reason}
              className="rounded bg-deepblue px-3 py-1.5 text-xs font-ui font-medium text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
            >
              {isPending ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
