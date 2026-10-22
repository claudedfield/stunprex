/**
 * /api/review/notes (staging only): the notes, newest first, for scripts/review_notes.mjs. Reading
 * needs only the test site's own login (Caddy's basic auth, checked again here); DELETE ?path=
 * removes a page's notes and needs the test secret (the e2e cleans up its own).
 */
import { NextResponse } from 'next/server'
import { sql } from '@/db'
import { testRoutesEnabled } from '@/lib/test-guard'
import { reviewOpen, stagingLogin } from '@/lib/review'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!reviewOpen() || !stagingLogin(req.headers)) return new NextResponse('Not Found', { status: 404 })
  const { rows } = await sql<{ path: string; text: string; by_login: string; created_at: string }>`
    SELECT path, text, by_login, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI "UTC"') AS created_at
    FROM review_notes ORDER BY id DESC LIMIT 500`
  return NextResponse.json({ notes: rows }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function DELETE(req: Request) {
  if (!testRoutesEnabled(req)) return new NextResponse('Not Found', { status: 404 })
  const p = new URL(req.url).searchParams.get('path') ?? ''
  const r = await sql`DELETE FROM review_notes WHERE path = ${p}`
  return NextResponse.json({ deleted: r.rowCount ?? 0 })
}
