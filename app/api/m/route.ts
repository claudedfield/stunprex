/**
 * POST /api/m: the site's own counter (D-WEB-31). The page sends one small message per page view
 * and per counted event; this route adds to the day's totals. It answers 204 whatever happens, sets
 * no cookie, and stores nothing when measuring is off, when the caller is not a person's browser,
 * or when the browser asks not to be measured.
 */
import { clientIp } from '@/lib/auth/signin-code'
import { redactError } from '@/lib/log-redact'
import { metricsOpen, notCounted, countedPath, countedReferrer, countedEvent, recordPageview, recordEvent } from '@/lib/metrics/core'

export const dynamic = 'force-dynamic'

const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })

// A plain flood guard, in memory only: one connection may send 120 messages a minute.
const g = globalThis as typeof globalThis & { __metricHits?: Map<string, number[]> }
const hits = (g.__metricHits ??= new Map<string, number[]>())
function flooded(ip: string | null): boolean {
  if (!ip) return false
  const recent = (hits.get(ip) ?? []).filter((t) => t > Date.now() - 60_000)
  recent.push(Date.now())
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > 120
}

// Counting never slows a page: the answer goes out at once and the totals are written afterwards,
// at most four messages at a time. Under a burst the rest are dropped, since the totals are a
// measure and not a ledger.
let writing = 0
function later(work: () => Promise<void>) {
  if (writing >= 4) return
  writing += 1
  void work().catch((err) => console.error('[metrics]', redactError(err))).finally(() => { writing -= 1 })
}

export async function POST(req: Request) {
  if (!metricsOpen() || notCounted(req.headers)) return done()
  const ip = clientIp(req.headers)
  if (flooded(ip)) return done()
  try {
    const text = await req.text()
    if (text.length > 1000) return done()
    const body = JSON.parse(text) as { t?: string; p?: unknown; r?: unknown; e?: unknown; d?: unknown }
    if (body.t === 'pageview') {
      const path = countedPath(body.p)
      const referrer = countedReferrer(body.r, req.headers.get('host'))
      const userAgent = req.headers.get('user-agent') ?? ''
      if (path) later(() => recordPageview(path, referrer, ip, userAgent))
    } else if (body.t === 'event') {
      const key = countedEvent(body.e, body.d)
      if (key) later(() => recordEvent(key))
    }
  } catch {
    // A message that cannot be read is not counted.
  }
  return done()
}
