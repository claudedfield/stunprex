/**
 * /api/newsletter/unsubscribe?token=…
 *
 * GET  — human clicking the footer link → unsubscribe, redirect to
 *        /newsletter/unsubscribed.
 * POST — RFC 8058 One-Click unsubscribe (mail clients POST to the
 *        List-Unsubscribe URL with List-Unsubscribe=One-Click) → plain 200.
 *
 * Both are idempotent — repeat calls stay unsubscribed.
 */
import { NextRequest, NextResponse } from 'next/server'
import { unsubscribe } from '@/lib/newsletter'

// Never pre-render at build time — requires live DB.
export const dynamic = 'force-dynamic'

async function doUnsubscribe(req: NextRequest): Promise<void> {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  try {
    await unsubscribe(token)
  } catch (err) {
    console.error('[newsletter/unsubscribe] failed:', err instanceof Error ? err.message : err)
  }
}

export async function GET(req: NextRequest) {
  await doUnsubscribe(req)
  return NextResponse.redirect(new URL('/newsletter/unsubscribed', req.nextUrl.origin))
}

export async function POST(req: NextRequest) {
  await doUnsubscribe(req)
  return new NextResponse('Unsubscribed', { status: 200 })
}
