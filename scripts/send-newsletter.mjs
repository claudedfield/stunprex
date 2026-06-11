#!/usr/bin/env node
/**
 * scripts/send-newsletter.mjs — CLI newsletter sender.
 *
 * Usage:
 *   node scripts/send-newsletter.mjs path/to/issue.html "Subject line" [--dry]
 *
 * Sends an HTML issue to every CONFIRMED subscriber over the self-built SMTP
 * transport (same env vars as lib/email.ts). No third-party email service.
 *
 *   - Batches of 25 with a 2-second pause between batches (SMTP-friendly).
 *   - Per-subscriber List-Unsubscribe (mailto + one-click HTTPS) and
 *     List-Unsubscribe-Post headers (RFC 8058).
 *   - Appends a footer with the subscriber's unsubscribe link and the postal
 *     address from SMTP_POSTAL_ADDRESS (CAN-SPAM / GDPR transparency).
 *   - Records the send into newsletter_issues.
 *   - --dry: prints what would be sent, sends nothing, records nothing.
 *
 * Required env vars:
 *   POSTGRES_URL (and friends — @vercel/postgres reads them automatically)
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *   SMTP_POSTAL_ADDRESS — postal address line for the footer
 *   NEXTAUTH_URL — base URL for unsubscribe links (defaults to https://stunprex.com)
 */

import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { sql } from '@vercel/postgres'
import nodemailer from 'nodemailer'

const BATCH_SIZE = 25
const BATCH_PAUSE_MS = 2000

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2).filter((a) => a !== '--dry')
const dryRun = process.argv.includes('--dry')
const [htmlPath, subject] = args

if (!htmlPath || !subject) {
  console.error('Usage: node scripts/send-newsletter.mjs path/to/issue.html "Subject" [--dry]')
  process.exit(1)
}

const baseUrl = process.env.NEXTAUTH_URL ?? 'https://stunprex.com'
const postalAddress = process.env.SMTP_POSTAL_ADDRESS

if (!postalAddress && !dryRun) {
  console.error('[send-newsletter] SMTP_POSTAL_ADDRESS is required for a real send (footer postal address).')
  process.exit(1)
}

const bodyHtml = await readFile(htmlPath, 'utf8')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Same transport settings as lib/email.ts getTransport(). */
function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

/** Brand-styled footer with per-subscriber unsubscribe link + postal address. */
function buildFooter(unsubUrl) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5FAF5;padding:24px 16px;font-family:Georgia,serif;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-top:1px solid #E8F0E8;padding-top:16px;">
      <tr><td style="padding-top:16px;">
        <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:12px;color:#472B08;opacity:0.6;line-height:1.5;">
          You receive this because you confirmed your subscription at
          <a href="${baseUrl}" style="color:#107099;">stunprex.com</a>.
          <a href="${unsubUrl}" style="color:#107099;">Unsubscribe</a> — one click, no questions.
        </p>
        <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#472B08;opacity:0.6;line-height:1.5;">
          ${postalAddress ?? ''}
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>`
}

// ─── Load recipients ──────────────────────────────────────────────────────────

const { rows: subscribers } = await sql`
  SELECT id, email, unsub_token
  FROM newsletter_subscribers
  WHERE status = 'confirmed'
  ORDER BY created_at
`

console.log(`[send-newsletter] ${subscribers.length} confirmed subscriber(s). Subject: "${subject}"${dryRun ? ' [DRY RUN]' : ''}`)

if (subscribers.length === 0) {
  console.log('[send-newsletter] Nothing to send.')
  process.exit(0)
}

// Backfill unsub tokens for any legacy rows that lack one.
for (const sub of subscribers) {
  if (!sub.unsub_token) {
    sub.unsub_token = randomUUID()
    if (!dryRun) {
      await sql`UPDATE newsletter_subscribers SET unsub_token = ${sub.unsub_token} WHERE id = ${sub.id}`
    }
  }
}

// ─── Send in batches ──────────────────────────────────────────────────────────

const transport = dryRun ? null : getTransport()
const from = `"StunpreX" <${process.env.SMTP_FROM}>`
let sent = 0
let failed = 0

for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
  const batch = subscribers.slice(i, i + BATCH_SIZE)
  console.log(`[send-newsletter] Batch ${Math.floor(i / BATCH_SIZE) + 1} — ${batch.length} recipient(s)…`)

  await Promise.all(
    batch.map(async ({ email, unsub_token }) => {
      const unsubUrl = `${baseUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsub_token)}`
      const headers = {
        'List-Unsubscribe': `<mailto:${process.env.SMTP_FROM}?subject=unsubscribe>, <${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      }

      if (dryRun) {
        console.log(`  [dry] would send to ${email} (unsubscribe: ${unsubUrl})`)
        sent += 1
        return
      }

      try {
        await transport.sendMail({
          from,
          to: email,
          subject,
          html: bodyHtml + buildFooter(unsubUrl),
          headers,
        })
        sent += 1
      } catch (err) {
        failed += 1
        console.error(`  [error] ${email}: ${err instanceof Error ? err.message : err}`)
      }
    }),
  )

  if (i + BATCH_SIZE < subscribers.length) {
    await sleep(BATCH_PAUSE_MS)
  }
}

// ─── Record the issue ─────────────────────────────────────────────────────────

if (!dryRun) {
  await sql`
    INSERT INTO newsletter_issues (subject, body_html, sent_at, recipient_count)
    VALUES (${subject}, ${bodyHtml}, now(), ${sent})
  `
}

console.log(`[send-newsletter] Done. Sent: ${sent}, failed: ${failed}${dryRun ? ' (dry run — nothing actually sent or recorded)' : ''}`)
process.exit(failed > 0 ? 1 : 0)
