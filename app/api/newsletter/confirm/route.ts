/**
 * POST /api/newsletter/confirm (D-NEWS-01), body `{ token }`. Called by /newsletter/confirm as the
 * page opens, so a link scanner that only fetches the page confirms nobody.
 */
import { NextResponse } from 'next/server'
import { confirm } from '@/lib/newsletter/subscribers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: unknown }
  const outcome = await confirm(token)
  return NextResponse.json({ outcome }, { status: outcome === 'confirmed' ? 200 : outcome === 'expired' ? 410 : 404 })
}
