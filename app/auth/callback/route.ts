/**
 * /auth/callback — Auth.js v5 magic-link verification Route Handler.
 * Auth.js handles the callback internally via the [...nextauth] handler.
 * This route handles the ?callbackUrl redirect and provides a clean entry point.
 * The actual token exchange is done by Auth.js's built-in GET /api/auth/callback/email route.
 *
 * This file redirects /auth/callback to /api/auth/callback so both URL patterns work.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  // Forward all query params to Auth.js's actual callback handler
  const params = searchParams.toString()
  return NextResponse.redirect(
    `${origin}/api/auth/callback/email${params ? '?' + params : ''}`
  )
}
