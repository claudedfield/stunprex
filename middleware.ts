/**
 * Next.js middleware — Auth.js v5 session handling.
 *
 * Uses the edge-compatible authConfig (auth.config.ts) — no pg or nodemailer
 * imports. The Edge Runtime cannot load those Node.js-only modules.
 *
 * Safety: if AUTH_SECRET is absent the module returns a no-op so the Edge
 * Worker doesn't crash with MissingSecret → MIDDLEWARE_INVOCATION_FAILED.
 *
 * Matcher is intentionally narrow: only routes that actually need a session
 * cookie read (/auth/*, /community/*). Public pages run without middleware
 * involvement — no latency added, no cold-start risk.
 *
 * Auth enforcement for community routes happens inside Server Components and
 * Server Actions via auth() from auth.ts (Node.js runtime, not Edge).
 */
import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const middleware: any = (() => {
  if (!process.env.AUTH_SECRET) {
    // No-op: pass every request through unchanged.
    // Public site stays up even if env vars aren't provisioned yet.
    return () => undefined
  }
  return NextAuth(authConfig).auth
})()

export const config = {
  matcher: [
    // Only run on routes that need session handling.
    // Public pages (/, /blog, /about, /training, /games, …) are excluded.
    '/auth/:path*',
    '/community/:path*',
  ],
}
