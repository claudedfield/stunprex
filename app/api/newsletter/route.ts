/**
 * /api/newsletter — RETIRED (D-WEB-13, 2 Sep 2026).
 *
 * Newsletter capture now goes to beehiiv, so this route must not accept writes:
 * anything landing in Postgres here would be a subscriber beehiiv does not know
 * about, with no confirmation email and no unsubscribe path. It returns 410 Gone.
 *
 * The `newsletter_subscribers` table is deliberately NOT dropped. Its rows are the
 * record of everyone who opted in while this route was live, and the consent-basis
 * decision (whether any of them may be imported into beehiiv) is the COO's, not a
 * Dev call. Nothing here deletes data.
 *
 * Every row in that table is an explicit newsletter opt-in by construction: this
 * route was its only writer, and authentication emails live in the separate
 * Auth.js `users` table. Export query for whoever runs it:
 *
 *   SELECT source, count(*), min(created_at), max(created_at)
 *   FROM newsletter_subscribers GROUP BY source ORDER BY count(*) DESC;
 *
 * Replace this route with a real beehiiv API integration once beehiiv issues an
 * API key (currently gated behind an identity check the owner has not completed).
 */
import { NextResponse } from 'next/server'

const GONE = {
  ok: false,
  error: 'gone',
  detail: 'Newsletter signup moved to beehiiv. This endpoint no longer accepts submissions.',
} as const

export async function POST() {
  return NextResponse.json(GONE, { status: 410 })
}

export async function GET() {
  return NextResponse.json(GONE, { status: 410 })
}
