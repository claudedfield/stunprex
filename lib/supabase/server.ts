/**
 * Supabase server client — use in Server Components, Server Actions, Route Handlers.
 * Reads/writes cookies via next/headers to maintain session state server-side.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * No <Database> generic — see lib/supabase/client.ts comment.
 * After E2 + supabase gen types, add the generated Database type here.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // The middleware handles session refresh.
          }
        },
      },
    }
  )
}
