/**
 * /api/test/session-choice: test-only helpers for the session choice (03.4) and the Google address
 * check (C1) on staging. Same guard as the other test routes: 404 everywhere but staging. Every
 * action touches only two reserved test addresses (`.test`, RFC 2606).
 * Body: { action: 'reset' } | { action: 'mail', who: 'keep' | 'google' } | { action: 'hold_google', keep?: boolean }
 *     | { action: 'state' } | { action: 'session' }.
 */
import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { sql } from '@/db'
import { testRoutesEnabled } from '@/lib/test-guard'
import { resetIpLimits } from '@/lib/auth/signin-code'
import { hashNonce } from '@/lib/auth/session-choice'
import { SIGN_IN_SUBJECT } from '@/lib/email'

const ADDRESS = { keep: 'e2e-keep@stunprex.test', google: 'e2e-google@stunprex.test' } as const
const GOOGLE_SUB = 'e2e-google-sub-000000000001'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!testRoutesEnabled(req)) return new NextResponse('Not Found', { status: 404 })
  const body = (await req.json().catch(() => ({}))) as { action?: string; who?: 'keep' | 'google'; keep?: boolean }
  const all = [ADDRESS.keep, ADDRESS.google]
  if (body.action === 'reset') {
    await sql`DELETE FROM signin_codes WHERE email = ANY(${all})`
    await sql`DELETE FROM newsletter_test_outbox WHERE to_address = ANY(${all})`
    await sql`DELETE FROM verification_tokens WHERE identifier = ANY(${all})`
    await sql`DELETE FROM google_pending WHERE email = ANY(${all})`
    await sql`DELETE FROM accounts WHERE provider = 'google' AND "providerAccountId" = ${GOOGLE_SUB}`
    await sql`DELETE FROM users WHERE email = ANY(${all})`
    resetIpLimits()
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'mail') {
    const to = ADDRESS[body.who ?? 'keep']
    const { rows } = await sql<{ text_body: string }>`SELECT text_body FROM newsletter_test_outbox
      WHERE to_address = ${to} AND subject = ${SIGN_IN_SUBJECT} ORDER BY created_at DESC LIMIT 1`
    return NextResponse.json({ text: rows[0]?.text_body ?? null })
  }
  if (body.action === 'hold_google') {
    // As if this browser had come back from Google with a verified address that is not Gmail or
    // Workspace: the sign-in cookie and the held row the signIn callback would have written.
    const nonce = randomBytes(24).toString('base64url')
    await sql`INSERT INTO google_pending (nonce_hash, email, provider_account_id, next)
              VALUES (${hashNonce(nonce)}, ${ADDRESS.google}, ${GOOGLE_SUB}, '/community')`
    const res = NextResponse.json({ ok: true })
    res.cookies.set('sx-signin', `${body.keep ? 1 : 0}.${nonce}`, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 900 })
    return res
  }
  if (body.action === 'state') {
    const { rows } = await sql<{ users: number; linked: number; held: number }>`
      SELECT (SELECT count(*) FROM users WHERE email = ${ADDRESS.google})::int AS users,
             (SELECT count(*) FROM accounts a JOIN users u ON u.id = a."userId"
               WHERE u.email = ${ADDRESS.google} AND a.provider = 'google' AND a."providerAccountId" = ${GOOGLE_SUB})::int AS linked,
             (SELECT count(*) FROM google_pending WHERE email = ${ADDRESS.google})::int AS held`
    return NextResponse.json(rows[0])
  }
  if (body.action === 'session') {
    const token = /(?:^|;\s*)(?:__Secure-)?authjs\.session-token=([^;]+)/.exec(req.headers.get('cookie') ?? '')?.[1] ?? ''
    const { rows } = await sql<{ keep: boolean; seconds: number }>`
      SELECT keep, extract(epoch FROM expires - now())::int AS seconds FROM sessions WHERE "sessionToken" = ${token}`
    return NextResponse.json({ session: rows[0] ?? null })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
