/**
 * Supabase browser client — use in Client Components only.
 * Uses createBrowserClient from @supabase/ssr which handles cookie management
 * automatically in Next.js App Router.
 */
import { createBrowserClient } from '@supabase/ssr'

/**
 * No <Database> generic here — Supabase's generated types require a live project
 * (supabase gen types). Once E2 (project creation) is done and types are generated
 * to lib/types/supabase.gen.ts, replace `any` with the generated Database type.
 * Query return values are cast to our handwritten types in queries.ts / actions.ts.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
