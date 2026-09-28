/**
 * /api/test/sign-in: test-only sign-in for the e2e suite on staging (D-WEB-27, decision T).
 *
 * Signs in ONE dedicated test account without a magic link: it creates a database
 * session for that account and sets the Auth.js session cookie. Nothing is mailed.
 *
 * It exists only where all three hold, and answers 404 everywhere else:
 *   - STAGING=1 in the server's environment (set only in /srv/stunprex/staging.env)
 *   - E2E_SIGNIN_SECRET is set there, at least 32 characters
 *   - the request carries that secret in the x-e2e-secret header
 * Production's environment has neither variable, so the route does not exist there.
 *
 * The account is e2e@stunprex.test. `.test` is a reserved domain (RFC 2606): no
 * mail sent to it can ever be delivered, and it can never be a member's address.
 * The staging database is a branch of production and holds real member rows; this
 * route touches only the test account's own rows.
 *
 * LEGAL-01a, 01b: a JSON body `{ "terms": "none" | "stale" | "current" }` sets the test account's
 * terms state before the session is made (none: never accepted; stale: an older terms version;
 * current: accepted now), so the suite can prove the terms step without posting. The response
 * always carries the account's terms state as stored.
 */
import { NextResponse } from 'next/server'
import { randomUUID, timingSafeEqual } from 'node:crypto'
import { sql } from '@/db'
import { ensureProfile } from '@/lib/auth/db'
import { TERMS_VERSION } from '@/lib/legal'

export const dynamic = 'force-dynamic'

const E2E_TEST_EMAIL = 'e2e@stunprex.test'
const SESSION_SECONDS = 60 * 60

function enabled(req: Request): boolean {
  const secret = process.env.E2E_SIGNIN_SECRET ?? ''
  if (process.env.STAGING !== '1' || secret.length < 32) return false
  const given = Buffer.from(req.headers.get('x-e2e-secret') ?? '')
  const want = Buffer.from(secret)
  return given.length === want.length && timingSafeEqual(given, want)
}

export async function POST(req: Request) {
  if (!enabled(req)) return new NextResponse('Not Found', { status: 404 })

  const { rows } = await sql<{ id: string }>`
    INSERT INTO users (email, "emailVerified") VALUES (${E2E_TEST_EMAIL}, now())
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id`
  const userId = rows[0].id
  const profile = await ensureProfile(userId, E2E_TEST_EMAIL)
  // The suite signs in as a member who has finished onboarding.
  if (!profile.onboarded) await sql`UPDATE profiles SET onboarded = true WHERE user_id = ${userId}`

  const body = await req.json().catch(() => ({}))
  const terms = (body as { terms?: string }).terms
  if (terms === 'none') {
    await sql`UPDATE profiles SET terms_version = NULL, terms_accepted_at = NULL, age_confirmed_at = NULL
              WHERE user_id = ${userId}`
  } else if (terms === 'stale') {
    await sql`UPDATE profiles SET terms_version = '2000-01-01', terms_accepted_at = now(), age_confirmed_at = now()
              WHERE user_id = ${userId}`
  } else if (terms === 'current') {
    await sql`UPDATE profiles SET terms_version = ${TERMS_VERSION}, terms_accepted_at = now(), age_confirmed_at = now()
              WHERE user_id = ${userId}`
  }
  const { rows: state } = await sql<{ terms_version: string | null; terms_accepted_at: string | null; age_confirmed_at: string | null }>`
    SELECT terms_version, terms_accepted_at, age_confirmed_at FROM profiles WHERE user_id = ${userId}`

  await sql`DELETE FROM sessions WHERE "userId" = ${userId} AND expires < now()`
  const token = randomUUID()
  const expires = new Date(Date.now() + SESSION_SECONDS * 1000)
  await sql`INSERT INTO sessions ("sessionToken", "userId", expires)
            VALUES (${token}, ${userId}, ${expires.toISOString()})`

  const secure = new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https'
  const res = NextResponse.json({ ok: true, email: E2E_TEST_EMAIL, current_terms_version: TERMS_VERSION, ...state[0] })
  res.cookies.set(secure ? '__Secure-authjs.session-token' : 'authjs.session-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires,
  })
  return res
}

export function GET() {
  return new NextResponse('Not Found', { status: 404 })
}
