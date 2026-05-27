/**
 * Next.js middleware — Auth.js v5 session handling.
 * Exports the auth middleware from auth.ts so Auth.js can refresh sessions
 * and protect routes via the authorized callback.
 *
 * Runs on all paths except static assets, images, and public files.
 */
export { auth as middleware } from '@/auth'

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
