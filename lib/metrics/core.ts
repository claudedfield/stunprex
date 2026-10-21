/**
 * Our own visit counting, way C (the owner's choice of 21 Oct 2026 on OT-138; Legal's wording of
 * 14 Oct, D-LEGAL-16). No script runs in the visitor's browser for it, nothing is stored on the
 * device, and nothing about a visitor is kept: when the server sends a page, it adds one to that
 * page's total for the day and, by its name only, one to the referring site's.
 *
 * Every request is first sorted: a person's browser, a robot, or not counted at all. Robots are
 * counted on their own, by name where they give one, so the page totals are people only.
 */
import { sql } from '@/db'
import { redactError } from '@/lib/log-redact'

/** Counting is on where METRICS_OPEN=1, and on staging for the tests. */
export const metricsOpen = () => process.env.METRICS_OPEN === '1' || process.env.STAGING === '1'

const MAX_KEYS_PER_DAY = 3000
const OTHER = '(other)'

/**
 * A page's path as it is counted: no query string and no fragment (so no token, address or search
 * text), a member's profile as /community/u/[member] (the name is personal data), nothing that is
 * not a plain site path, and no file (a name with a dot in its last part: scanners asking for
 * /.env or /wp-login.php).
 */
export function countedPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) return null
  let path = raw.split(/[?#]/)[0]
  if (path.length > 1) path = path.replace(/\/+$/, '')
  if (/^\/community\/u\/[^/]+/.test(path)) return path === '/community/u/me' ? path : '/community/u/[member]'
  if (path.length > 160 || !/^[A-Za-z0-9/_.\-\[\]]+$/.test(path)) return OTHER
  if (/^\/(api|_next)(\/|$)/.test(path)) return null
  if (path.split('/').pop()!.includes('.')) return null
  return path.toLowerCase()
}

/** The other site's host name, without its path or query; our own host and junk are not counted. */
export function countedReferrer(raw: unknown, ownHost: string | null): string | null {
  if (typeof raw !== 'string' || raw === '') return null
  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, '')
    if (!host || host.length > 80 || !/^[a-z0-9.-]+$/.test(host)) return null
    if (ownHost && host === ownHost.toLowerCase().replace(/^www\./, '').split(':')[0]) return null
    return host
  } catch {
    return null
  }
}

/** Robots that say who they are, counted under one name each. The first match wins. */
const NAMED_ROBOTS: [RegExp, string][] = [
  [/googlebot|google-inspectiontool|googleother|adsbot-google|mediapartners-google|google-extended|storebot-google/i, 'google'],
  [/bingbot|bingpreview|msnbot|adidxbot/i, 'bing'],
  [/applebot/i, 'apple'],
  [/duckduckbot|duckassistbot/i, 'duckduckgo'],
  [/yandex/i, 'yandex'],
  [/baiduspider/i, 'baidu'],
  [/gptbot|chatgpt-user|oai-searchbot/i, 'openai'],
  [/claudebot|claude-user|claude-searchbot|anthropic-ai/i, 'anthropic'],
  [/perplexitybot|perplexity-user/i, 'perplexity'],
  [/ccbot|bytespider|amazonbot|meta-externalagent|cohere-ai|diffbot|imagesiftbot/i, 'ai-and-data-crawlers'],
  [/ahrefsbot|semrushbot|mj12bot|dotbot|dataforseobot|rogerbot|screaming frog|serpstatbot|blexbot|seznambot|petalbot/i, 'seo-tools'],
  [/facebookexternalhit|facebookcatalog|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|pinterest|redditbot|skypeuripreview|embedly/i, 'link-previews'],
  [/uptimerobot|pingdom|statuscake|site24x7|betteruptime|monitor/i, 'monitors'],
]
/** Anything else that names itself a robot or a tool, or is a headless browser. */
const GENERIC_ROBOT = /bot\b|bot\/|crawl|spider|slurp|scrap|fetch|preview|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|curl|wget|python|httpx|aiohttp|go-http|java\/|okhttp|node-fetch|undici|axios|libwww|perl|ruby|php\//i
/** Our own test suite and nightly tester: not counted at all, not even as robots. */
const OWN_TESTS = /stunprex-e2e|stunprex-agentops/i
/** What a browser that people use says about itself. */
const BROWSER_UA = /^Mozilla\/5\.0 .*(Chrome|CriOS|Firefox|FxiOS|Safari|Edg)\//

export type Sorted = { as: 'person'; navigation: boolean } | { as: 'robot'; name: string } | { as: 'none' }

