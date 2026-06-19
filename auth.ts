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
import { db } from '@vercel/postgres'
import { sendMagicLink } from '@/lib/email'
import { ensureProfile } from '@/lib/auth/db'

export const authConfig: NextAuthConfig = {
  adapter: PostgresAdapter(db),

  // Trust the host the request actually arrives on (Vercel terminates TLS and
  // forwards X-Forwarded-Host). Required so the magic-link callback validates and
  // sets cookies against the served host instead of throwing UntrustedHost.
  trustHost: true,

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
        // The site serves on www (apex 307-redirects to www). AUTH_URL is currently
        // apex, so Auth.js builds the magic link on apex — clicking it 307s to www
        // mid-callback and the verification cookie/session is dropped. Normalise the
        // link (and its embedded callbackUrl) to the served host so the click lands
        // directly on www, no redirect. Harmless no-op once AUTH_URL = www (Needs Dezső).
        const link = new URL(url)
        if (link.hostname === 'stunprex.com') link.hostname = 'www.stunprex.com'
        const cb = link.searchParams.get('callbackUrl')
        if (cb && cb.includes('://stunprex.com')) {
          link.searchParams.set('callbackUrl', cb.replace('://stunprex.com', '://www.stunprex.com'))
        }
        await sendMagicLink(email, link.toString())
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
    signIn: '/signin',
    verifyRequest: '/signin',
    error: '/signin',          // query ?error= for errors
    newUser: '/community/welcome',  // first-time onboarding redirect
  },

  session: {
    strategy: 'database',    // persist sessions in DB, not JWT
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}

// Defensive IIFE: if AUTH_SECRET is absent NextAuth() throws MissingSecret.
// This guard prevents that from crashing the module at import time so the
// public site keeps serving even when auth env vars aren't provisioned yet.
// Community routes that depend on a real auth() will receive null (signed-out).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _auth: any = (() => {
  try {
    return NextAuth(authConfig)
  } catch (err) {
    console.error('[auth] NextAuth init failed (AUTH_SECRET missing?):', err)
    return null
  }
})()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handlers: any = _auth?.handlers ?? {
  GET: async () => new Response('auth-not-configured', { status: 503 }),
  POST: async () => new Response('auth-not-configured', { status: 503 }),
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signIn: any = _auth?.signIn ?? (async () => {})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signOut: any = _auth?.signOut ?? (async () => {})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: any = _auth?.auth ?? (async () => null)
