/**
 * /api/test/signin-code: test-only helpers for the sign-in code e2e on staging (D-AUTH-02). Same
 * guard as /api/test/sign-in: 404 everywhere but staging. Every action touches only the rows of
 * one reserved test address, which can never be a person's (`.test`, RFC 2606). Staging never
 * sends sign-in mail: it is captured in newsletter_test_outbox and read back here.
 * Body: { action: 'reset' | 'mail' | 'state' }.
 */
import { NextResponse } from 'next/server'
import { sql } from '@/db'
import { testRoutesEnabled } from '@/lib/test-guard'
import { resetIpLimits } from '@/lib/auth/signin-code'
import { SIGN_IN_SUBJECT } from '@/lib/email'

const ADDRESS = 'e2e-signin@stunprex.test'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!testRoutesEnabled(req)) return new NextResponse('Not Found', { status: 404 })
  const { action } = (await req.json().catch(() => ({}))) as { action?: string }
  if (action === 'reset') {
    await sql`DELETE FROM signin_codes WHERE email = ${ADDRESS}`
    await sql`DELETE FROM newsletter_test_outbox WHERE to_address = ${ADDRESS}`
    await sql`DELETE FROM verification_tokens WHERE identifier = ${ADDRESS}`
    await sql`DELETE FROM users WHERE email = ${ADDRESS}`
    resetIpLimits()
    return NextResponse.json({ ok: true })
  }
  if (action === 'mail') {
    const { rows } = await sql`SELECT subject, headers, text_body, html_body FROM newsletter_test_outbox
                               WHERE to_address = ${ADDRESS} AND subject = ${SIGN_IN_SUBJECT} ORDER BY created_at DESC`
    return NextResponse.json({ messages: rows })
  }
  if (action === 'state') {
    const { rows } = await sql<{ users: number; codes: number }>`
      SELECT (SELECT count(*) FROM users WHERE email = ${ADDRESS})::int AS users,
             (SELECT count(*) FROM signin_codes WHERE email = ${ADDRESS})::int AS codes`
    return NextResponse.json(rows[0])
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
