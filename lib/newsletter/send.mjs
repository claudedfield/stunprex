/**
 * D-NEWS-01: sending an issue. Used by the send job on the VPS (scripts/newsletter-send.mjs) and by
 * the staging test route. `query(text, values)` runs SQL and resolves to { rows, rowCount }.
 *
 * - One recipient per message, with that subscriber's own unsubscribe link and RFC 8058 headers, and
 *   the name they gave in the greeting (the only other place it is used is the confirmation mail).
 * - List sends go only to `confirmed` rows, at most once per subscriber per issue (a unique index
 *   backs this), one message every SEND_INTERVAL_SECONDS, and no more than DAILY_CAP list messages in
 *   a UTC day across all issues: at the cap the job stops and the next run carries on.
 * - Every message is recorded in newsletter_sends with its result.
 */
import {
  DAILY_CAP, SEND_INTERVAL_SECONDS, renderIssue, sendOne, unsubscribeHeaders, unsubscribeUrl,
} from './core.mjs'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function ensureIssueRow(query, meta) {
  const { rows } = await query(
    `INSERT INTO newsletter_issues (number, slug, subject) VALUES ($1, $2, $3)
     ON CONFLICT (number) DO UPDATE SET subject = EXCLUDED.subject RETURNING id`,
    [meta.number, meta.slug, meta.subject])
  return rows[0].id
}

/** One issue to one confirmed subscriber row ({ id, email, unsubscribe_token }). */
export async function sendToSubscriber(query, issue, issueId, sub) {
  const mail = renderIssue(issue.meta, issue.body, unsubscribeUrl(sub.unsubscribe_token), sub.name)
  let result
  try {
    result = 'sent ' + await sendOne(query, { to: sub.email, ...mail, headers: unsubscribeHeaders(sub.unsubscribe_token) })
  } catch (err) {
    result = 'failed: ' + String(err?.message ?? err).replace(/[^\s@<>]+@[^\s@<>]+/g, '<email>').slice(0, 200)
  }
  await query(
    `INSERT INTO newsletter_sends (issue_id, subscriber_id, kind, result) VALUES ($1, $2, 'list', $3)
     ON CONFLICT DO NOTHING`, [issueId, sub.id, result])
  return result
}

/** A preview to internal addresses. Its unsubscribe link and header name no subscriber. */
export async function sendPreview(query, issue, addresses) {
  const issueId = await ensureIssueRow(query, issue.meta)
  const out = []
  for (const to of addresses) {
    const mail = renderIssue(issue.meta, issue.body, unsubscribeUrl('preview-unsubscribes-no-one'))
    const subject = `[Preview] ${mail.subject}`
    let result
    try { result = 'sent ' + await sendOne(query, { to, ...mail, subject, headers: unsubscribeHeaders('preview-unsubscribes-no-one') }) }
    catch (err) { result = 'failed: ' + String(err?.message ?? err).slice(0, 200) }
    await query(`INSERT INTO newsletter_sends (issue_id, preview_to, kind, result) VALUES ($1, $2, 'preview', $3)`, [issueId, to, result])
    out.push(result)
  }
  return out
}

/** The list send: every confirmed subscriber not yet sent this issue, within today's cap. */
export async function sendList(query, issue, log = console.log) {
  const issueId = await ensureIssueRow(query, issue.meta)
  await query(`UPDATE newsletter_issues SET list_started_at = COALESCE(list_started_at, now()) WHERE id = $1`, [issueId])
  const { rows: [{ n: sentToday }] } = await query(
    `SELECT count(*)::int AS n FROM newsletter_sends WHERE kind = 'list' AND sent_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'`, [])
  let budget = DAILY_CAP - sentToday
  const { rows: due } = await query(
    `SELECT s.id, s.email, s.name, s.unsubscribe_token FROM newsletter_subscribers s
     WHERE s.status = 'confirmed' AND s.unsubscribe_token IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM newsletter_sends x WHERE x.issue_id = $1 AND x.subscriber_id = s.id AND x.kind = 'list')
     ORDER BY s.confirmed_at`, [issueId])
  let sent = 0, failed = 0
  for (const sub of due) {
    if (budget <= 0) { log(`daily cap ${DAILY_CAP} reached; ${due.length - sent - failed} left for the next run`); break }
    const r = await sendToSubscriber(query, issue, issueId, sub)
    r.startsWith('sent') ? sent++ : failed++
    budget--
    await sleep(SEND_INTERVAL_SECONDS * 1000)
  }
  const left = due.length - sent - failed
  if (left === 0) await query(`UPDATE newsletter_issues SET list_finished_at = now() WHERE id = $1`, [issueId])
  return { issueId, due: due.length, sent, failed, left }
}

/** Counts per issue for the report: sent, failed, bounced. */
export async function issueCounts(query, issueId) {
  const { rows } = await query(
    `SELECT count(*) FILTER (WHERE result LIKE 'sent%')::int AS sent,
            count(*) FILTER (WHERE result LIKE 'failed%')::int AS failed,
            count(*) FILTER (WHERE bounced_at IS NOT NULL)::int AS bounced
     FROM newsletter_sends WHERE issue_id = $1 AND kind = 'list'`, [issueId])
  return rows[0]
}
