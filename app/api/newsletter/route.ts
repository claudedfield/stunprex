/**
 * POST /api/newsletter — email capture.
 *
 * Stores submissions to Vercel Postgres (the fallback store until a newsletter
 * provider is chosen — see Needs Dezső). The subscribers table is created
 * idempotently at runtime: migrations are not wired into the Vercel build, and
 * runtime is where POSTGRES_URL is available, so the route ensures its own table.
 *
 * Accepts JSON ({ email, source }) for fetch callers and form-encoded bodies for
 * a no-JS fallback (responds with a redirect in that case). Single opt-in; double
 * opt-in can layer on once an email provider/SMTP is confirmed.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email      text NOT NULL UNIQUE,
      source     text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `
}

export async function POST(req: NextRequest) {
  const ctype = req.headers.get('content-type') ?? ''
  const isForm =
    ctype.includes('application/x-www-form-urlencoded') || ctype.includes('multipart/form-data')

  let email = ''
  let source = 'site'
  try {
    if (isForm) {
      const fd = await req.formData()
      email = String(fd.get('email') ?? '').trim().toLowerCase()
      source = String(fd.get('source') ?? 'site').slice(0, 40)
    } else {
      const body = await req.json()
      email = String(body?.email ?? '').trim().toLowerCase()
      source = String(body?.source ?? 'site').slice(0, 40)
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 })
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    if (isForm) return NextResponse.redirect(new URL('/?newsletter=error', req.url), 303)
    return NextResponse.json({ ok: false, error: 'invalid email' }, { status: 422 })
  }

  if (!process.env.POSTGRES_URL) {
    return NextResponse.json({ ok: false, error: 'storage unavailable' }, { status: 503 })
  }

  try {
    await ensureTable()
    await sql`
      INSERT INTO newsletter_subscribers (email, source)
      VALUES (${email}, ${source})
      ON CONFLICT (email) DO NOTHING
    `
  } catch {
    return NextResponse.json({ ok: false, error: 'storage error' }, { status: 500 })
  }

  if (isForm) return NextResponse.redirect(new URL('/?newsletter=thanks', req.url), 303)
  return NextResponse.json({ ok: true })
}
