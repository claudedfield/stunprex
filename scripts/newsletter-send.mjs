#!/usr/bin/env node
/**
 * D-NEWS-01 requirement 5: the send job. Runs on the VPS inside the site's build image, started by
 * /usr/local/sbin/stunprex-newsletter-send (which supplies the production environment):
 *
 *   node scripts/newsletter-send.mjs preview <issue number>   to NEWSLETTER_PREVIEW_TO (comma list)
 *   node scripts/newsletter-send.mjs list <issue number>      to every confirmed subscriber not yet sent it
 *   node scripts/newsletter-send.mjs counts <issue number>    sent, failed, bounced
 *   node scripts/newsletter-send.mjs cleanup                  LEGAL-02.6: unconfirmed sign-ups past their
 *                                                             link, and bounces older than 90 days
 *
 * An issue is sent only if its file is in content/newsletter/ with an Evaluator PASS beside it. The
 * list send stays within the rolling 24-hour budget (core.mjs) and resumes where it stopped when run
 * again. The first three issues go to the list only on the COO's word in Comms/Dev_to_COO.md, so this
 * job is run by hand for those; nothing here schedules itself.
 */
import pg from 'pg'
import { listIssues } from '../lib/newsletter/issues.mjs'
import { sendPreview, sendList, ensureIssueRow, issueCounts } from '../lib/newsletter/send.mjs'
import { cleanup } from '../lib/newsletter/cleanup.mjs'
import { cleanupUnfinishedAccounts, countUnfinishedDue } from '../lib/accounts/cleanup.mjs'

if (process.argv[2] === 'cleanup') {
  const pool = new pg.Pool({ connectionString: process.env.POSTGRES_URL, max: 1 })
  try {
    const r = await cleanup((text, values) => pool.query(text, values))
    console.log(`${new Date().toISOString()} newsletter cleanup: ${r.pending_deleted} unconfirmed sign-up(s) and ${r.bounced_deleted} old bounce(s) deleted`)
    // LEGAL-03.14: the same daily run deletes unfinished account sign-ups 30 days after their last sign-in.
    // It deletes only where ACCOUNT_CLEANUP_OPEN=1. Until the owner's blank start (his word, 6 Oct:
    // the nine old accounts go when the new sign-in is ready) production only counts what is due.
    if (process.env.ACCOUNT_CLEANUP_OPEN === '1') {
      const a = await cleanupUnfinishedAccounts((text, values) => pool.query(text, values))
      console.log(`${new Date().toISOString()} account cleanup: ${a.unfinished_deleted} unfinished sign-up(s) deleted`)
    } else {
      const due = await countUnfinishedDue((text, values) => pool.query(text, values))
      console.log(`${new Date().toISOString()} account cleanup is off (ACCOUNT_CLEANUP_OPEN is not 1): ${due} unfinished sign-up(s) due, none deleted`)
    }
  } catch (err) {
    console.log(`${new Date().toISOString()} newsletter cleanup FAILED: ${String(err?.message ?? err).replace(/[^\s@<>]+@[^\s@<>]+/g, '<email>')}`); process.exitCode = 1
  } finally { await pool.end() }
  process.exit()
}

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
