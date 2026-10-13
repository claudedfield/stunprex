'use server'
/**
 * LEGAL-03.2: reporting content, open to anyone, and the moderator's recorded decision.
 *
 * - A report needs no account and no accepted terms (03.7). A signed-in member's report is tied to
 *   the account; a visitor may give a name and an email address "so that we can answer you".
 * - A report about the sexual abuse or exploitation of a child needs neither name nor address.
 * - Where there is an address, an acknowledgement goes out at once and the outcome later, with the
 *   remedies text (Legal_Moderation_Texts_20261001.md, sections 2 and 3).
 * - hello@ is told that a report came in, with the item's address only: no text, no reporter.
 * - Five reports an hour per connection, counted in memory; the IP address is stored nowhere.
 */
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { sql } from '@/db'
import { clientIp } from '@/lib/auth/signin-code'
import { sendSiteMail } from '@/lib/email'
import { redactError } from '@/lib/log-redact'
import { reportOverLimit } from '@/lib/community/report-limit'

export type ReportResult = { ok: true } | { ok: false; error: string }

const SITE = 'https://stunprex.com'
const TYPES = ['question', 'answer', 'comment', 'user', 'other'] as const
/** A path on this site, with an optional #fragment; nothing else is accepted as "the item". */
function itemPath(raw: string): string | null {
  let v = raw.trim()
  if (v.startsWith(SITE)) v = v.slice(SITE.length)
  if (!v.startsWith('/') || v.startsWith('//') || v.length > 300 || /[\s<>"'\\]/.test(v)) return null
  return v
}

const day = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export async function submitPublicReport(_prev: ReportResult | null, formData: FormData): Promise<ReportResult> {
  const text = (k: string) => String(formData.get(k) ?? '').trim()
  // The bot trap: a filled field gets the same answer as a real report, and nothing is stored.
  if (text('website') !== '') return { ok: true }

  const type = (TYPES as readonly string[]).includes(text('type')) ? text('type') : 'other'
  const url = itemPath(text('url'))
  const what = text('what')
  const child = formData.get('child_safety') === 'on'
  const name = text('name').slice(0, 80)
  const email = text('email').slice(0, 254)

  if (!url) return { ok: false, error: 'Please give the address of the page or post on stunprex.com that this is about.' }
  if (what.length < 10) return { ok: false, error: 'Please say what is wrong and why, in a sentence or two.' }
  if (what.length > 3000) return { ok: false, error: 'Please keep the description under 3,000 characters.' }
  if (formData.get('good_faith') !== 'on') return { ok: false, error: 'Please tick the box to confirm that your report is accurate and complete.' }

  const session = await auth()
  const memberId: string | null = session?.user?.id ?? null
  if (!memberId && !child) {
    if (!name) return { ok: false, error: 'Please give your name, so that we can answer you.' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Please give an email address, so that we can answer you.' }
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'That email address does not look right. Correct it, or leave it empty.' }

  if (reportOverLimit(clientIp(await headers()))) return { ok: false, error: 'Too many reports from this connection in the last hour. Please try again later, or write to hello@stunprex.com.' }

  try {
    await sql`
      INSERT INTO reports (reporter_id, target_type, target_id, target_url, reason, detail, reporter_name, reporter_email, child_safety, good_faith_at)
      VALUES (${memberId}, ${type}, ${text('id').slice(0, 80)}, ${url}, ${child ? 'child-safety' : 'report'}, ${what},
              ${memberId ? null : name || null}, ${memberId ? null : email || null}, ${child}, now())`
  } catch (err) {
    console.error('[report]', redactError(err))
    return { ok: false, error: 'We could not store your report. Please try again, or write to hello@stunprex.com.' }
  }

  // Mail failures never lose a report: it is stored first, and the queue is the record.
  const address = `${SITE}${url}`
  try {
    await sendSiteMail('hello@stunprex.com', child ? 'A report came in (marked child safety)' : 'A report came in',
      `A report came in about ${address}.\n\nOpen the moderation queue to read it: ${SITE}/community/moderation`)
    const to = memberId ? (session?.user?.email ?? null) : email || null
    if (to) {
      await sendSiteMail(to, 'We have received your report',
        `Thank you. We received your report about ${address} on ${day(new Date())}. A person will look at it and write to you with the outcome. You do not need to do anything else.`)
    }
  } catch (err) {
    console.error('[report mail]', redactError(err))
  }
  return { ok: true }
}

const OUTCOME: Record<string, string> = {
  hidden: 'We have hidden it.',
  removed: 'We have removed it.',
  restricted: 'We have restricted the account.',
}

/** A moderator's decision on a report, with its reason. Where the reporter can be reached, the outcome is mailed. */
export async function decideReport(_prev: ReportResult | null, formData: FormData): Promise<ReportResult> {
  const session = await auth()
  const u = session?.user as ({ id?: string; role?: string; is_banned?: boolean } | undefined)
  if (!u?.id || u.is_banned || (u.role !== 'moderator' && u.role !== 'admin')) return { ok: false, error: 'Insufficient permissions.' }

  const id = String(formData.get('report_id') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const reason = String(formData.get('reason') ?? '').trim()
  if (!['hidden', 'removed', 'restricted', 'left'].includes(decision)) return { ok: false, error: 'Choose a decision.' }
  if (reason.length < 10) return { ok: false, error: 'Give the reason in one or two plain sentences.' }
  if (reason.length > 1000) return { ok: false, error: 'Keep the reason under 1,000 characters.' }

  const { rows } = await sql<{ target_url: string | null; reporter_email: string | null; member_email: string | null }>`
    UPDATE reports r
    SET status = ${decision === 'left' ? 'dismissed' : 'actioned'}, decision = ${decision}, decision_reason = ${reason},
        reviewed_by = ${u.id}, reviewed_at = now()
    WHERE r.id = ${id} AND r.status = 'open'
    RETURNING r.target_url, r.reporter_email, (SELECT email FROM users WHERE id = r.reporter_id) AS member_email`
  if (!rows[0]) return { ok: false, error: 'This report is no longer open.' }

  const to = rows[0].reporter_email ?? rows[0].member_email
  if (to) {
    const address = rows[0].target_url ? `${SITE}${rows[0].target_url}` : 'the content you reported'
    const what = decision === 'left' ? `We have left it in place, because: ${reason}` : OUTCOME[decision]
    try {
      await sendSiteMail(to, 'Your report about content on StunpreX',
        `We looked at ${address}. ${what}\n\nIf you disagree, reply to this email and a person will look again. You can also take the matter to a court, or complain to the NMHH (nmhh.hu), which asks that you use the reply route first.`)
      await sql`UPDATE reports SET outcome_sent_at = now() WHERE id = ${id}`
    } catch (err) {
      console.error('[report outcome mail]', redactError(err))
    }
  }
  revalidatePath('/community/moderation')
  return { ok: true }
}
