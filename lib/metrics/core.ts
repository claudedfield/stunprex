/**
 * D-WEB-31: our own visit counters. No outside tool, no cookie, nothing stored on the device.
 *
 * What is kept: daily totals (metrics_daily), and, to tell a returning visitor from a new one, a
 * list of one-way codes for the current month only (metrics_visitors; see migration 009). The IP
 * address is used once, in memory, to compute the code; it is never stored or logged.
 *
 * Everything a browser sends is treated as untrusted: paths are reduced to a known shape, event
 * names come from a fixed list, and the number of different keys a day is capped, so nobody can
 * fill the table with made-up addresses or write personal data into it.
 */
import { createHash, randomBytes } from 'node:crypto'
import { sql } from '@/db'

/** Measuring is on where METRICS_OPEN=1, and on staging for the tests. Off, nothing is sent or stored. */
export const metricsOpen = () => process.env.METRICS_OPEN === '1' || process.env.STAGING === '1'

/** The events the site counts. Anything else is dropped. */
export const EVENTS = [
  'drill_read_complete', 'drill_filter_used', 'game_completed',
  'community_question_started', 'signup_completed', 'newsletter_signup',
] as const
export type MetricEvent = (typeof EVENTS)[number]

const MAX_KEYS_PER_DAY = 3000
const OTHER = '(other)'

/**
 * A page's path as it is counted: no query string and no fragment (so no token, address or search
 * text), a member's profile as /community/u/[member] (the name is personal data), and nothing that
 * is not a plain site path.
 */
export function countedPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) return null
  let path = raw.split(/[?#]/)[0]
  if (path.length > 1) path = path.replace(/\/+$/, '')
  if (/^\/community\/u\/[^/]+/.test(path)) return path === '/community/u/me' ? path : '/community/u/[member]'
  if (path.length > 160 || !/^[A-Za-z0-9/_.\-\[\]]+$/.test(path)) return OTHER
  if (/^\/(api|_next)(\/|$)/.test(path)) return null
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

/** An event's key: its name, and a short detail made only of plain characters (a drill id, a filter). */
export function countedEvent(name: unknown, detail: unknown): string | null {
  if (typeof name !== 'string' || !(EVENTS as readonly string[]).includes(name)) return null
  if (typeof detail !== 'string' || detail === '') return name
  const d = detail.toLowerCase().slice(0, 60)
  return /^[a-z0-9+ ._:-]+$/.test(d) ? `${name}:${d}` : name
}

const BOT = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|curl|wget|python|node-fetch|axios|scrapy|facebookexternalhit|whatsapp/i
/** Not a person's browser, or a browser that asks not to be measured (Do Not Track, Global Privacy Control). */
export function notCounted(headers: Headers): boolean {
  const ua = headers.get('user-agent') ?? ''
  if (!ua || BOT.test(ua)) return true
  return headers.get('dnt') === '1' || headers.get('sec-gpc') === '1'
}

const today = () => new Date().toISOString().slice(0, 10)

/** Add one to a day's total. Past the day's cap of different keys, it is counted under "(other)". */
async function bump(kind: string, key: string): Promise<void> {
  const day = today()
  const hit = await sql`UPDATE metrics_daily SET n = n + 1 WHERE day = ${day} AND kind = ${kind} AND key = ${key}`
  if (hit.rowCount) return
  const { rows } = await sql<{ c: number }>`SELECT count(*)::int AS c FROM metrics_daily WHERE day = ${day} AND kind = ${kind}`
  const k = rows[0].c >= MAX_KEYS_PER_DAY ? OTHER : key
  await sql`INSERT INTO metrics_daily (day, kind, key, n) VALUES (${day}, ${kind}, ${k}, 1)
            ON CONFLICT (day, kind, key) DO UPDATE SET n = metrics_daily.n + 1`
}

/** The month's salt. The first request of a month makes it and deletes last month's salt and codes. */
async function monthSalt(month: string): Promise<string> {
  const found = await sql<{ salt: string }>`SELECT salt FROM metrics_salt WHERE month = ${month}`
  if (found.rows[0]) return found.rows[0].salt
  await sql`INSERT INTO metrics_salt (month, salt) VALUES (${month}, ${randomBytes(32).toString('hex')}) ON CONFLICT (month) DO NOTHING`
  await sql`DELETE FROM metrics_visitors WHERE month <> ${month}`
  await sql`DELETE FROM metrics_salt WHERE month <> ${month}`
  const { rows } = await sql<{ salt: string }>`SELECT salt FROM metrics_salt WHERE month = ${month}`
  return rows[0].salt
}

/** The visitor's code for this month. The IP address goes no further than this function. */
export async function visitorCode(ip: string, userAgent: string): Promise<{ code: string; month: string }> {
  const month = today().slice(0, 7)
  const salt = await monthSalt(month)
  return { code: createHash('sha256').update(`${salt}|${ip}|${userAgent}`).digest('hex'), month }
}

/**
 * Count a visitor once a day: "new" the first day its code is seen this month, "returning" on any
 * later day. The same visitor on the same day changes nothing.
 */
async function countVisitor(ip: string | null, userAgent: string): Promise<void> {
  if (!ip) return
  const { code, month } = await visitorCode(ip, userAgent)
  const day = today()
  const made = await sql`INSERT INTO metrics_visitors (code, month, first_day, last_day) VALUES (${code}, ${month}, ${day}, ${day})
                         ON CONFLICT (code) DO NOTHING`
  if (made.rowCount) return bump('visitor', 'new')
  const back = await sql`UPDATE metrics_visitors SET last_day = ${day} WHERE code = ${code} AND last_day < ${day}`
  if (back.rowCount) await bump('visitor', 'returning')
}

export async function recordPageview(path: string, referrer: string | null, ip: string | null, userAgent: string): Promise<void> {
  await bump('pageview', path)
  if (referrer) await bump('referrer', referrer)
  await countVisitor(ip, userAgent)
}

export async function recordEvent(key: string): Promise<void> {
  await bump('event', key)
}
