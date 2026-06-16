/**
 * Edge-compatible Auth.js v5 config — no Node.js-only imports.
 *
 * Used exclusively by middleware.ts which runs in the Vercel Edge Runtime.
 * The Edge runtime cannot import pg (needs Node.js net/tls) or nodemailer,
 * so any module that touches those must stay out of this file.
 *
 * The full server-side config (adapter + email provider + session callback)
 * lives in auth.ts and is imported only from Server Components and Route Handlers.
 *
 * Route protection strategy: middleware always allows the request through
 * (authorized returns true). Actual auth checks happen in Server Components
 * and Server Actions via auth() from auth.ts, which runs in the Node.js runtime.
 */
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/signin',
    verifyRequest: '/signin',
    error: '/signin',
    newUser: '/community/welcome',
  },

  callbacks: {
    authorized() {
      // No edge-level route locking — allow all requests through.
      // Server Components and Actions enforce auth via auth() from auth.ts.
      return true
    },
  },

  // No providers here — email provider requires nodemailer (Node.js only).
  // Providers are declared in auth.ts.
  providers: [],
} satisfies NextAuthConfig
