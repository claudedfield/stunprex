/**
 * POST /api/newsletter/unsubscribe?token=... (D-NEWS-01): the RFC 8058 one-click target named in
 * every issue's List-Unsubscribe header. Mail providers POST `List-Unsubscribe=One-Click` here; no
 * page, no question. The visible link in the issue goes to /newsletter/unsubscribe instead.
 */
import { NextResponse } from 'next/server'
import { unsubscribe } from '@/lib/newsletter/subscribers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  const result = await unsubscribe(token)
  return NextResponse.json({ ok: result === 'unsubscribed' }, { status: result === 'unsubscribed' ? 200 : 404 })
}
