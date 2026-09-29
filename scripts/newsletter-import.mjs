#!/usr/bin/env node
/**
 * D-NEWS-01: bring an issue from its file of record into the site.
 *
 *   node scripts/newsletter-import.mjs ../Newsletter/issue-03-first-touch.md --send-date 2026-09-24
 *
 * The Writer's file of record (Newsletter/issue-NN-<slug>.md, D-FILES-01) carries a header block
 * (status, canon trace) and then, between two "---" lines, the subject, web title and preview; the
 * body follows the second "---" and ends at the "StunpreX" sign-off (beehiiv's footer and any notes
 * after it are not part of the issue: our template adds its own byline and footer). This writes
 * content/newsletter/issue-NN-<slug>.md with front matter and copies the __evaluator.md beside it,
 * so the content lint can check both. Nothing in the text is changed.
 */
import fs from 'node:fs'
import path from 'node:path'

const [src] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const dateAt = process.argv.indexOf('--send-date')
const sendDate = dateAt > -1 ? process.argv[dateAt + 1] : ''
if (!src || !/^\d{4}-\d{2}-\d{2}$/.test(sendDate)) {
  console.error('usage: newsletter-import.mjs <Newsletter/issue-NN-slug.md> --send-date YYYY-MM-DD'); process.exit(2)
}
const name = path.basename(src)
const m = name.match(/^issue-(\d{2,})-([a-z0-9-]+)\.md$/)
if (!m) { console.error(`not an issue file name: ${name}`); process.exit(2) }
const [, num, slug] = m
const lines = fs.readFileSync(src, 'utf8').split('\n')
const field = (re) => { const l = lines.find((x) => re.test(x)); return l ? l.replace(re, '').trim() : '' }
const subject = field(/^\*\*(?:Email subject[^:]*|Subject \(email\)):\*\*\s*/)
const title = field(/^\*\*Web title:\*\*\s*/) || subject
const preview = field(/^\*\*Preview text[^:]*:\*\*\s*/)
const rules = lines.map((l, i) => (l.trim() === '---' ? i : -1)).filter((i) => i > -1)
if (!subject || !preview || rules.length < 2) { console.error('subject, preview or the two --- lines not found'); process.exit(1) }
let body = lines.slice(rules[1] + 1)
const end = body.findIndex((l) => l.trim() === 'StunpreX' || l.startsWith('*You are receiving this'))
if (end > -1) body = body.slice(0, end)
const text = body.join('\n').trim()
const q = (s) => JSON.stringify(s)
const out = `---
number: ${Number(num)}
subject: ${q(subject)}
title: ${q(title)}
preview: ${q(preview)}
slug: ${q(slug)}
send_date: ${q(sendDate)}
byline: "StunpreX"
source: ${q('Newsletter/' + name)}
---

${text}
`
const dir = path.join(path.resolve(import.meta.dirname, '..'), 'content', 'newsletter')
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, name), out)
const ev = src.replace(/\.md$/, '__evaluator.md')
if (fs.existsSync(ev)) fs.copyFileSync(ev, path.join(dir, path.basename(ev)))
console.log(`${name}: ${text.split(/\s+/).length} words; subject ${subject.length} chars; evaluator ${fs.existsSync(ev) ? 'copied' : 'MISSING'}`)
