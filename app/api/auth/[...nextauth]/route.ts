/**
 * Auth.js v5 route handler — handles all /api/auth/* requests.
 * This is the required catch-all route for Auth.js in Next.js App Router.
 * Handles: sign-in, sign-out, session, CSRF, callbacks, and providers.
 */
import { handlers } from '@/auth'

// Never statically pre-render — auth routes must always be dynamic.
export const dynamic = 'force-dynamic'

export const { GET, POST } = handlers
