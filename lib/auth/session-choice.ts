/**
 * The session choice (Legal 03.4, the owner's sentence of 15 Oct 2026): "Keep me signed in on this
 * device for 30 days". No box is ticked by default.
 *
 * - Ticked: the session lasts 30 days on the server, and its cookie is kept 30 days.
 * - Not ticked: the session ends 24 hours after sign-in on the server, and its cookie is a session
 *   cookie, which the browser removes when it closes.
 *
 * The choice is made on the sign-in page and travels to the end of the sign-in in a short cookie
 * (`sx-signin`, 15 minutes), for the email code and for Google alike. The same cookie carries a
 * random value that ties a Google sign-in waiting for its address check to this browser (C1).
 *
 * Auth.js sets the server's session length and the cookie's expiry from one setting, so the two
 * are set apart here: the adapter writes the session's length and choice (auth.ts), and
 * `withSessionChoice` turns the sign-in cookie of a session without the box into a session cookie
 * on every response of Auth.js's own routes.
 */
import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { sql } from '@/db'

export { KEEP_SECONDS, SHORT_SECONDS, KEEP_LABEL } from '@/lib/auth/session-constants'

const CHOICE_COOKIE = 'sx-signin'
const CHOICE_SECONDS = 15 * 60

export const hashNonce = (nonce: string) => createHash('sha256').update(nonce).digest('hex')

/** Record the choice for the sign-in now starting (a server action). Returns the browser's value. */
export async function setSignInChoice(keep: boolean): Promise<string> {
  const nonce = randomBytes(24).toString('base64url')
  ;(await cookies()).set(CHOICE_COOKIE, `${keep ? 1 : 0}.${nonce}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CHOICE_SECONDS,
  })
  return nonce
}

/** The choice of the sign-in in progress, or null. Without it, the box counts as not ticked. */
export async function readSignInChoice(): Promise<{ keep: boolean; nonce: string } | null> {
  try {
    const raw = (await cookies()).get(CHOICE_COOKIE)?.value ?? ''
    const m = /^([01])\.([A-Za-z0-9_-]{16,64})$/.exec(raw)
    return m ? { keep: m[1] === '1', nonce: m[2] } : null
  } catch {
    return null
  }
}

const SESSION_COOKIE = /^(?:__Secure-)?authjs\.session-token=([^;]*)/

/**
 * Wrap Auth.js's route handlers. A sign-in cookie for a session without the box loses its expiry,
 * so it ends with the browser; a deletion (empty value) is left as it is. When a sign-in has made
 * its session, the choice cookie is removed. (A Google sign-in sent on to its address check makes
 * no session yet, and keeps it.)
 */
export function withSessionChoice<H extends (req: Request, ctx?: unknown) => Promise<Response>>(handler: H): H {
  return (async (req: Request, ctx?: unknown) => {
    const res = await handler(req, ctx)
    const setCookies = res.headers.getSetCookie()
    const session = setCookies.map((c) => SESSION_COOKIE.exec(c)?.[1]).find((v) => v)
    if (!session) return res
    const finished = new URL(req.url).pathname.includes('/callback/')

    const { rows } = await sql<{ keep: boolean }>`SELECT keep FROM sessions WHERE "sessionToken" = ${session}`
    const keep = rows[0]?.keep ?? false
    const headers = new Headers(res.headers)
    headers.delete('set-cookie')
    for (const c of setCookies) {
      const isSession = SESSION_COOKIE.exec(c)?.[1]
      headers.append('set-cookie', isSession && !keep ? c.replace(/;\s*(Expires|Max-Age)=[^;]*/gi, '') : c)
    }
    if (finished) {
      headers.append('set-cookie', `${CHOICE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
    }
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
  }) as H
}
