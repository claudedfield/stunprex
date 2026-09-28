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

/**
 * LEGAL-01a, 01b: the terms step. These tests set the shared test account's terms state, so they
 * run one after another. The "cannot post" checks submit the ask form and expect the terms step
 * instead; the write is refused before anything is stored.
 */
test.describe('the terms step (LEGAL-01a, 01b)', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!secret, 'signed-in tests run on staging only');

  const signIn = async (page: import('@playwright/test').Page, terms?: 'none' | 'stale' | 'current') => {
    const res = await page.request.post('/api/test/sign-in', {
      headers: { 'x-e2e-secret': secret }, data: terms ? { terms } : {} });
    expect(res.status()).toBe(200);
    return res.json();
  };

  const tryToPost = async (page: import('@playwright/test').Page) => {
    // The form is what matters, not every late resource: one run waited 30 s for a load event.
    await page.goto('/community/ask', { waitUntil: 'domcontentloaded' });
    await page.locator('#title').fill('Terms gate check from the e2e suite, never posted');
    await page.locator('#category').selectOption({ index: 1 });
    await page.locator('#body').fill('This checks that the terms step blocks a post.');
    await page.getByRole('button', { name: /Preview question/ }).click();
    await page.getByRole('button', { name: /Post question/ }).click();
    await page.waitForURL('**/community/welcome', { timeout: 15_000 });
  };

  test('a member who never accepted the terms cannot post until both boxes are ticked', async ({ page }) => {
    await signIn(page, 'none');
    await tryToPost(page);
    const finish = page.getByRole('button', { name: /Go to the community/ });
    await expect(finish).toBeDisabled();
    await page.locator('#accept_terms').check();
    await expect(finish, 'the age box is separate and also required').toBeDisabled();
    await page.locator('#confirm_age').check();
    await expect(finish).toBeEnabled();
    await finish.click();
    await page.waitForURL('**/community', { timeout: 15_000 });
    const state = await signIn(page);
    expect(state.terms_version).toBe(state.current_terms_version);
    expect(state.terms_accepted_at).toBeTruthy();
    expect(state.age_confirmed_at).toBeTruthy();
  });

  test('a member who accepted an older terms version meets the terms step on the next post', async ({ page }) => {
    await signIn(page, 'stale');
    await tryToPost(page);
    await expect(page.locator('#accept_terms')).not.toBeChecked();
    await signIn(page, 'current'); // leave the test account as a member in good standing
  });
});
