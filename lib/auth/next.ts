/**
 * Where a visitor goes after signing in (found 1 Oct 2026: the owner's first sign-in after the
 * database move succeeded, and sent him back to the sign-in form, which looked like a failure).
 * Only a path on this site is accepted: it starts with one "/", and never names another host.
 * Anything else, and the sign-in pages themselves, fall back to the community.
 */
export const AFTER_SIGN_IN = '/community'

export function safeNext(next: unknown): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return AFTER_SIGN_IN
  if (/^\/(signin|auth)(\/|\?|$)/.test(next)) return AFTER_SIGN_IN
  return next
}
