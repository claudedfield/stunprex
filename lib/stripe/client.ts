/**
 * Our own small Stripe client: Stripe's REST API over fetch, no SDK (the owner prefers our own code
 * where it is small). Only what the checkout needs. The key is read from STRIPE_SECRET_KEY at call
 * time and is never logged; an error message carries Stripe's message, never the request.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

export type Params = Record<string, unknown>

/** Stripe's form encoding: nested objects as a[b][c]=v, arrays as a[0]=v. Undefined is left out. */
export function formEncode(params: Params, prefix = ''): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (v !== null && typeof v === 'object') {
      const entries = Array.isArray(v) ? Object.fromEntries(v.map((x, i) => [String(i), x])) : (v as Params)
      out.push(...formEncode(entries, key))
    } else {
      out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v === null ? '' : String(v))}`)
    }
  }
  return out
}

export class StripeError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message) }
}

export async function stripe<T = Record<string, unknown>>(method: 'GET' | 'POST' | 'DELETE', path: string, params: Params = {}): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new StripeError(0, 'STRIPE_SECRET_KEY is not set')
  const body = formEncode(params).join('&')
  const url = `https://api.stripe.com${path}${method === 'GET' && body ? `?${body}` : ''}`
  const res = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : body,
  })
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: string } }
  if (!res.ok) throw new StripeError(res.status, json.error?.message ?? `Stripe answered ${res.status}`, json.error?.code)
  return json as T
}

/**
 * Check a webhook's Stripe-Signature header (t=...,v1=...) against the raw body and our endpoint's
 * secret, with a 5-minute tolerance. True only for an exact match.
 */
export function verifyWebhook(rawBody: string, header: string | null, secret: string, now = Date.now(), toleranceSec = 300): boolean {
  if (!header || !secret) return false
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]).filter((p) => p.length === 2))
  const t = Number(parts.t)
  if (!Number.isFinite(t) || Math.abs(now / 1000 - t) > toleranceSec) return false
  const want = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex')
  const given = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3))
  return given.some((g) => g.length === want.length && timingSafeEqual(Buffer.from(g), Buffer.from(want)))
}

/** A test key or a live key: the scripts refuse live mode unless told. */
export const keyMode = (key = process.env.STRIPE_SECRET_KEY ?? '') =>
  /^(rk|sk)_test_/.test(key) ? 'test' : /^(rk|sk)_live_/.test(key) ? 'live' : 'none'
