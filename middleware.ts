/**
 * Next.js middleware — refreshes Supabase Auth session on every request.
 * Required by @supabase/ssr to keep server-side session in sync with cookies.
 * Must run before any route that checks auth state.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove, required for server-side auth state
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, opengraph-image, sitemap, robots, rss
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|opengraph-image|sitemap|robots|rss|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
