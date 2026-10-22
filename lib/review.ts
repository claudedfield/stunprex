/**
 * The review bar on staging (OT-063, the owner's yes of 22 Oct 2026).
 *
 * A text the owner should read on the test site carries in its front matter:
 *   review: pending
 *   reviewQuestion: "the one question for him"
 *   reviewDefault: "what happens if he writes nothing"
 * On staging such a page shows a bar with the question, the default and a text box; what he writes
 * is kept in review_notes. Production shows no bar and answers 404 on every review route.
 */
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export const reviewOpen = () => process.env.STAGING === '1'

export const DEFAULT_QUESTION = 'Anything to change before this goes live?'
export const DEFAULT_ANSWER = 'It goes live as it is.'

const CONTENT = path.join(process.cwd(), 'content')
/** Which file a page's path is built from. Only these four shapes carry a review bar. */
const SOURCES: [RegExp, (slug: string) => string][] = [
  [/^\/blog\/([a-z0-9-]+)$/, (s) => path.join(CONTENT, 'posts', `${s}.mdx`)],
  [/^\/review\/posts\/([a-z0-9-]+)$/, (s) => path.join(CONTENT, 'posts', `${s}.mdx`)],
  [/^\/training\/([a-z0-9-]+)$/, (s) => path.join(CONTENT, 'drills', `${s}.mdx`)],
  [/^\/capacities\/([a-z0-9-]+)$/, (s) => path.join(CONTENT, 'pages', 'capacities', `${s}.mdx`)],
]

export type ReviewAsk = { question: string; answer: string }

/** The review asked of a page, or null when the page asks none. Draft posts under /review/posts always ask. */
export function reviewFor(pagePath: string): ReviewAsk | null {
  for (const [re, file] of SOURCES) {
    const m = re.exec(pagePath)
    if (!m) continue
    const full = file(m[1])
    if (!fs.existsSync(full)) return null
    const { data } = matter(fs.readFileSync(full, 'utf8'))
    const draftView = pagePath.startsWith('/review/posts/')
    if (data.review !== 'pending' && !(draftView && data.status === 'draft')) return null
    return {
      question: typeof data.reviewQuestion === 'string' ? data.reviewQuestion : DEFAULT_QUESTION,
      answer: typeof data.reviewDefault === 'string' ? data.reviewDefault : DEFAULT_ANSWER,
    }
  }
  return null
}

export type PendingPage = { path: string; title: string; kind: string; question: string }

function scan(dir: string, toPath: (slug: string, data: Record<string, unknown>) => string | null, kind: string): PendingPage[] {
  const full = path.join(CONTENT, dir)
  if (!fs.existsSync(full)) return []
  return fs.readdirSync(full).filter((f) => f.endsWith('.mdx')).flatMap((f) => {
    const { data } = matter(fs.readFileSync(path.join(full, f), 'utf8'))
    const p = toPath(f.replace(/\.mdx$/, ''), data)
    if (!p) return []
    const ask = reviewFor(p)
    return ask ? [{ path: p, title: String(data.title ?? f), kind, question: ask.question }] : []
  })
}

/** Every page waiting for a read: published pages marked pending, and draft posts that have no page yet. */
export function pendingPages(): PendingPage[] {
  return [
    ...scan('posts', (s, d) => (d.status === 'draft' ? `/review/posts/${s}` : `/blog/${s}`), 'Article'),
    ...scan('drills', (s) => `/training/${s}`, 'Drill page'),
    ...scan(path.join('pages', 'capacities'), (s) => `/capacities/${s}`, 'Capacity page'),
  ]
}

/** The staging login that sent a request (the basic-auth user name), or ''. */
export function stagingLogin(headers: Headers): string {
  const auth = headers.get('authorization') ?? ''
  if (!auth.startsWith('Basic ')) return ''
  try {
    const user = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':')[0]
    return /^[a-z0-9_-]{1,40}$/i.test(user) ? user : ''
  } catch {
    return ''
  }
}
