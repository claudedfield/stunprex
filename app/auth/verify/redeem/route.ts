/**
 * POST /auth/verify/redeem: the button on the mailed link's page (D-AUTH-02).
 *
 * A plain form POST, answered with a 303 to Auth.js's own callback, which makes the session. It is
 * a route and not a server action on purpose: a server action's redirect is followed by Next's
 * router with a background fetch first, which used the one-time callback before the browser
 * reached it, and the visitor arrived signed out (found by the e2e suite on staging).
 * GET answers 405, so fetching an address never signs anyone in.
 */
import { redeemLink } from '@/lib/auth/signin-code'
import { redactError } from '@/lib/log-redact'

export const dynamic = 'force-dynamic'

const to = (location: string) => new Response(null, { status: 303, headers: { Location: location, 'Cache-Control': 'no-store' } })

export async function POST(req: Request) {
  let url: string | null = null
  try {
    const token = String((await req.formData()).get('token') ?? '').trim()
    url = /^[A-Za-z0-9_-]{20,100}$/.test(token) ? await redeemLink(token) : null
  } catch (err) {
    console.error('[verify/redeem]', redactError(err))
  }
  return to(url ?? '/auth/verify?expired=1')
}
