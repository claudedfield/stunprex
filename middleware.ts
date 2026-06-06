/**
 * Next.js middleware — Auth.js v5 session handling.
 *
 * Uses the edge-compatible authConfig (auth.config.ts) — no pg or nodemailer
 * imports. The Edge Runtime cannot load those Node.js-only modules.
 *
 * The authorized callback always returns true (no edge-level route locking).
 * Auth enforcement happens in Server Components and Actions via auth() from auth.ts.
 *
 * Runs on all paths except static assets, images, and public files.
 */
import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, opengraph-image, sitemap, robots, rss
     * - public assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|opengraph-image|sitemap|robots|rss|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
