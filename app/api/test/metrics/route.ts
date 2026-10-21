/**
 * /api/test/metrics: test-only helpers for the counter's e2e on staging (D-WEB-31, way C). Same guard
 * as /api/test/sign-in: 404 everywhere but staging.
 * Body: { action: 'read', kind, key } | { action: 'columns' }.
 */
import { NextResponse } from 'next/server'
import { sql } from '@/db'
import { testRoutesEnabled } from '@/lib/test-guard'

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
    const { rows } = await sql<{ c: string }>`
      SELECT column_name AS c FROM information_schema.columns WHERE table_name = 'metrics_daily' ORDER BY 1`
    return NextResponse.json({ columns: rows.map((r) => r.c) })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
