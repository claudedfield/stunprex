#!/usr/bin/env node
/**
 * Copy the review bar's notes from the test site into Q1_Status/review_notes.md (OT-063), newest
 * first, for the COO and the Assistant. Reads the staging login and the test secret from .env.local;
 * prints only counts. Run from the site folder: node scripts/review_notes.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const here = path.dirname(new URL(import.meta.url).pathname)
const env = Object.fromEntries(
  fs.readFileSync(path.join(here, '..', '.env.local'), 'utf8').split('\n')
    .filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] }),
)
const res = await fetch('https://staging.stunprex.com/api/review/notes', {
  headers: { authorization: `Basic ${Buffer.from(env.E2E_STAGING_AUTH ?? '').toString('base64')}`, 'x-e2e-secret': env.E2E_SIGNIN_SECRET ?? '' },
})
if (!res.ok) { console.error(`review notes: the test site answered ${res.status}`); process.exit(1) }
const { notes } = await res.json()
const real = notes.filter((n) => n.path !== '/review/posts/review-bar-fixture')
const out = path.join(here, '..', '..', 'Q1_Status', 'review_notes.md')
const body = [
  '# Review notes from the test site',
  '',
  `Written by \`stunprexcom/scripts/review_notes.mjs\` from the review bar on staging (OT-063); newest first. Do not edit by hand: the next run replaces this file. Last run: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC.`,
  '',
  ...(real.length === 0 ? ['No notes yet.'] : real.map((n) => `## ${n.created_at} · ${n.path}${n.by_login ? ` · ${n.by_login}` : ''}\n\n${n.text.replace(/\u2014/g, '-')}\n`)),
  '',
].join('\n')
fs.writeFileSync(out, body)
console.log(`review notes: ${real.length} note(s) written to Q1_Status/review_notes.md`)
