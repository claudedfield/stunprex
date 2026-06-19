/**
 * Next.js middleware — intentional NO-OP pass-through.
 *
 * WHY THIS DOES NOT RUN NextAuth:
 * The site uses a DATABASE session strategy (auth.ts: adapter + session.strategy
 * = 'database'). The edge-compatible config (auth.config.ts) has no adapter, so an
 * edge NextAuth() handler defaults to the JWT strategy. When such a handler sees the
 * real session cookie — `__Secure-authjs.session-token`, whose value is a database
 * session UUID, not a signed JWT — it fails to decode it and emits
 * `Set-Cookie: __Secure-authjs.session-token=; Max-Age=0`, WIPING the session on
 * every request that passes through the matcher (/auth/*, /community/*). That is
 * exactly what broke magic-link sign-in: a new user is redirected to
 * /community/welcome immediately after the callback and lost the session there.
 *
 * This middleware never provided functional value: its edge `authorized()` callback
 * always returned true (no route locking). Real auth enforcement lives in Server
 * Components / Server Actions via auth() from auth.ts (Node.js runtime, database
 * strategy). So we make the middleware a clean pass-through that touches no cookies.
 */
import { NextResponse } from 'next/server'

export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/community/:path*',
  ],
}
