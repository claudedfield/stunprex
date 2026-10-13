/**
 * /api/test/metrics: test-only helpers for the counter's e2e on staging (D-WEB-31). Same guard as
 * /api/test/sign-in: 404 everywhere but staging. `visitor` actions work on the caller's own code
 * (computed from this request's IP address and user-agent, as the counter does), so a test with its
 * own user-agent string never touches another test's rows.
 * Body: { action: 'read', kind, key } | { action: 'visitor' | 'age_visitor' | 'forget_visitor' | 'columns' }.
 */
import { NextResponse } from 'next/server'
import { sql } from '@/db'
import { testRoutesEnabled } from '@/lib/test-guard'
import { clientIp } from '@/lib/auth/signin-code'
import { visitorCode } from '@/lib/metrics/core'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!testRoutesEnabled(req)) return new NextResponse('Not Found', { status: 404 })
  const body = (await req.json().catch(() => ({}))) as { action?: string; kind?: string; key?: string }
  const today = new Date().toISOString().slice(0, 10)
  if (body.action === 'read') {
    const { rows } = await sql<{ n: number }>`SELECT n FROM metrics_daily WHERE day = ${today} AND kind = ${body.kind ?? ''} AND key = ${body.key ?? ''}`
    return NextResponse.json({ n: rows[0]?.n ?? 0 })
  }
  if (body.action === 'columns') {
    const { rows } = await sql<{ t: string; c: string }>`
      SELECT table_name AS t, column_name AS c FROM information_schema.columns
      WHERE table_name IN ('metrics_daily', 'metrics_visitors', 'metrics_salt') ORDER BY 1, 2`
    return NextResponse.json({ columns: rows.map((r) => `${r.t}.${r.c}`) })
  }
  const { code } = await visitorCode(clientIp(req.headers) ?? '', req.headers.get('user-agent') ?? '')
  if (body.action === 'visitor') {
    const { rows } = await sql<{ first_day: string; last_day: string }>`
      SELECT first_day::text, last_day::text FROM metrics_visitors WHERE code = ${code}`
    return NextResponse.json({ today, row: rows[0] ?? null })
  }
  if (body.action === 'age_visitor') {
    await sql`UPDATE metrics_visitors SET first_day = first_day - 1, last_day = last_day - 1 WHERE code = ${code}`
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'forget_visitor') {
    await sql`DELETE FROM metrics_visitors WHERE code = ${code}`
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
