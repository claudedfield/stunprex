import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { formEncode, verifyWebhook, keyMode } from '../lib/stripe/client';
import { INTENT } from '../lib/checkout/purchase-code';

/** The checkout's foundation (22 Oct 2026): our Stripe client, the webhook check and the purchase code. */
const secret = process.env.E2E_SIGNIN_SECRET ?? '';

test('Stripe form encoding nests objects and arrays the way Stripe reads them', () => {
  expect(formEncode({ a: 1, b: { c: 'x y', d: { e: true } }, l: ['p', 'q'], u: undefined }).join('&'))
    .toBe('a=1&b%5Bc%5D=x%20y&b%5Bd%5D%5Be%5D=true&l%5B0%5D=p&l%5B1%5D=q');
});

test('a webhook is accepted only with the right signature, inside five minutes', () => {
  const body = '{"id":"evt_1"}';
  const t = 1_800_000_000;
  const sig = createHmac('sha256', 'whsec_test').update(`${t}.${body}`).digest('hex');
  const header = `t=${t},v1=${sig}`;
  expect(verifyWebhook(body, header, 'whsec_test', t * 1000)).toBe(true);
  expect(verifyWebhook(body, header, 'whsec_other', t * 1000), 'wrong secret').toBe(false);
  expect(verifyWebhook(body + ' ', header, 'whsec_test', t * 1000), 'changed body').toBe(false);
  expect(verifyWebhook(body, header, 'whsec_test', (t + 301) * 1000), 'too late').toBe(false);
  expect(verifyWebhook(body, null, 'whsec_test', t * 1000)).toBe(false);
});

test('a live key is told apart from a test key', () => {
  expect(keyMode('rk_test_abc')).toBe('test');
  expect(keyMode('rk_live_abc')).toBe('live');
  expect(keyMode('')).toBe('none');
});

test('a purchase code names what it is for', () => {
  expect(INTENT.test('start:parent_founding_month')).toBe(true);
  expect(INTENT.test('change:coach_founding_year')).toBe(true);
  expect(INTENT.test('renew:parent_founding_month'), 'never at renewal').toBe(false);
});

test.describe('the purchase code on staging', () => {
  test.skip(!secret, 'staging only');
  test.describe.configure({ mode: 'serial' });
  const h = (page: import('@playwright/test').Page, data: Record<string, string>) =>
    page.request.post('/api/test/purchase-code', { headers: { 'x-e2e-secret': secret }, data }).then((r) => r.json());

  test('mailed to the account, works once, five wrong tries end it, and the purchase step spends it once', async ({ page }) => {
    await page.request.post('/api/test/sign-in', { headers: { 'x-e2e-secret': secret }, data: { terms: 'current' } });
    await h(page, { action: 'reset' });
    expect((await h(page, { action: 'spend' })).ok, 'no purchase step without a code').toBe(false);
    expect((await h(page, { action: 'issue' })).ok).toBe(true);
    const text: string = (await h(page, { action: 'mail' })).text;
    expect(text).toContain('nothing is bought or changed without the code');
    const code = text.match(/(\d{3}) (\d{3})/)!.slice(1).join('');
    const wrong = code === '000000' ? '000001' : '000000';
    expect((await h(page, { action: 'redeem', code: wrong })).ok).toBe(false);
    expect((await h(page, { action: 'redeem', code, intent: 'change:parent_founding_month' })).ok, 'another intent').toBe(false);
    expect((await h(page, { action: 'redeem', code })).ok).toBe(true);
    expect((await h(page, { action: 'redeem', code })).ok, 'once').toBe(false);
    expect((await h(page, { action: 'spend' })).ok).toBe(true);
    expect((await h(page, { action: 'spend' })).ok, 'spent once').toBe(false);

    await h(page, { action: 'reset' });
    await h(page, { action: 'issue' });
    for (let i = 0; i < 5; i++) await h(page, { action: 'redeem', code: String(100000 + i) });
    const c2 = (await h(page, { action: 'mail' })).text.match(/(\d{3}) (\d{3})/)!.slice(1).join('');
    expect((await h(page, { action: 'redeem', code: c2 })).ok, 'ended after five wrong tries').toBe(false);
    await h(page, { action: 'reset' });
  });
});
