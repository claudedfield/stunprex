/**
 * Sign in with Google (the owner's sign-in decision of 13 Oct 2026).
 *
 * What we take from Google: the account's id and its email address, and only when Google says the
 * address is verified. Not the name and not the picture (neutral display names, LEGAL-03.3; no
 * pictures from other hosts, LEGAL-02.3), and the scope asked for is "openid email" only.
 * Google's tokens are not stored: we need Google once, at sign-in, and never call it afterwards.
 *
 * It is on where both values are set and GOOGLE_SIGNIN_OPEN=1, and on staging for the tests.
 *
 * Which Google sign-ins are one click (Legal's rule C1, revision 3 section 1): only where Google is
 * the authority for the address, a verified @gmail.com address or a verified Google Workspace
 * account (`hd` set). Any other address Google holds is checked once by the code we email to it,
 * before it is linked to an account or opens one; from then on the link stands.
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

export type GoogleTrust = 'one-click' | 'confirm' | 'refuse'

/** What a Google sign-in may do, from Google's own profile (`email_verified`, `hd`). */
export function googleTrust(p: { email?: string; email_verified?: boolean; hd?: string } | undefined): GoogleTrust {
  const email = (p?.email ?? '').toLowerCase()
  if (!email || p?.email_verified !== true) return 'refuse'
  if (email.endsWith('@gmail.com') || (typeof p.hd === 'string' && p.hd !== '')) return 'one-click'
  return 'confirm'
}
