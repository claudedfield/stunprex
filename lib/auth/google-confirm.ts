/**
 * The one-time address check for a Google sign-in whose address Google is not the authority for
 * (C1; lib/auth/google.ts). The waiting sign-in is tied to the browser that started it; it becomes
 * a link only when that same browser finishes an email sign-in, by the code, to the same address.
 */
import { sql } from '@/db'
import { hashNonce, readSignInChoice } from '@/lib/auth/session-choice'
import { safeNext } from '@/lib/auth/next'
import { redactError } from '@/lib/log-redact'

const WAIT = '15 minutes'

/** Hold a Google sign-in for its address check. False when the browser has no sign-in cookie. */
export async function holdGoogleSignIn(email: string, providerAccountId: string, next: unknown): Promise<boolean> {
  const choice = await readSignInChoice()
  if (!choice) return false
  await sql`INSERT INTO google_pending (nonce_hash, email, provider_account_id, next)
            VALUES (${hashNonce(choice.nonce)}, ${email.toLowerCase()}, ${providerAccountId}, ${safeNext(next)})
            ON CONFLICT (nonce_hash) DO UPDATE SET email = EXCLUDED.email, provider_account_id = EXCLUDED.provider_account_id,
              next = EXCLUDED.next, created_at = now()`
  return true
}

/** The Google sign-in this browser is holding, if it is still within its 15 minutes. */
export async function heldGoogleSignIn(): Promise<{ email: string; next: string } | null> {
  const choice = await readSignInChoice()
  if (!choice) return null
  const { rows } = await sql<{ email: string; next: string }>`
    SELECT email, next FROM google_pending WHERE nonce_hash = ${hashNonce(choice.nonce)} AND created_at > now() - ${WAIT}::interval`
  return rows[0] ?? null
}

/** Is this Google account already linked to one of ours? Then the link stands and it is one click. */
export async function googleLinked(providerAccountId: string): Promise<boolean> {
  const { rows } = await sql`SELECT 1 FROM accounts WHERE provider = 'google' AND "providerAccountId" = ${providerAccountId}`
  return rows.length > 0
}

/**
 * After an email sign-in: if this browser held a Google sign-in for the same address, link it now.
 * `link` is the adapter's linkAccount, so the link is stored as every other one, without tokens.
 */
export async function linkHeldGoogle(
  userId: string,
  email: string,
  link: (a: { userId: string; type: 'oidc'; provider: 'google'; providerAccountId: string }) => Promise<unknown>,
): Promise<void> {
  try {
    const choice = await readSignInChoice()
    if (!choice) return
    const { rows } = await sql<{ email: string; provider_account_id: string }>`
      DELETE FROM google_pending WHERE nonce_hash = ${hashNonce(choice.nonce)} AND created_at > now() - ${WAIT}::interval
      RETURNING email, provider_account_id`
    const held = rows[0]
    if (!held || held.email !== email.toLowerCase()) return
    if (await googleLinked(held.provider_account_id)) return
    await link({ userId, type: 'oidc', provider: 'google', providerAccountId: held.provider_account_id })
  } catch (err) {
    console.error('[google-confirm]', redactError(err))
  }
}
