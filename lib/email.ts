/**
 * Self-built email send — Nodemailer over SMTP.
 * No third-party email-as-a-service (Resend, SendGrid, Mailgun, Postmark, etc).
 * Brief §11: Dezső supplies SMTP credentials via env vars.
 *
 * Required env vars (Vercel + .env.local):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Used by Auth.js sendVerificationRequest for magic-link delivery.
 */
import nodemailer from 'nodemailer'

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

export async function sendMagicLink(to: string, link: string) {
  const transport = getTransport()

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
            Here is your sign-in link for StunpreX Community.
          </p>
          <p style="margin:0 0 32px;font-family:Georgia,serif;font-size:16px;color:#472B08;line-height:1.6;">
            This link expires in 15 minutes and can only be used once.
          </p>
          <a href="${link}"
             style="display:inline-block;background:#FA961C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-family:Georgia,serif;font-size:16px;font-weight:bold;">
            Sign in to StunpreX
          </a>
        </td></tr>
        <tr><td style="padding-top:24px;border-top:1px solid #E8F0E8;">
          <p style="margin:0;font-family:Georgia,serif;font-size:13px;color:#472B08;opacity:0.5;line-height:1.5;">
            If you did not request this link, you can ignore this email. Your account is secure.<br>
            Do not share this link with anyone.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const textBody = `Sign in to StunpreX Community

${link}

This link expires in 15 minutes and can only be used once.
If you did not request this, ignore this email.`

  await transport.sendMail({
    from: `"StunpreX" <${process.env.SMTP_FROM!}>`,
    to,
    subject: 'Your StunpreX sign-in link',
    text: textBody,
    html: htmlBody,
  })
}
