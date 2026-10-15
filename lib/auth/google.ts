/**
 * Sign in with Google (the owner's sign-in decision of 13 Oct 2026).
 *
 * What we take from Google: the account's id and its email address, and only when Google says the
 * address is verified. Not the name and not the picture (neutral display names, LEGAL-03.3; no
 * pictures from other hosts, LEGAL-02.3), and the scope asked for is "openid email" only.
 * Google's tokens are not stored: we need Google once, at sign-in, and never call it afterwards.
 *
 * It is on where both values are set and GOOGLE_SIGNIN_OPEN=1, and on staging for the tests.
 * Production stays closed until Legal's sentence naming Google is on /privacy.
 */
export const googleSignInOpen = () =>
  Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) &&
  (process.env.GOOGLE_SIGNIN_OPEN === '1' || process.env.STAGING === '1')

/** Google's profile reduced to what we keep. */
export function googleProfile(p: { sub: string; email?: string }) {
  return { id: p.sub, email: p.email ?? null, name: null, image: null }
}

/** The provider link as stored: which provider and which account there, and nothing else. */
export function withoutTokens<T extends Record<string, unknown>>(account: T): T {
  return {
    ...account,
    access_token: undefined,
    refresh_token: undefined,
    id_token: undefined,
    expires_at: undefined,
    scope: undefined,
    session_state: undefined,
    token_type: undefined,
  }
}
