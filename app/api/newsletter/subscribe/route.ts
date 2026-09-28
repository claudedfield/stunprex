/**
 * POST /api/newsletter/subscribe (D-NEWS-01). Body: JSON or form data with `name` and `email`, optional
 * `source`, and `website`, a field people never see: a value in it means a bot, answered like a
 * success and ignored. Only POST: an address never travels in a URL (LEGAL-01c).
 */
import { NextResponse } from 'next/server'
import { subscribe } from '@/lib/newsletter/subscribers'
import { newsletterReady } from '@/lib/newsletter/core.mjs'
import { redactError } from '@/lib/log-redact'

export const dynamic = 'force-dynamic'

const MESSAGES = {
  check_email: 'Check your inbox: we sent a link to confirm. It works for 7 days.',
  already_confirmed: 'This address is already subscribed. Nothing more to do.',
  invalid_email: 'Please enter a valid email address.',
  invalid_name: 'Please enter your name.',
  busy: 'We are receiving many sign-ups right now. Please try again in an hour.',
} as const

export async function POST(req: Request) {
  const type = req.headers.get('content-type') ?? ''
  let data: Record<string, unknown> = {}
  try {
    data = type.includes('application/json')
      ? await req.json()
      : Object.fromEntries((await req.formData()).entries())
  } catch {
    return NextResponse.json({ ok: false, message: MESSAGES.invalid_email }, { status: 400 })
  }
  if (!newsletterReady()) {
    return NextResponse.json({ ok: false, message: 'Sign-ups open soon.' }, { status: 503 })
  }
  if (data.website) return NextResponse.json({ ok: true, outcome: 'check_email', message: MESSAGES.check_email })
  const source = typeof data.source === 'string' ? data.source.slice(0, 40) : 'site'
  try {
    const outcome = await subscribe(data.name, data.email, source)
    const status = outcome === 'invalid_email' || outcome === 'invalid_name' ? 400 : outcome === 'busy' ? 429 : 200
    return NextResponse.json({ ok: status === 200, outcome, message: MESSAGES[outcome] }, { status })
  } catch (err) {
    console.error('[newsletter/subscribe]', redactError(err))
    return NextResponse.json({ ok: false, message: 'Something went wrong. Please try again later.' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ ok: false, message: 'Use POST.' }, { status: 405 })
}
