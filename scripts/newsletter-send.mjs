#!/usr/bin/env node
/**
 * D-NEWS-01 requirement 5: the send job. Runs on the VPS inside the site's build image, started by
 * /usr/local/sbin/stunprex-newsletter-send (which supplies the production environment):
 *
 *   node scripts/newsletter-send.mjs preview <issue number>   to NEWSLETTER_PREVIEW_TO (comma list)
 *   node scripts/newsletter-send.mjs list <issue number>      to every confirmed subscriber not yet sent it
 *   node scripts/newsletter-send.mjs counts <issue number>    sent, failed, bounced
 *
 * An issue is sent only if its file is in content/newsletter/ with an Evaluator PASS beside it. The
 * list send stays within the rolling 24-hour budget (core.mjs) and resumes where it stopped when run
 * again. The first three issues go to the list only on the COO's word in Comms/Dev_to_COO.md, so this
 * job is run by hand for those; nothing here schedules itself.
 */
import pg from 'pg'
import { listIssues } from '../lib/newsletter/issues.mjs'
import { sendPreview, sendList, ensureIssueRow, issueCounts } from '../lib/newsletter/send.mjs'

const [mode, numArg] = process.argv.slice(2)
const number = Number(numArg)
if (!['preview', 'list', 'counts'].includes(mode) || !Number.isInteger(number)) {
  console.error('usage: newsletter-send.mjs <preview|list|counts> <issue number>'); process.exit(2)
}
const issue = listIssues().find((i) => i.meta.number === number)
if (!issue) { console.error(`no issue #${number} in content/newsletter/`); process.exit(1) }
if (!issue.evaluatorPass) { console.error(`issue #${number} has no Evaluator PASS beside it; not sent`); process.exit(1) }

const pool = new pg.Pool({ connectionString: process.env.POSTGRES_URL, max: 2 })
const query = (text, values) => pool.query(text, values)
const say = (s) => console.log(`${new Date().toISOString()} newsletter #${number} ${mode}: ${s}`)
try {
  if (mode === 'preview') {
    const to = (process.env.NEWSLETTER_PREVIEW_TO || '').split(',').map((s) => s.trim()).filter(Boolean)
    if (!to.length) throw new Error('NEWSLETTER_PREVIEW_TO is empty')
    const results = await sendPreview(query, issue, to)
    say(results.map((r, i) => `${to[i].replace(/^(.).*@/, '$1...@')} ${r}`).join('; '))
  } else if (mode === 'list') {
    const r = await sendList(query, issue, say)
    say(`due ${r.due}, sent ${r.sent}, failed ${r.failed}, left ${r.left}${r.left ? ' (run again after the budget allows)' : ''}`)
  } else {
    say(JSON.stringify(await issueCounts(query, await ensureIssueRow(query, issue.meta))))
  }
} catch (err) {
  say(`FAILED: ${String(err?.message ?? err).replace(/[^\s@<>]+@[^\s@<>]+/g, '<email>')}`); process.exitCode = 1
} finally {
  await pool.end()
}
