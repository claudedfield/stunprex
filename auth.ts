/**
 * Auth.js v5 (next-auth@beta) configuration for StunpreX Community.
 *
 * Provider: Email (magic-link only). No password, no OAuth at v1.
 * Adapter: @auth/pg-adapter over Vercel Postgres.
 * Custom sendVerificationRequest calls our self-built SMTP Nodemailer send (lib/email.ts).
 *
 * Required env vars:
 *   POSTGRES_URL            — Vercel Postgres connection string (pooled)
 *   POSTGRES_URL_NON_POOLING — Vercel Postgres direct connection string
 *   AUTH_SECRET             — 32+ char random string (openssl rand -base64 32)
 *   NEXTAUTH_URL            — https://stunprex.com in production; http://localhost:3000 locally
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM — §11 brief
 */
import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Email from 'next-auth/providers/email'
import PostgresAdapter from '@auth/pg-adapter'
import pg from 'pg'

// Direct pg.Pool for @auth/pg-adapter — VercelPool type is not directly
// assignable to pg.Pool; using pg directly resolves the TS type mismatch.
//
// Make the SSL mode explicit: pg-connection-string currently treats
// `sslmode=require` as `verify-full`, but warns that a future major version
// will silently downgrade it to weaker (libpq) semantics. Pinning to
// `verify-full` is behavior-identical today and removes the deprecation
// warning + future security regression.
function withExplicitSslMode(cs: string | undefined): string | undefined {
  if (!cs) return cs
  return cs.replace(/([?&]sslmode=)(prefer|require|verify-ca)\b/i, '$1verify-full')
}

const pool = new pg.Pool({
  connectionString: withExplicitSslMode(
    process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL,
  ),
})
import { sendMagicLink } from '@/lib/email'
import { ensureProfile } from '@/lib/auth/db'

export const authConfig: NextAuthConfig = {
  adapter: PostgresAdapter(pool),

  providers: [
    Email({
      /**
       * Magic-link — no password. Custom sendVerificationRequest routes
       * through our own SMTP Nodemailer send so no third-party logo appears.
       *
       * `server` must be non-empty to pass Auth.js instantiation check at build
       * time even when SMTP env vars are not yet provisioned. The actual send
       * goes through sendMagicLink (lib/email.ts) which reads env vars at
       * call time — it will throw a clear error if vars are missing at runtime.
       */
      server: process.env.EMAIL_SERVER ?? 'smtp://localhost:25',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await sendMagicLink(email, url)
      },
    }),
  ],

  callbacks: {
    /**
     * Extend the session with user id and role from profiles table.
     * Called on every session read; keep it lightweight.
     */
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
        // Pull role + is_banned from profiles; ensureProfile creates it if missing
        const profile = await ensureProfile(user.id, user.email ?? '')
        ;(session.user as typeof session.user & { role: string; is_banned: boolean; onboarded: boolean }).role = profile.role
        ;(session.user as typeof session.user & { role: string; is_banned: boolean; onboarded: boolean }).is_banned = profile.is_banned
        ;(session.user as typeof session.user & { role: string; is_banned: boolean; onboarded: boolean }).onboarded = profile.onboarded
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/sign-in',
    verifyRequest: '/auth/verify',
    error: '/auth/sign-in',    // query ?error= for errors
    newUser: '/community/welcome',  // first-time onboarding redirect
  },

  session: {
    strategy: 'database',    // persist sessions in DB, not JWT
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
