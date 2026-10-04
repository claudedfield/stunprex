/**
 * D-NEWS-01: subscribe, confirm (double opt-in) and unsubscribe.
 *
 * - A new address gets a `pending` row and one confirmation mail. Nothing else is ever sent to a
 *   pending address, and never a second confirmation within 24 hours.
 * - A confirmed address that subscribes again gets no mail and no second row.
 * - Unsubscribing deletes the row (LEGAL-02.6), so a later sign-up from that address is a new one.
 * - A bounced address is never mailed, and its row is deleted 90 days after the bounce.
 * - A sign-up never confirmed is deleted when its link expires (cleanup.mjs).
 * - The consent record is the name given, the timestamps and the confirmation token used (Grt. 6. § (2)).
 *   No IP address is stored. The name is used only in the confirmation mail and the issues.
 */
import { sql } from '@/db'
import {
  CONFIRM_DAYS, CONFIRM_PER_24H, CONFIRM_PER_HOUR, MAILBOX_BUDGET_24H, confirmationMail, mailboxUsage, newToken, normaliseEmail, normaliseName, sendOne,
} from './core.mjs'

type Row = {
  id: string; email: string; status: 'pending' | 'confirmed' | 'unsubscribed' | 'bounced'
  confirm_token: string | null; confirm_token_expires_at: string | null; confirm_sent_at: string | null
}

export type SubscribeOutcome = 'check_email' | 'already_confirmed' | 'invalid_email' | 'invalid_name' | 'busy'

const query = (text: string, values: unknown[]) => sql.query(text, values)

export async function subscribe(rawName: unknown, rawEmail: unknown, source: string): Promise<SubscribeOutcome> {
  const name = normaliseName(rawName)
  if (!name) return 'invalid_name'
  const email = normaliseEmail(rawEmail)
  if (!email) return 'invalid_email'
  const { rows } = await sql<Row>`SELECT * FROM newsletter_subscribers WHERE email = ${email}`
  const row = rows[0]
  if (row?.status === 'confirmed') return 'already_confirmed'
  if (row?.status === 'bounced') return 'check_email' // never mailed again; the answer does not say so
  if (row?.confirm_sent_at && Date.now() - new Date(row.confirm_sent_at).getTime() < 24 * 3600 * 1000) {
    return 'check_email' // one confirmation per address per 24 hours
  }
  const use = await mailboxUsage(query)
  if (use.confirm1 >= CONFIRM_PER_HOUR || use.confirm24 >= CONFIRM_PER_24H || use.total24 >= MAILBOX_BUDGET_24H) return 'busy'

  const token = newToken()
  const days = `${CONFIRM_DAYS} days`
  if (row) {
    await sql`
      UPDATE newsletter_subscribers
      SET status = 'pending', confirm_token = ${token}, confirm_token_expires_at = now() + ${days}::interval,
          confirm_sent_at = now(), consent_requested_at = now(), source = ${source}, name = ${name},
          unsubscribe_token = COALESCE(unsubscribe_token, ${newToken()})
      WHERE id = ${row.id}`
  } else {
    await sql`
      INSERT INTO newsletter_subscribers
        (email, name, source, status, confirm_token, confirm_token_expires_at, confirm_sent_at, consent_requested_at, unsubscribe_token)
      VALUES (${email}, ${name}, ${source}, 'pending', ${token}, now() + ${days}::interval, now(), now(), ${newToken()})
      ON CONFLICT (email) DO NOTHING`
  }
  await sendOne(query, { to: email, ...confirmationMail(token, name) })
  return 'check_email'
}

export type ConfirmOutcome = 'confirmed' | 'expired' | 'invalid'

export async function confirm(token: unknown): Promise<ConfirmOutcome> {
  if (typeof token !== 'string' || token.length < 16) return 'invalid'
  const { rows } = await sql<Row>`SELECT * FROM newsletter_subscribers WHERE confirm_token = ${token}`
  const row = rows[0]
  if (!row) return 'invalid'
  if (row.status === 'confirmed') return 'confirmed'
  if (row.status !== 'pending') return 'invalid'
  if (row.confirm_token_expires_at && new Date(row.confirm_token_expires_at).getTime() < Date.now()) return 'expired'
  await sql`
    UPDATE newsletter_subscribers SET status = 'confirmed', confirmed_at = now(), unsubscribed_at = NULL
    WHERE id = ${row.id} AND status = 'pending'`
  return 'confirmed'
}

/**
 * One click, no question asked. LEGAL-02.6: the row is deleted at once, name and address with it; the
 * send records keep their counts without the person. A second use of the same link finds nothing.
 */
export async function unsubscribe(token: unknown): Promise<'unsubscribed' | 'invalid'> {
  if (typeof token !== 'string' || token.length < 16) return 'invalid'
  const { rowCount } = await sql`DELETE FROM newsletter_subscribers WHERE unsubscribe_token = ${token}`
  return rowCount ? 'unsubscribed' : 'invalid'
}
