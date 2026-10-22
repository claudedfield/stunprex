/**
 * /api/test/purchase-code: test-only helpers for the purchase code on staging. Same guard as the
 * other test routes: 404 everywhere but staging. Works only on the e2e test account.
 * Body: { action: 'reset' | 'issue' | 'mail' | 'redeem' | 'spend', intent?, code? }.
 */
import { NextResponse } from 'next/server'
import { sql } from '@/db'
import { testRoutesEnabled } from '@/lib/test-guard'
const E2E_TEST_EMAIL = 'e2e@stunprex.test'
import { issuePurchaseCode, redeemPurchaseCode, spendPurchaseCode, PurchaseCodeLimit } from '@/lib/checkout/purchase-code'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!testRoutesEnabled(req)) return new NextResponse('Not Found', { status: 404 })
  const body = (await req.json().catch(() => ({}))) as { action?: string; intent?: string; code?: string }
  const { rows } = await sql<{ id: string }>`SELECT id FROM users WHERE email = ${E2E_TEST_EMAIL}`
  const userId = rows[0]?.id
  if (!userId) return NextResponse.json({ error: 'sign the test account in first' }, { status: 400 })
  const intent = body.intent ?? 'start:parent_founding_month'
  switch (body.action) {
    case 'reset':
      await sql`DELETE FROM purchase_codes WHERE user_id = ${userId}`
      await sql`DELETE FROM newsletter_test_outbox WHERE to_address = ${E2E_TEST_EMAIL} AND subject = 'Your StunpreX purchase code'`
      return NextResponse.json({ ok: true })
    case 'issue':
      try {
        await issuePurchaseCode(userId, E2E_TEST_EMAIL, intent, 'a test purchase')
        return NextResponse.json({ ok: true })
      } catch (e) {
        if (e instanceof PurchaseCodeLimit) return NextResponse.json({ ok: false, limit: true })
        throw e
      }
    case 'mail': {
      const m = await sql<{ text_body: string }>`SELECT text_body FROM newsletter_test_outbox
        WHERE to_address = ${E2E_TEST_EMAIL} AND subject = 'Your StunpreX purchase code' ORDER BY created_at DESC LIMIT 1`
      return NextResponse.json({ text: m.rows[0]?.text_body ?? null })
    }
    case 'redeem':
      return NextResponse.json({ ok: await redeemPurchaseCode(userId, intent, body.code ?? '') })
    case 'spend':
      return NextResponse.json({ ok: await spendPurchaseCode(userId, intent) })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
