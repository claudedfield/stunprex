/**
 * GET /api/newsletter/confirm?token=… — double opt-in step 2.
 * Confirms the subscription and redirects to /newsletter/thanks.
 * Idempotent: a re-clicked (or mail-client-prefetched) link lands on the
 * same page with no state damage.
 */
import { NextRequest, NextResponse } from 'next/server'
import { confirm } from '@/lib/newsletter'

// Never pre-render at build time — requires live DB.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''

  try {
    await confirm(token)
  } catch (err) {
    console.error('[newsletter/confirm] failed:', err instanceof Error ? err.message : err)
  }

  return NextResponse.redirect(new URL('/newsletter/thanks', req.nextUrl.origin))
}
