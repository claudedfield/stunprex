/**
 * Auth.js v5 (next-auth@beta) configuration for StunpreX Community.
 *
 * Provider: Email, no password, no OAuth at v1. Sign-in is finished by a six-digit code or a
 * one-press link (D-AUTH-02, lib/auth/signin-code.ts).
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
import { MAGIC_LINK_MAX_AGE_SECONDS } from './lib/auth-constants'
import PostgresAdapter from '@auth/pg-adapter'
import { db } from '@/db'
import { sendSignInMail } from '@/lib/email'
import { issueSignIn, clientIp } from '@/lib/auth/signin-code'
import { ensureProfile } from '@/lib/auth/db'
import { redactError } from '@/lib/log-redact'
import { TERMS_VERSION } from './lib/legal'

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
      maxAge: MAGIC_LINK_MAX_AGE_SECONDS, // LEGAL-01i: 15 minutes, as every page and email says
      server: process.env.EMAIL_SERVER ?? 'smtp://localhost:25',
      sendVerificationRequest: async ({ identifier: email, url, request }) => {
        // D-AUTH-02: Auth.js's own link (`url`) signs in on a plain GET, so a mail scanner that
        // fetches it made an account. It is never mailed. It is stored encrypted, and the mail
        // carries a six-digit code and a link to a page with one button; either releases it by
        // a POST. This is also the one place every sign-in request passes, so the limits are
        // enforced here (issueSignIn throws SignInLimitError and nothing is sent).
        //
        // `url` is built on the served host, which is the apex (D-WEB-12): the host of the link
        // must equal the served host, with no redirect between the press and the callback.
        const { code, linkToken } = await issueSignIn(email, url, clientIp(request.headers))
        await sendSignInMail(email, code, `${new URL(url).origin}/auth/verify?token=${linkToken}`)
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
        // The header shows who is signed in (AuthNav).
        ;(session.user as typeof session.user & { display_name: string }).display_name = profile.display_name
        // LEGAL-01a, 01b: writes need the current terms accepted and the age confirmed.
        ;(session.user as typeof session.user & { terms_ok: boolean }).terms_ok =
          profile.terms_version === TERMS_VERSION && profile.age_confirmed_at != null
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

  // LEGAL-01m: Auth.js's own error and warning lines pass through the same redaction as ours,
  // so no email address or magic-link URL reaches the server log.
  logger: {
    error(error: Error) {
      console.error('[auth][error]', redactError(error))
    },
    warn(code: string) {
      console.warn('[auth][warn]', code)
    },
    debug() {},
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
    console.error('[auth] NextAuth init failed (AUTH_SECRET missing?):', redactError(err))
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
