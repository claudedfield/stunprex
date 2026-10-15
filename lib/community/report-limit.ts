/**
 * LEGAL-03.2: five reports an hour per connection, counted in this process's memory. The IP
 * address is written nowhere. (Kept out of report-actions.ts: every export of a 'use server' file
 * is callable from a browser, and the reset below must not be.)
 */
const REPORTS_PER_HOUR = 5
const g = globalThis as typeof globalThis & { __reportHits?: Map<string, number[]> }
const hits = (g.__reportHits ??= new Map<string, number[]>())

export function reportOverLimit(ip: string | null): boolean {
  if (!ip) return false
  const recent = (hits.get(ip) ?? []).filter((t) => t > Date.now() - 60 * 60 * 1000)
  if (recent.length >= REPORTS_PER_HOUR) return true
  hits.set(ip, [...recent, Date.now()])
  if (hits.size > 5000) hits.clear()
  return false
}

export function resetReportLimits() { hits.clear() }
