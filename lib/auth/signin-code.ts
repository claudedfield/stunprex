/**
 * D-AUTH-02: sign-in by a six-digit code, or by a link that needs one press.
 *
 * Why: a sign-in link that works on a plain GET is opened by mail scanners, which made accounts
 * nobody asked for (six of the first nine). Auth.js's own link is therefore never mailed. Its
 * callback address is stored encrypted, and released only by one of two POST steps:
 *   - the six-digit code, typed where the sign-in was started (five wrong tries end it);
 *   - the mailed link, which opens a page with one button.
 * A newer request ends the older one for the same address.
 *
 * Limits, checked before any mail is sent (the signin@ mailbox may send 100 a day):
 *   - per address: 3 in 15 minutes, 10 in 24 hours;
 *   - per IP address: 5 an hour, counted in memory only and never written anywhere;
 *   - all addresses together: 30 an hour, 90 in 24 hours.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { sql } from '@/db'
import { MAGIC_LINK_MAX_AGE_SECONDS } from '@/lib/auth-constants'

export const LIMITS = {
  perEmail15Min: 3, perEmail24h: 10, perIpHour: 5, allHour: 30, all24h: 90, wrongCodes: 5,
} as const

export type LimitReason = 'address' | 'ip' | 'all'
export const LIMIT_MESSAGE: Record<LimitReason, string> = {
  address: 'We have already sent sign-in mail to this address several times. Please use the newest one, or try again in 15 minutes.',
  ip: 'Too many sign-in requests from this connection. Please try again in an hour.',
  all: 'We cannot send more sign-in mail right now. Please try again in an hour.',
}
export class SignInLimitError extends Error {
  constructor(public reason: LimitReason) { super(`sign-in limit: ${reason}`) }
}

const secret = () => process.env.AUTH_SECRET ?? ''
const hash = (purpose: string, value: string) =>
  createHash('sha256').update(`${purpose}:${secret()}:${value}`).digest('hex')
const key = () => createHash('sha256').update(`signin-callback:${secret()}`).digest()

function encrypt(text: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const body = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url')
}
function decrypt(data: string): string {
  const raw = Buffer.from(data, 'base64url')
  const decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12))
  decipher.setAuthTag(raw.subarray(12, 28))
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8')
}

const norm = (email: string) => email.trim().toLowerCase()

// Per-IP counting lives in this process's memory: nothing about an IP address is stored.
// It hangs on globalThis so that every route's bundle counts in the one map.
const g = globalThis as typeof globalThis & { __signinIpHits?: Map<string, number[]> }
const ipHits = (g.__signinIpHits ??= new Map<string, number[]>())
const HOUR = 60 * 60 * 1000
function ipCount(ip: string): number {
  const recent = (ipHits.get(ip) ?? []).filter((t) => t > Date.now() - HOUR)
  if (recent.length) ipHits.set(ip, recent); else ipHits.delete(ip)
  return recent.length
}
export function resetIpLimits() { ipHits.clear() }

/** The caller's address as Caddy reports it (the last entry is the one Caddy itself saw). */
export function clientIp(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for')
  return xff ? xff.split(',').pop()!.trim() || null : null
}

/** Which limit, if any, refuses a sign-in mail to this address from this IP now. Records nothing. */
export async function limitReason(email: string, ip: string | null): Promise<LimitReason | null> {
  if (ip && ipCount(ip) >= LIMITS.perIpHour) return 'ip'
  const { rows } = await sql<{ e15: number; e24: number; a1: number; a24: number }>`
    SELECT count(*) FILTER (WHERE email = ${norm(email)} AND created_at > now() - interval '15 minutes')::int AS e15,
           count(*) FILTER (WHERE email = ${norm(email)})::int AS e24,
           count(*) FILTER (WHERE created_at > now() - interval '1 hour')::int AS a1,
           count(*)::int AS a24
    FROM signin_codes WHERE created_at > now() - interval '24 hours'`
  const c = rows[0]
  if (c.e15 >= LIMITS.perEmail15Min || c.e24 >= LIMITS.perEmail24h) return 'address'
  if (c.a1 >= LIMITS.allHour || c.a24 >= LIMITS.all24h) return 'all'
  return null
}

/**
 * Make the code and the link token for one sign-in mail and store Auth.js's callback address.
 * Throws SignInLimitError when a limit refuses it; nothing is stored or sent then.
 */
export async function issueSignIn(email: string, callbackUrl: string, ip: string | null): Promise<{ code: string; linkToken: string }> {
  const reason = await limitReason(email, ip)
  if (reason) throw new SignInLimitError(reason)
  if (ip) ipHits.set(ip, [...(ipHits.get(ip) ?? []), Date.now()])

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const linkToken = randomBytes(32).toString('base64url')
  const address = norm(email)
  await sql`DELETE FROM signin_codes WHERE created_at < now() - interval '24 hours'`
  await sql`UPDATE signin_codes SET used_at = now() WHERE email = ${address} AND used_at IS NULL`
  await sql`
    INSERT INTO signin_codes (email, code_hash, link_hash, callback_enc, expires_at)
    VALUES (${address}, ${hash('code', `${address}:${code}`)}, ${hash('link', linkToken)}, ${encrypt(callbackUrl)},
            now() + make_interval(secs => ${MAGIC_LINK_MAX_AGE_SECONDS}))`
  return { code, linkToken }
}

/** The callback address for a correct code, once. A wrong code counts; five end the request. */
export async function redeemCode(email: string, code: string): Promise<string | null> {
  const address = norm(email)
  const { rows } = await sql<{ id: string; code_hash: string; callback_enc: string }>`
    SELECT id, code_hash, callback_enc FROM signin_codes
    WHERE email = ${address} AND used_at IS NULL AND expires_at > now() AND attempts < ${LIMITS.wrongCodes}
    ORDER BY created_at DESC LIMIT 1`
  if (!rows[0]) return null
  const given = Buffer.from(hash('code', `${address}:${code.trim()}`))
  const want = Buffer.from(rows[0].code_hash)
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    await sql`UPDATE signin_codes SET attempts = attempts + 1 WHERE id = ${rows[0].id}`
    return null
  }
  const used = await sql`UPDATE signin_codes SET used_at = now() WHERE id = ${rows[0].id} AND used_at IS NULL`
  return used.rowCount === 1 ? decrypt(rows[0].callback_enc) : null
}

/** The callback address for the mailed link's token, once. */
export async function redeemLink(linkToken: string): Promise<string | null> {
  const { rows } = await sql<{ callback_enc: string }>`
    UPDATE signin_codes SET used_at = now()
    WHERE link_hash = ${hash('link', linkToken)} AND used_at IS NULL AND expires_at > now() AND attempts < ${LIMITS.wrongCodes}
    RETURNING callback_enc`
  return rows[0] ? decrypt(rows[0].callback_enc) : null
}
