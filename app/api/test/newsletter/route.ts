/**
 * /api/test/newsletter: test-only helpers for the newsletter e2e on staging (D-NEWS-01). Same guard
 * as /api/test/sign-in: 404 everywhere but staging. Every action touches only the test address's
 * own rows. Body: { action: 'reset' | 'outbox' | 'expire' | 'state' | 'send_issue' }. `send_issue` sends a
 * built-in test issue through the real list-send path to the test address only, and only when it is
 * confirmed; on staging the message is captured, never sent.
 */
import { NextResponse } from 'next/server'
import { sql } from '@/db'
import { testRoutesEnabled } from '@/lib/test-guard'
import { TEST_ADDRESS } from '@/lib/newsletter/core.mjs'
import { ensureIssueRow, sendToSubscriber } from '@/lib/newsletter/send.mjs'

const TEST_ISSUE = {
  meta: { number: 0, slug: 'e2e-test-issue', subject: 'E2E test issue', preview: 'A test issue.', send_date: '', byline: 'StunpreX' },
  body: 'A test issue from the e2e suite.\n\n## A heading\n\nA paragraph with [a link](https://stunprex.com/training).',
}

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!testRoutesEnabled(req)) return new NextResponse('Not Found', { status: 404 })
  const { action } = (await req.json().catch(() => ({}))) as { action?: string }
  if (action === 'reset') {
    await sql`DELETE FROM newsletter_sends WHERE subscriber_id IN (SELECT id FROM newsletter_subscribers WHERE email = ${TEST_ADDRESS})`
    await sql`DELETE FROM newsletter_subscribers WHERE email = ${TEST_ADDRESS}`
    await sql`DELETE FROM newsletter_test_outbox WHERE to_address = ${TEST_ADDRESS}`
    return NextResponse.json({ ok: true })
  }
  if (action === 'outbox') {
    const { rows } = await sql`SELECT subject, headers, text_body, html_body, created_at FROM newsletter_test_outbox
                               WHERE to_address = ${TEST_ADDRESS} ORDER BY created_at DESC`
    return NextResponse.json({ messages: rows })
  }
  if (action === 'expire') {
    await sql`UPDATE newsletter_subscribers SET confirm_token_expires_at = now() - interval '1 minute' WHERE email = ${TEST_ADDRESS}`
    return NextResponse.json({ ok: true })
  }
  if (action === 'state') {
    const { rows } = await sql`SELECT status, name, consent_requested_at, confirmed_at, unsubscribed_at,
                                      (SELECT count(*)::int FROM newsletter_subscribers WHERE email = ${TEST_ADDRESS}) AS rows
                               FROM newsletter_subscribers WHERE email = ${TEST_ADDRESS}`
    return NextResponse.json({ subscriber: rows[0] ?? null })
  }
  if (action === 'send_issue') {
    const { rows } = await sql<{ id: string; email: string; name: string | null; unsubscribe_token: string }>`
      SELECT id, email, name, unsubscribe_token FROM newsletter_subscribers WHERE email = ${TEST_ADDRESS} AND status = 'confirmed'`
    if (!rows[0]) return NextResponse.json({ result: 'not confirmed; nothing sent' })
    const query = (text: string, values: unknown[]) => sql.query(text, values)
    const issueId = await ensureIssueRow(query, TEST_ISSUE.meta)
    await sql`DELETE FROM newsletter_sends WHERE issue_id = ${issueId} AND subscriber_id = ${rows[0].id}`
    return NextResponse.json({ result: await sendToSubscriber(query, TEST_ISSUE, issueId, rows[0]) })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
