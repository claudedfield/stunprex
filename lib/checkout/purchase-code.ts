/**
 * The purchase code (Legal's condition 2, LEGAL-0039; the owner's word of 22 Oct 2026): a six-digit
 * code mailed to the account's address and typed before a checkout opens, before a membership starts
 * and before a change of plan. Never at renewal: Stripe renews without us.
 *
 * Flow: issuePurchaseCode() mails the code; redeemPurchaseCode() checks it (five wrong tries end
 * it) and marks it used; spendPurchaseCode() is called by the step that opens Stripe, once, within
 * ten minutes of the code being used, for the same account and the same intent.
 */
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { sql } from '@/db'
import { sendSiteMail } from '@/lib/email'

const CODE_MINUTES = 15
const SPEND_MINUTES = 10
const MAX_ATTEMPTS = 5
const PER_15_MINUTES = 3

const hash = (id: string, code: string) =>
  createHash('sha256').update(`purchase:${process.env.AUTH_SECRET ?? ''}:${id}:${code}`).digest('hex')

/** What a code is for: "start:<lookup_key>", "change:<lookup_key>" or "buy:<lookup_key>". */
export const INTENT = /^(start|change|buy):[a-z0-9_]{1,60}$/

export class PurchaseCodeLimit extends Error {}

export async function issuePurchaseCode(userId: string, email: string, intent: string, describe: string): Promise<string> {
  if (!INTENT.test(intent)) throw new Error('unknown purchase intent')
  await sql`DELETE FROM purchase_codes WHERE created_at < now() - interval '24 hours'`
  const { rows } = await sql<{ n: number }>`SELECT count(*)::int AS n FROM purchase_codes
    WHERE user_id = ${userId} AND created_at > now() - interval '15 minutes'`
  if (rows[0].n >= PER_15_MINUTES) throw new PurchaseCodeLimit('Three codes were sent in the last 15 minutes. Please use the newest one, or wait a little.')
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const { rows: made } = await sql<{ id: string }>`INSERT INTO purchase_codes (user_id, intent, code_hash, expires_at)
    VALUES (${userId}, ${intent}, 'pending', now() + ${`${CODE_MINUTES} minutes`}::interval) RETURNING id`
  const id = made[0].id
  await sql`UPDATE purchase_codes SET code_hash = ${hash(id, code)} WHERE id = ${id}`
  await sendSiteMail(email, 'Your StunpreX purchase code',
    `Your code to confirm ${describe}: ${code.slice(0, 3)} ${code.slice(3)}\n\n` +
    `Type it on the page where you asked for it. It works once, for ${CODE_MINUTES} minutes.\n\n` +
    `If you did not ask for this, ignore this email: nothing is bought or changed without the code.\n\nStunpreX`)
  return id
}

/** Check a code for this account and intent. True when it matched; it is then marked used. */
export async function redeemPurchaseCode(userId: string, intent: string, code: string): Promise<boolean> {
  const clean = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(clean)) return false
  const { rows } = await sql<{ id: string; code_hash: string; attempts: number }>`
    SELECT id, code_hash, attempts FROM purchase_codes
    WHERE user_id = ${userId} AND intent = ${intent} AND used_at IS NULL AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1`
  const row = rows[0]
  if (!row || row.attempts >= MAX_ATTEMPTS) return false
  const want = Buffer.from(row.code_hash)
  const given = Buffer.from(hash(row.id, clean))
  if (want.length !== given.length || !timingSafeEqual(want, given)) {
    await sql`UPDATE purchase_codes SET attempts = attempts + 1 WHERE id = ${row.id}`
    return false
  }
  await sql`UPDATE purchase_codes SET used_at = now() WHERE id = ${row.id}`
  return true
}

/** The step that opens Stripe calls this once. True when a code was used for it in the last ten minutes. */
export async function spendPurchaseCode(userId: string, intent: string): Promise<boolean> {
  const { rows } = await sql<{ id: string }>`
    UPDATE purchase_codes SET spent_at = now()
    WHERE id = (SELECT id FROM purchase_codes WHERE user_id = ${userId} AND intent = ${intent}
                AND used_at > now() - ${`${SPEND_MINUTES} minutes`}::interval AND spent_at IS NULL
                ORDER BY used_at DESC LIMIT 1)
    RETURNING id`
  return rows.length === 1
}
