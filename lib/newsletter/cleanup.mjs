/**
 * LEGAL-02.6: the two newsletter clean-ups. Run daily on the VPS (`newsletter-send.mjs cleanup`).
 *
 * - A sign-up that was never confirmed is deleted once its confirmation link has expired, 7 days
 *   after the request ("If you never confirm, we delete your request within 7 days").
 * - An address that could not be delivered to is deleted 90 days after the bounce.
 *
 * Unsubscribing deletes the row at once (subscribers.ts), so there is nothing to clean up for it.
 * Returns counts only; no row is read out.
 */
export async function cleanup(query) {
  const pending = await query(
    `DELETE FROM newsletter_subscribers WHERE status = 'pending' AND confirm_token_expires_at < now()`, [])
  const bounced = await query(
    `DELETE FROM newsletter_subscribers WHERE status = 'bounced' AND bounced_at < now() - interval '90 days'`, [])
  return { pending_deleted: pending.rowCount ?? 0, bounced_deleted: bounced.rowCount ?? 0 }
}
