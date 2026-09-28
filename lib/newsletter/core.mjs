/**
 * D-NEWS-01: the newsletter's mail and rendering, shared by the site (subscribe, confirm) and the
 * send job on the VPS (scripts/newsletter-send.mjs). Plain JavaScript so the job runs it with node.
 *
 * Rules held here, not left to callers:
 * - Staging never sends. With STAGING=1 every message is written to newsletter_test_outbox instead,
 *   and any recipient other than the test address is refused (COO-DEV-0016).
 * - Mail goes from news@stunprex.com through Hostinger, one recipient per message, reply-to hello@.
 * - No tracking: no pixel, no rewritten links, no per-subscriber URL except confirm and unsubscribe.
 */
import crypto from 'node:crypto'
import nodemailer from 'nodemailer'
import { marked } from 'marked'

export const SITE = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'https://stunprex.com').replace(/\/$/, '')
export const FROM_ADDRESS = 'news@stunprex.com'
export const FROM = `"StunpreX" <${FROM_ADDRESS}>`
export const REPLY_TO = 'hello@stunprex.com'
export const TEST_ADDRESS = 'e2e@stunprex.test'
/** Days a confirmation link stays valid. */
export const CONFIRM_DAYS = 7
/** Confirmation mails across all addresses in one hour; stops a bot using our form to mail strangers. */
export const CONFIRM_PER_HOUR = Number(process.env.NEWSLETTER_CONFIRM_PER_HOUR || 30)
/** Issue messages per day (Hostinger's plan limit, read in hPanel; 100 until then). */
export const DAILY_CAP = Number(process.env.NEWSLETTER_DAILY_CAP || 100)
/** Seconds between two issue messages. */
export const SEND_INTERVAL_SECONDS = Number(process.env.NEWSLETTER_SEND_INTERVAL_SECONDS || 3)

export const isStaging = () => process.env.STAGING === '1'

/** Sign-ups open only where mail can go out: staging (captured) or with the news@ mailbox configured. */
export const newsletterReady = () => isStaging() || Boolean(process.env.NEWS_SMTP_PASS)

export function newToken() {
  return crypto.randomBytes(24).toString('base64url')
}

export function normaliseEmail(raw) {
  const e = String(raw ?? '').trim().toLowerCase()
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null
}

/** A name as typed, trimmed, 1 to 80 characters, no control characters; null when not usable. */
export function normaliseName(raw) {
  const n = String(raw ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  return n.length >= 1 && n.length <= 80 ? n : null
}

let transport
function smtp() {
  if (!process.env.NEWS_SMTP_PASS) throw new Error('NEWS_SMTP_PASS is not set; the news@ mailbox is not configured')
  transport ??= nodemailer.createTransport({
    host: process.env.NEWS_SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.NEWS_SMTP_PORT || 465),
    secure: Number(process.env.NEWS_SMTP_PORT || 465) === 465,
    auth: { user: FROM_ADDRESS, pass: process.env.NEWS_SMTP_PASS },
  })
  return transport
}

/**
 * Send one message to one recipient. `query` runs SQL ({ text, values }) for the staging capture.
 * Returns the SMTP message id, or "captured" on staging.
 */
export async function sendOne(query, { to, subject, text, html, headers = {} }) {
  if (isStaging()) {
    if (to !== TEST_ADDRESS) throw new Error(`staging sends to ${TEST_ADDRESS} only; refused ${to.replace(/@.*/, '@...')}`)
    await query('INSERT INTO newsletter_test_outbox (to_address, subject, headers, text_body, html_body) VALUES ($1, $2, $3, $4, $5)',
      [to, subject, JSON.stringify({ From: FROM, 'Reply-To': REPLY_TO, ...headers }), text, html])
    return 'captured'
  }
  const info = await smtp().sendMail({
    from: FROM, replyTo: REPLY_TO, to, subject, text, html, headers,
    envelope: { from: FROM_ADDRESS, to }, // bounces return to news@, where the bounce job reads them
  })
  return info.messageId
}

