/**
 * D-NEWS-01: newsletter issues are files, content/newsletter/issue-NN-<slug>.md, with front matter
 * (number, subject, title for the web, preview, slug, send_date, byline) and a Markdown body. The Evaluator's verdict
 * sits beside each as issue-NN-<slug>__evaluator.md. Plain JavaScript: the send job reads them too.
 */
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export const ISSUES_DIR = path.join(process.cwd(), 'content', 'newsletter')
const FILE = /^issue-(\d{2,})-([a-z0-9-]+)\.md$/

export function listIssues() {
  if (!fs.existsSync(ISSUES_DIR)) return []
  return fs.readdirSync(ISSUES_DIR)
    .filter((f) => FILE.test(f))
    .map((f) => readIssueFile(path.join(ISSUES_DIR, f)))
    .sort((a, b) => b.meta.number - a.meta.number)
}

export function readIssueFile(file) {
  const { data, content } = matter(fs.readFileSync(file, 'utf8'))
  const [, num, slug] = path.basename(file).match(FILE) ?? []
  const meta = {
    number: Number(data.number ?? num), subject: String(data.subject ?? ''), preview: String(data.preview ?? ''),
    title: String(data.title ?? data.subject ?? ''),
    slug: String(data.slug ?? slug), send_date: data.send_date ? String(data.send_date instanceof Date
      ? data.send_date.toISOString().slice(0, 10) : data.send_date) : '', byline: String(data.byline ?? 'StunpreX'),
  }
  const evaluator = file.replace(/\.md$/, '__evaluator.md')
  return { file, meta, body: content.trim(), evaluatorPass: fs.existsSync(evaluator)
    && /\bverdict\b[^\n]*\bPASS\b/i.test(fs.readFileSync(evaluator, 'utf8')) }
}

export const findIssue = (slug) => listIssues().find((i) => i.meta.slug === slug) ?? null
