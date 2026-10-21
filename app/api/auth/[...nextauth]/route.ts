/**
 * Auth.js v5 route handler — handles all /api/auth/* requests.
 * This is the required catch-all route for Auth.js in Next.js App Router.
 * Handles: sign-in, sign-out, session, CSRF, callbacks, and providers.
 */
import { handlers } from '@/auth'
import { withSessionChoice } from '@/lib/auth/session-choice'

// Never statically pre-render — auth routes must always be dynamic.
export const dynamic = 'force-dynamic'

// The sign-in cookie of a session without "Keep me signed in" ends with the browser (03.4).
export const GET = withSessionChoice(handlers.GET)
export const POST = withSessionChoice(handlers.POST)