// ---- rendering --------------------------------------------------------------------------------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/** One column, our colours, no images needed, no external asset, no script, no pixel. */
function frame(title, preview, innerHtml, footerHtml) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F5FAF5;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5FAF5;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;">
<tr><td style="padding:28px 32px 8px;font-family:Georgia,serif;font-size:18px;font-weight:bold;color:#107099;">StunpreX</td></tr>
<tr><td style="padding:8px 32px 24px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:#472B08;">${innerHtml}</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #E8F0E8;font-family:Georgia,serif;font-size:13px;line-height:1.5;color:#6b5a44;">${footerHtml}</td></tr>
</table></td></tr></table></body></html>`
}

const styled = (html) => html
  .replace(/<h1>/g, '<h1 style="font-size:24px;color:#107099;margin:16px 0 12px;">')
  .replace(/<h2>/g, '<h2 style="font-size:20px;color:#107099;margin:24px 0 10px;">')
  .replace(/<h3>/g, '<h3 style="font-size:17px;color:#107099;margin:20px 0 8px;">')
  .replace(/<a href=/g, '<a style="color:#107099;" href=')
  .replace(/<blockquote>/g, '<blockquote style="margin:16px 0;padding-left:14px;border-left:3px solid #FA961C;color:#5b4a33;">')

/** Markdown to plain text: links become "text (url)", emphasis marks go. */
function plain(md) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, '$1 ($2)')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(^|[^*])\*(?!\s)([^*]+)\*/g, '$1$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function confirmationMail(token, name) {
  const hello = name ? `Hello ${name},` : 'Hello,'
  const url = `${SITE}/newsletter/confirm?token=${encodeURIComponent(token)}`
  const subject = 'Confirm your StunpreX newsletter subscription'
  const text = `${hello}

Someone, hopefully you, asked to receive the StunpreX newsletter at this address.

To confirm, open this link (it works for ${CONFIRM_DAYS} days):
${url}

If it was not you, ignore this email: nothing more will be sent.

StunpreX, stunprex.com. Replies reach ${REPLY_TO}.`
  const html = frame(subject, 'One click to confirm your subscription.',
    `<p>${esc(hello)}</p>
<p>Someone, hopefully you, asked to receive the StunpreX newsletter at this address.</p>
<p><a href="${esc(url)}" style="display:inline-block;background:#FA961C;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:bold;">Confirm my subscription</a></p>
<p>The link works for ${CONFIRM_DAYS} days. If it was not you, ignore this email: nothing more will be sent.</p>`,
    `StunpreX, <a style="color:#107099;" href="${SITE}">stunprex.com</a>. Replies reach ${REPLY_TO}.`)
  return { subject, text, html }
}

/**
 * An issue's two versions. `meta` is the front matter; `unsubscribeUrl` is the subscriber's own
 * link (for a preview, a placeholder link that unsubscribes no one).
 */
export function renderIssue(meta, markdown, unsubscribeUrl, name) {
  const hello = name ? `Hello ${name},` : ''
  const archive = `${SITE}/newsletter/${meta.slug}`
  const footerText = `You receive this because you subscribed at stunprex.com and confirmed.
Unsubscribe with one click: ${unsubscribeUrl}
Read it on the web: ${archive}
StunpreX, stunprex.com. Replies reach ${REPLY_TO}.`
  const text = `${meta.subject}\n\n${hello ? hello + '\n\n' : ''}${plain(markdown)}\n\n${meta.byline ? meta.byline + '\n\n' : ''}--\n${footerText}\n`
  const body = styled(marked.parse(markdown, { async: false, gfm: true }))
  const html = frame(meta.subject, meta.preview || '', (hello ? `<p>${esc(hello)}</p>` : '') + body + (meta.byline ? `<p style="margin-top:24px;">${esc(meta.byline)}</p>` : ''),
    `You receive this because you subscribed at stunprex.com and confirmed.<br>
<a style="color:#107099;" href="${esc(unsubscribeUrl)}">Unsubscribe with one click</a> · <a style="color:#107099;" href="${esc(archive)}">Read it on the web</a><br>
StunpreX, stunprex.com. Replies reach ${REPLY_TO}.`)
  return { subject: meta.subject, text, html }
}

/** RFC 8058 one-click unsubscribe headers for one subscriber. */
export function unsubscribeHeaders(token) {
  return {
    'List-Unsubscribe': `<${SITE}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

export const unsubscribeUrl = (token) => `${SITE}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
