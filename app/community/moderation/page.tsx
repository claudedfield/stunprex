/**
 * /community/moderation — Moderation queue.
 * Auth required; moderator or admin role required.
 * Shows open reports + basic user-ban controls.
 * robots: noindex (internal tool).
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { getOpenReports } from '@/lib/community/queries'
import { resolveReport, banUser, unbanUser } from '@/lib/community/actions'

export const metadata: Metadata = {
  title: 'Moderation — StunpreX Community',
  robots: { index: false, follow: false },
}

// ─── Resolve form (inline server action) ─────────────────────────────────────

function ResolveForm({ reportId }: { reportId: string }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <form
        action={async () => {
          'use server'
          await resolveReport(reportId, 'actioned')
        }}
      >
        <button
          type="submit"
          className="rounded bg-orange/10 border border-orange/30 px-3 py-1 text-xs font-ui text-orange hover:bg-orange/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40"
        >
          Action
        </button>
      </form>
      <form
        action={async () => {
          'use server'
          await resolveReport(reportId, 'dismissed')
        }}
      >
        <button
          type="submit"
          className="rounded border border-deepblue/20 px-3 py-1 text-xs font-ui text-brown/60 hover:text-brown hover:border-deepblue/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
        >
          Dismiss
        </button>
      </form>
    </div>
  )
}

// ─── Ban / Unban form ─────────────────────────────────────────────────────────

function BanForm({ userId, action }: { userId: string; action: 'ban' | 'unban' }) {
  return (
    <form
      action={async () => {
        'use server'
        if (action === 'ban') {
          await banUser(userId)
        } else {
          await unbanUser(userId)
        }
      }}
    >
      <button
        type="submit"
        className={`rounded border px-3 py-1 text-xs font-ui transition-colors focus-visible:outline-none focus-visible:ring-2 ${
          action === 'ban'
            ? 'border-orange/30 text-orange hover:bg-orange/10 focus-visible:ring-orange/40'
            : 'border-green-400/40 text-green-700 hover:bg-green-50 focus-visible:ring-green-400/40'
        }`}
      >
        {action === 'ban' ? 'Ban member' : 'Unban member'}
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ModerationPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/sign-in?next=/community/moderation')

  const role = (session.user as typeof session.user & { role?: string }).role ?? 'user'
  if (role !== 'moderator' && role !== 'admin') redirect('/community')

  const reports = await getOpenReports()

  return (
    <main className="min-h-[60vh] bg-mint">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <nav className="mb-2 text-xs font-ui text-brown/45" aria-label="Breadcrumb">
            <Link
              href="/community"
              className="hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
            >
              Community
            </Link>
            <span className="mx-1.5" aria-hidden="true">/</span>
            Moderation
          </nav>
          <h1 className="font-display text-2xl font-bold text-deepblue">Moderation queue</h1>
          <p className="mt-1 text-sm font-body text-brown/50">
            Role: <span className="font-medium text-brown/70">{role}</span>
          </p>
        </header>

        {/* Open reports */}
        <section>
          <h2 className="font-ui text-sm font-semibold text-deepblue mb-4">
            Open reports
            <span className="ml-2 inline-flex items-center rounded-full bg-orange/15 px-2 py-0.5 text-xs font-medium text-orange">
              {reports.length}
            </span>
          </h2>

          {reports.length === 0 ? (
            <p className="text-sm font-body text-brown/50 py-6">No open reports. Queue is clear.</p>
          ) : (
            <ul className="space-y-3" role="list">
              {reports.map((report) => (
                <li
                  key={report.id}
                  className="rounded-lg border border-deepblue/10 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="rounded bg-deepblue/8 px-1.5 py-0.5 text-xs font-ui text-deepblue/70">
                          {report.target_type}
                        </span>
                        <span className="text-xs font-mono font-ui text-brown/35 truncate max-w-[180px]">
                          {report.target_id}
                        </span>
                      </div>
                      <p className="text-sm font-body text-brown font-medium">
                        {report.reason}
                      </p>
                      {report.detail && (
                        <p className="mt-0.5 text-sm font-body text-brown/60 italic">
                          &ldquo;{report.detail}&rdquo;
                        </p>
                      )}
                      <p className="mt-1.5 text-xs font-ui text-brown/40">
                        Reported by{' '}
                        <Link
                          href={`/community/u/${encodeURIComponent(report.reporter_display_name)}`}
                          className="text-deepblue hover:underline focus-visible:outline-none"
                        >
                          {report.reporter_display_name}
                        </Link>
                        {' · '}
                        {new Date(report.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>

                      {report.target_type === 'question' && (
                        <Link
                          href={`/community/${report.target_id}`}
                          className="mt-1 inline-block text-xs font-ui text-deepblue underline hover:text-deepblue/75 focus-visible:outline-none"
                        >
                          View question
                        </Link>
                      )}
                    </div>

                    {/* Actions column */}
                    <div className="flex-shrink-0 flex flex-col gap-1.5 items-end">
                      <ResolveForm reportId={report.id} />
                      {report.target_type === 'user' && (
                        <div className="mt-2">
                          <BanForm userId={report.target_id} action="ban" />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Quick links */}
        <section className="mt-10 border-t border-deepblue/10 pt-6">
          <p className="text-xs font-ui text-brown/50 mb-2">Quick links</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/community"
              className="rounded border border-deepblue/20 px-3 py-1.5 text-xs font-ui text-brown/65 hover:text-deepblue hover:border-deepblue/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
            >
              Community feed
            </Link>
            <Link
              href="/community/ask"
              className="rounded border border-deepblue/20 px-3 py-1.5 text-xs font-ui text-brown/65 hover:text-deepblue hover:border-deepblue/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
            >
              Ask a question
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