/**
 * Sort one request for a page. Only GET requests for a page are looked at: a full page load, or
 * the site's own in-page navigation (Next.js asks for the next page with an `rsc: 1` header).
 * Prefetches (the browser fetching a linked page in case it is opened) are never counted.
 *
 * A person's browser is told from a robot by what the request carries, not by anything stored:
 * - robots that name themselves are counted under their name;
 * - a request that looks like a browser but lacks what every current browser sends with a page
 *   (the Sec-Fetch headers, which scripts cannot forge from inside a page, and a language list)
 *   is counted as an undeclared robot;
 * - what is left is counted as a person, unless the browser asks not to be measured (Do Not Track,
 *   Global Privacy Control), in which case nothing is counted.
 * A robot that copies every one of a browser's headers still counts as a person: the split is a
 * good measure, not a proof.
 */
export function sortRequest(method: string, headers: Headers): Sorted {
  if (method !== 'GET') return { as: 'none' }
  const purpose = `${headers.get('purpose') ?? ''} ${headers.get('sec-purpose') ?? ''} ${headers.get('x-purpose') ?? ''}`
  if (/prefetch|prerender/i.test(purpose) || headers.get('next-router-prefetch')) return { as: 'none' }
  const ua = headers.get('user-agent') ?? ''
  if (OWN_TESTS.test(ua)) return { as: 'none' }
  if (!ua) return { as: 'robot', name: 'no-user-agent' }
  for (const [re, name] of NAMED_ROBOTS) if (re.test(ua)) return { as: 'robot', name }
  if (GENERIC_ROBOT.test(ua)) return { as: 'robot', name: 'other-named' }
  if (!BROWSER_UA.test(ua)) return { as: 'robot', name: 'undeclared' }

  const rsc = headers.get('rsc') === '1'
  const mode = headers.get('sec-fetch-mode')
  const site = headers.get('sec-fetch-site')
  const looksLikeBrowser = rsc
    ? site === 'same-origin' && (mode === 'cors' || mode === 'same-origin')
    : mode === 'navigate' && headers.get('sec-fetch-dest') === 'document' && !!headers.get('accept-language') &&
      (headers.get('accept') ?? '').includes('text/html')
  if (!looksLikeBrowser) return { as: 'robot', name: 'undeclared' }

  if (headers.get('dnt') === '1' || headers.get('sec-gpc') === '1') return { as: 'none' }
  return { as: 'person', navigation: !rsc }
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Add one to a day's total, in one statement. Past the day's cap of different keys, it is counted
 * under "(other)"; the cap is checked from a count kept in memory, refreshed every minute.
 */
const keyCount = new Map<string, { n: number; at: number }>()
async function bump(kind: string, key: string): Promise<void> {
  const day = today()
  const slot = `${day}|${kind}`
  let known = keyCount.get(slot)
  if (!known || known.at < Date.now() - 60_000) {
    const { rows } = await sql<{ c: number }>`SELECT count(*)::int AS c FROM metrics_daily WHERE day = ${day} AND kind = ${kind}`
    known = { n: rows[0].c, at: Date.now() }
    if (keyCount.size > 50) keyCount.clear()
    keyCount.set(slot, known)
  }
  const k = known.n >= MAX_KEYS_PER_DAY ? OTHER : key
  await sql`INSERT INTO metrics_daily (day, kind, key, n) VALUES (${day}, ${kind}, ${k}, 1)
            ON CONFLICT (day, kind, key) DO UPDATE SET n = metrics_daily.n + 1`
}

/**
 * Count one page request. Kinds in metrics_daily: 'pageview' (people, by path), 'referrer' (people
 * arriving from another site, by host name), 'robot' (robot requests for pages, by robot name) and
 * 'robot_page' (robot requests by path, so we can see what the search engines read).
 */
export async function countRequest(sorted: Sorted, path: string, referrer: string | null): Promise<void> {
  if (sorted.as === 'person') {
    await bump('pageview', path)
    if (sorted.navigation && referrer) await bump('referrer', referrer)
  } else if (sorted.as === 'robot') {
    await bump('robot', sorted.name)
    if (['google', 'bing', 'apple', 'duckduckgo'].includes(sorted.name)) await bump('robot_page', `${sorted.name} ${path}`)
  }
}

// Counting never slows a page: the page is sent at once and the totals are written afterwards, at
// most four at a time. Under a burst the rest are dropped, since the totals are a measure and not a
// ledger.
let writing = 0
export function countLater(sorted: Sorted, path: string, referrer: string | null): void {
  if (sorted.as === 'none' || writing >= 4) return
  writing += 1
  void countRequest(sorted, path, referrer)
    .catch((err: unknown) => console.error('[metrics]', redactError(err)))
    .finally(() => { writing -= 1 })
}
