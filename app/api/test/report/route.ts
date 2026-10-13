/**
 * /api/test/report: test-only helpers for the report form's e2e on staging (LEGAL-03.2). Same guard
 * as /api/test/sign-in: 404 everywhere but staging. It touches only reports whose text carries the
 * suite's marker, and captured mail to the reserved test address or about a marked report.
 * Body: { action: 'reset' | 'state' | 'mail' }.
 */
import { NextResponse } from 'next/server'
import { sql } from '@/db'
import { testRoutesEnabled } from '@/lib/test-guard'
import { resetReportLimits } from '@/lib/community/report-limit'

const MARKER = 'e2e-report-marker'
const ADDRESS = 'e2e-report@stunprex.test'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!testRoutesEnabled(req)) return new NextResponse('Not Found', { status: 404 })
  const { action } = (await req.json().catch(() => ({}))) as { action?: string }
  if (action === 'reset') {
    await sql`DELETE FROM reports WHERE detail LIKE ${'%' + MARKER + '%'}`
    await sql`DELETE FROM newsletter_test_outbox WHERE to_address = ${ADDRESS} OR (to_address = 'hello@stunprex.com' AND subject LIKE 'A report came in%')`
    resetReportLimits()
    return NextResponse.json({ ok: true })
  }
  if (action === 'state') {
    const { rows } = await sql`
      SELECT status, decision, decision_reason, child_safety, target_type, target_url,
             (reporter_id IS NOT NULL) AS has_member, (reporter_name IS NOT NULL) AS has_name,
             (reporter_email IS NOT NULL) AS has_email, (good_faith_at IS NOT NULL) AS good_faith,
             (outcome_sent_at IS NOT NULL) AS outcome_sent
      FROM reports WHERE detail LIKE ${'%' + MARKER + '%'} ORDER BY created_at`
    return NextResponse.json({ reports: rows })
  }
  if (action === 'mail') {
    const { rows } = await sql`SELECT to_address, subject, headers, text_body FROM newsletter_test_outbox
      WHERE to_address = ${ADDRESS} OR (to_address = 'hello@stunprex.com' AND subject LIKE 'A report came in%') ORDER BY created_at`
    return NextResponse.json({ messages: rows })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
