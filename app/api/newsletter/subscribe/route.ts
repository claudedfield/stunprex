/**
 * POST /api/newsletter/subscribe — double opt-in step 1.
 * Body: { email: string, source?: string } (JSON or form-encoded).
 *
 * Always answers 200 with the same generic message — whether the address is
 * new, already pending, or already confirmed. No email-existence leak.
 */
import { NextRequest, NextResponse } from 'next/server'
import { subscribe } from '@/lib/newsletter'

// Never pre-render at build time — requires live DB.
export const dynamic = 'force-dynamic'

const GENERIC_OK = {
  ok: true,
  message: 'Check your inbox — if that address can be subscribed, a confirmation email is on its way.',
}

export async function POST(req: NextRequest) {
  let email = ''
  let source: string | undefined

  try {
    const contentType = req.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const body = await req.json()
      email = typeof body?.email === 'string' ? body.email : ''
      source = typeof body?.source === 'string' ? body.source : undefined
    } else {
      const form = await req.formData()
      email = String(form.get('email') ?? '')
      const formSource = form.get('source')
      source = typeof formSource === 'string' ? formSource : undefined
    }

    await subscribe(email, source)
  } catch (err) {
    // Invalid address, duplicate race, SMTP hiccup — log server-side, but the
    // response stays identical so nothing about the address is leaked.
    console.error('[newsletter/subscribe] failed:', err instanceof Error ? err.message : err)
  }

  return NextResponse.json(GENERIC_OK)
}
