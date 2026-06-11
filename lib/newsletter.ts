/**
 * Newsletter core — double-opt-in subscribe / confirm / unsubscribe.
 *
 * Self-hosted: Vercel Postgres for state, self-built SMTP (lib/email.ts) for
 * delivery. No third-party email service.
 *
 * Data minimisation: we store email + opaque tokens + timestamps. Nothing
 * else — no name, no IP, no tracking.
 *
 * All three operations are idempotent — safe to call repeatedly with the
 * same input (double form submits, re-clicked links, mail-client prefetch).
 */
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { sql } from '@/db'
import { sendMail } from '@/lib/email'

const emailSchema = z.string().trim().toLowerCase().pipe(z.email())

function baseUrl(): string {
  return process.env.NEXTAUTH_URL ?? 'https://stunprex.com'
}

/**
 * Subscribe an email address (double opt-in step 1).
 *
 * - New address → insert as 'pending', send confirmation email.
 * - Existing 'pending' → re-send confirmation email (same token).
 * - Existing 'unsubscribed' → back to 'pending', send confirmation email.
 * - Existing 'confirmed' → no-op (no duplicate email, no state change).
 *
 * Throws ZodError on an invalid address; callers decide how to respond
 * (the API route deliberately answers the same way regardless).
 */
export async function subscribe(rawEmail: string, source?: string): Promise<void> {
  const email = emailSchema.parse(rawEmail)

  const { rows } = await sql`
    INSERT INTO newsletter_subscribers (email, status, confirm_token, unsub_token, source, consent_at)
    VALUES (${email}, 'pending', ${randomUUID()}, ${randomUUID()}, ${source ?? null}, now())
    ON CONFLICT (email) DO UPDATE SET
      status     = CASE WHEN newsletter_subscribers.status = 'confirmed'
                        THEN newsletter_subscribers.status ELSE 'pending' END,
      consent_at = CASE WHEN newsletter_subscribers.status = 'confirmed'
                        THEN newsletter_subscribers.consent_at ELSE now() END,
      source     = COALESCE(newsletter_subscribers.source, EXCLUDED.source),
      confirm_token = COALESCE(newsletter_subscribers.confirm_token, EXCLUDED.confirm_token),
      unsub_token   = COALESCE(newsletter_subscribers.unsub_token, EXCLUDED.unsub_token)
    RETURNING status, confirm_token
  `

  const row = rows[0] as { status: string; confirm_token: string | null }

  // Already confirmed → nothing to send. Pending (new or returning) → confirm link.
  if (row.status !== 'pending' || !row.confirm_token) return

  const confirmLink = `${baseUrl()}/api/newsletter/confirm?token=${encodeURIComponent(row.confirm_token)}`
  await sendConfirmEmail(email, confirmLink)
}

/**
 * Confirm a subscription (double opt-in step 2).
 * Idempotent: re-clicking the link keeps status 'confirmed' and the original
 * confirmed_at. A confirm link cannot resurrect an unsubscribed address.
 * Returns true if the token matched an active (non-unsubscribed) row.
 */
export async function confirm(token: string): Promise<boolean> {
  if (!token) return false

  const { rowCount } = await sql`
    UPDATE newsletter_subscribers
    SET status = 'confirmed',
        confirmed_at = COALESCE(confirmed_at, now())
    WHERE confirm_token = ${token}
      AND status <> 'unsubscribed'
  `
  return (rowCount ?? 0) > 0
}

/**
 * Unsubscribe via per-subscriber token.
 * Idempotent: repeat calls keep status 'unsubscribed' and the original
 * unsubscribed_at. Returns true if the token matched a row.
 */
export async function unsubscribe(token: string): Promise<boolean> {
  if (!token) return false

  const { rowCount } = await sql`
    UPDATE newsletter_subscribers
    SET status = 'unsubscribed',
        unsubscribed_at = COALESCE(unsubscribed_at, now())
    WHERE unsub_token = ${token}
  `
  return (rowCount ?? 0) > 0
}

/** Branded double-opt-in confirmation email — same table pattern as sendMagicLink. */
async function sendConfirmEmail(to: string, confirmLink: string): Promise<void> {
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5FAF5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5FAF5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px 48px;max-width:560px;width:100%;">
        <tr><td style="padding-bottom:24px;border-bottom:1px solid #E8F0E8;">
          <span style="font-family:Georgia,serif;font-size:18px;font-weight:bold;color:#107099;letter-spacing:0.02em;">StunpreX</span>
        </td></tr>
        <tr><td style="padding-top:32px;padding-bottom:24px;">
          <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:16px;color:#472B08;line-height:1.6;">
            You asked to receive the StunpreX letters — methodology pieces on
            individual player development. One click to confirm it was you.
          </p>
          <p style="margin:0 0 32px;font-family:Georgia,serif;font-size:16px;color:#472B08;line-height:1.6;">
            If you didn&rsquo;t request this, do nothing — you won&rsquo;t be subscribed.
          </p>
          <a href="${confirmLink}"
             style="display:inline-block;background:#FA961C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-family:Georgia,serif;font-size:16px;font-weight:bold;">
            Confirm subscription
          </a>
        </td></tr>
        <tr><td style="padding-top:24px;border-top:1px solid #E8F0E8;">
          <p style="margin:0;font-family:Georgia,serif;font-size:13px;color:#472B08;opacity:0.5;line-height:1.5;">
            No hype, no spam — and every issue carries an unsubscribe link.<br>
            We store nothing beyond your email address.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const textBody = `Confirm your StunpreX newsletter subscription

${confirmLink}

You asked to receive the StunpreX letters. One click to confirm it was you.
If you didn't request this, do nothing — you won't be subscribed.`

  await sendMail({
    to,
    subject: 'Confirm your StunpreX subscription',
    html: htmlBody,
    text: textBody,
  })
}
