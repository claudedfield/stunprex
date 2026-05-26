/**
 * /community/moderation — Moderator report queue.
 * Auth-gated to moderator/admin role. RLS enforces at DB level.
 */
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentProfile, getOpenReports } from '@/lib/community/queries'

export const metadata: Metadata = {
  title: 'Moderation — StunpreX Community',
  robots: { index: false, follow: false },
}

export default async function ModerationPage() {
  const profile = await getCurrentProfile()

  if (!profile) redirect('/auth/sign-in?next=/community/moderation')
  if (profile.role === 'user') redirect('/community')

  const reports = await getOpenReports()

  return (
    <main className="min-h-screen bg-mint">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-bold text-deepblue mb-1">
            Moderation Queue
          </h1>
          <p className="text-brown/60 font-body text-sm">
            Open reports requiring review.
          </p>
        </header>

        {reports.length === 0 ? (
          <div className="rounded-lg border border-deepblue/10 bg-white p-8 text-center">
            <p className="text-brown/50 font-body text-sm">No open reports. Queue is clear.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-lg border border-deepblue/10 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-ui text-brown/40 mb-1 uppercase tracking-wide">
                      {report.target_type} · reported by {(report as Record<string, unknown> & { reporter?: { display_name?: string } }).reporter?.display_name ?? '—'}
                    </p>
                    <p className="font-body text-sm text-brown">{report.reason}</p>
                    <p className="mt-1 text-xs text-brown/40 font-ui">
                      Target ID: <code className="font-mono">{report.target_id}</code>
                    </p>
                  </div>
                  {/* Resolve actions — Session 5 */}
                  <div className="flex gap-2 flex-shrink-0">
                    <span className="text-xs text-brown/30 font-ui">Actions in Session 5</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
