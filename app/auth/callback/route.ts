/**
 * /auth/callback — OAuth + magic-link callback Route Handler.
 * Supabase Auth redirects here after successful authentication.
 * Exchanges the code for a session and redirects to the community.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // next param: where to redirect after auth (defaults to /community)
  const next = searchParams.get('next') ?? '/community'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Redirect to the intended destination
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failure — redirect to sign-in with error indicator
  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_callback_failed`)
}
