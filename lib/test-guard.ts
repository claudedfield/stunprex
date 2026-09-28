/**
 * D-WEB-27 decision T: the test-only routes exist only where STAGING=1 and a 32+ character
 * E2E_SIGNIN_SECRET are set on the server and the request carries that secret. Staging's
 * environment has both; production has neither, so the routes answer 404 there.
 */
import { timingSafeEqual } from 'node:crypto'

export function testRoutesEnabled(req: Request): boolean {
  const secret = process.env.E2E_SIGNIN_SECRET ?? ''
  if (process.env.STAGING !== '1' || secret.length < 32) return false
  const given = Buffer.from(req.headers.get('x-e2e-secret') ?? '')
  const want = Buffer.from(secret)
  return given.length === want.length && timingSafeEqual(given, want)
}
