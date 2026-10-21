/**
 * Next.js middleware. Two jobs, and it touches no cookie in either:
 *
 * 1. It does NOT run NextAuth. The site uses a DATABASE session strategy (auth.ts). An edge
 *    NextAuth() handler defaults to JWT, fails to decode the database session cookie and wipes it
 *    with `Set-Cookie: ...; Max-Age=0`, which once broke magic-link sign-in. Real auth enforcement
 *    lives in Server Components and Server Actions via auth() from auth.ts.
 *
 * 2. Our own visit counting, way C (lib/metrics/core.ts): when the server is asked for a page, it
 *    adds one to that page's daily total (people and robots apart). It runs in Node so it can write
 *    to the database, and it writes after the page has gone, so a page is never slowed.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { metricsOpen, sortRequest, countedPath, countedReferrer, countLater } from '@/lib/metrics/core'

export function middleware(req: NextRequest) {
  if (metricsOpen()) {
    const path = countedPath(req.nextUrl.pathname)
    if (path) {
      const sorted = sortRequest(req.method, req.headers)
      countLater(sorted, path, countedReferrer(req.headers.get('referer'), req.headers.get('host')))
    }
  }
  return NextResponse.next()
}

export const config = {
  runtime: 'nodejs',
  // Every page; not the framework's files, the API, or anything with a file extension.
  matcher: ['/((?!_next/|api/|.*\\.[A-Za-z0-9]+$).*)'],
}
