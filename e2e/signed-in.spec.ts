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

// Every test here signs in as the one test account, and the terms tests change its state, so the
// file runs one test at a time: no test sees the account while another is changing it.
test.describe.configure({ mode: 'serial' });

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

  // 1 Oct 2026: the owner's sign-in succeeded and sent him back to the sign-in form, which showed
  // the form again and looked like a failure. A signed-in visitor never stays on the form.
  test('a signed-in visitor is sent on from the sign-in pages, only ever to this site', async ({ page }) => {
    await page.goto('/signin');
    await expect(page).toHaveURL(/\/community$/);
    await page.goto('/signin?next=/community/ask');
    await expect(page).toHaveURL(/\/community\/ask$/);
    await page.goto('/signin?next=//example.com/x');
    await expect(page).toHaveURL(/stunprex\.com\/community$/);
    await page.goto('/auth/sign-up');
    await expect(page).toHaveURL(/\/community$/);
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
  test.skip(!secret, 'signed-in tests run on staging only');

  const signIn = async (page: import('@playwright/test').Page, terms?: 'none' | 'stale' | 'current') => {
    const res = await page.request.post('/api/test/sign-in', {
      headers: { 'x-e2e-secret': secret }, data: terms ? { terms } : {} });
    expect(res.status()).toBe(200);
    return res.json();
  };

  const tryToPost = async (page: import('@playwright/test').Page) => {
    // Wait for the load event, so React has taken over the form before it is filled (filled
    // earlier, the typed values never reach the form's state). One run on a freshly started
    // staging container needed more than the default 30 s for it, so this one gets 60.
    await page.goto('/community/ask', { timeout: 60_000 });
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
