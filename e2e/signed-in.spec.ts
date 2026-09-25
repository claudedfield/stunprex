import { test, expect } from '@playwright/test';

/**
 * D-WEB-27, decision T: signed-in paths, on staging only.
 *
 * The test sign-in route exists only on staging (STAGING=1 plus a secret in the
 * server's environment). CI passes the same secret as E2E_SIGNIN_SECRET when it
 * targets staging; without it the signed-in tests skip, so production is never
 * signed into by a test. The route-absent check runs everywhere.
 */
const secret = process.env.E2E_SIGNIN_SECRET ?? '';

test('the test sign-in route does not answer without its secret', async ({ request }) => {
  const res = await request.post('/api/test/sign-in', { maxRedirects: 0 });
  expect(res.status()).toBe(404);
});

test.describe('signed in as the test account', () => {
  test.skip(!secret, 'signed-in tests run on staging only');

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/test/sign-in', { headers: { 'x-e2e-secret': secret } });
    expect(res.status()).toBe(200);
  });

  test('the session belongs to the test account', async ({ page }) => {
    const res = await page.request.get('/api/auth/session');
    const body = await res.json();
    expect(body?.user?.email).toBe('e2e@stunprex.test');
  });

  test('a member reaches the ask form instead of the sign-in page', async ({ page }) => {
    await page.goto('/community/ask');
    expect(new URL(page.url()).pathname).toBe('/community/ask');
  });
});
