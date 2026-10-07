/**
 * Self-built email send — Nodemailer over SMTP.
 * No third-party email-as-a-service (Resend, SendGrid, Mailgun, Postmark, etc).
 * Brief §11: Dezső supplies SMTP credentials via env vars.
 *
 * Required env vars (Vercel + .env.local):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Used by Auth.js sendVerificationRequest for the sign-in mail (D-AUTH-02: a six-digit code and a
 * link that opens a page with one button; neither signs anyone in when a mail scanner fetches it).
 * Staging never sends: the message is written to newsletter_test_outbox for the e2e suite.
 */
import nodemailer from 'nodemailer'
import { sql } from '@/db'

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  })
}

export const SIGN_IN_SUBJECT = 'Your StunpreX sign-in code'

export async function sendSignInMail(to: string, code: string, link: string) {
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`

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
            Your sign-in code for StunpreX Community:
          </p>
          <p style="margin:0 0 24px;font-family:'Courier New',monospace;font-size:32px;font-weight:bold;color:#107099;letter-spacing:0.12em;">
            ${spaced}
          </p>
          <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:16px;color:#472B08;line-height:1.6;">
            Type it on the page where you asked to sign in. Or open the sign-in page on this device:
          </p>
          <a href="${link}"
             style="display:inline-block;background:#FA961C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-family:Georgia,serif;font-size:16px;font-weight:bold;">
            Open the sign-in page
          </a>
          <p style="margin:24px 0 0;font-family:Georgia,serif;font-size:16px;color:#472B08;line-height:1.6;">
            The code and the link last 15 minutes and work once.
          </p>
        </td></tr>
        <tr><td style="padding-top:24px;border-top:1px solid #E8F0E8;">
          <p style="margin:0;font-family:Georgia,serif;font-size:13px;color:#472B08;opacity:0.5;line-height:1.5;">
            If you did not ask to sign in, you can ignore this email. Nobody is signed in by it.<br>
            Do not share the code or the link with anyone.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const textBody = `Your sign-in code for StunpreX Community: ${spaced}

Type it on the page where you asked to sign in. Or open the sign-in page on this device:

${link}

The code and the link last 15 minutes and work once.
If you did not ask to sign in, ignore this email. Nobody is signed in by it.`

  const from = `"StunpreX" <${process.env.SMTP_FROM!}>`
  // D-MAIL-01: sign-in mail goes out from its own mailbox (signin@), which nobody reads;
  // a reply reaches hello@.
  const replyTo = 'hello@stunprex.com'

  if (process.env.STAGING === '1') {
    await sql`INSERT INTO newsletter_test_outbox (to_address, subject, headers, text_body, html_body)
              VALUES (${to}, ${SIGN_IN_SUBJECT}, ${JSON.stringify({ From: from, 'Reply-To': replyTo })}, ${textBody}, ${htmlBody})`
    return
  }

  await getTransport().sendMail({ from, replyTo, to, subject: SIGN_IN_SUBJECT, text: textBody, html: htmlBody })
}
