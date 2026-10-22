/**
 * /api/review (staging only; 404 on production). GET ?path= answers the page's review question, or
 * { pending: false }. POST { path, text } keeps one note for that page.
 */
import { NextResponse } from 'next/server'
import { sql } from '@/db'
import { reviewOpen, reviewFor, stagingLogin } from '@/lib/review'

export const dynamic = 'force-dynamic'

const notFound = () => new NextResponse('Not Found', { status: 404 })

export async function GET(req: Request) {
  if (!reviewOpen()) return notFound()
  const ask = reviewFor(new URL(req.url).searchParams.get('path') ?? '')
  return NextResponse.json(ask ? { pending: true, ...ask } : { pending: false }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: Request) {
  if (!reviewOpen()) return notFound()
  const body = (await req.json().catch(() => ({}))) as { path?: unknown; text?: unknown }
  const pagePath = typeof body.path === 'string' ? body.path : ''
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!reviewFor(pagePath)) return NextResponse.json({ ok: false, error: 'This page asks for no review.' }, { status: 400 })
  if (!text || text.length > 5000) return NextResponse.json({ ok: false, error: 'Write a note of up to 5,000 characters.' }, { status: 400 })
  await sql`INSERT INTO review_notes (path, text, by_login) VALUES (${pagePath}, ${text}, ${stagingLogin(req.headers)})`
  return NextResponse.json({ ok: true })
}
