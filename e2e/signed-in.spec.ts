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

  // 1 and 4 Oct 2026, the owner's two reports: a signed-in visitor on the sign-in pages sees who they
  // are and the two things they can do: no form, no silent redirect, and only ever a link to this site.
  test('the sign-in pages tell a signed-in visitor so, with a way on and a way out', async ({ page }) => {
    await page.goto('/signin');
    const notice = page.locator('[data-signed-in-notice]');
    await expect(notice).toContainText('You are signed in as');
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expect(notice.getByRole('link', { name: 'Go to the community' })).toHaveAttribute('href', '/community');
    await expect(notice.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await page.goto('/signin?next=/community/ask');
    await expect(notice.getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/community/ask');
    await page.goto('/signin?next=//example.com/x');
    await expect(notice.getByRole('link')).toHaveAttribute('href', '/community');
    await page.goto('/auth/sign-up');
    await expect(notice).toContainText('You are signed in as');
  });

  test('the header shows the member and Sign out, and signing out ends the session', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('header [data-auth-nav="signed-in"]');
    await expect(nav.getByRole('link')).toHaveAttribute('href', '/community/u/me');
    await expect(page.locator('header').getByRole('link', { name: 'Sign in' })).toHaveCount(0);
    await nav.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.locator('header [data-auth-nav="signed-out"]').getByRole('link', { name: 'Sign in' })).toBeVisible();
    expect((await (await page.request.get('/api/auth/session')).json())?.user ?? null).toBeNull();
  });

  // LEGAL-02.3: a profile picture address on another host is never loaded, and the form has no field for one.
  test('a stored picture address is never loaded; the profile shows the initial and no picture field', async ({ page }) => {
    await page.request.post('/api/test/sign-in', { headers: { 'x-e2e-secret': secret }, data: { avatar: true } });
    const other: string[] = [];
    const own = new URL(page.url() === 'about:blank' ? (process.env.E2E_BASE_URL ?? 'https://stunprex.com') : page.url()).host;
    page.on('request', (r) => { const h = new URL(r.url()).host; if (h !== own) other.push(h); });
    await page.goto('/community/u/me');
    const name = (await (await page.request.get('/api/auth/session')).json()).user.display_name as string;
    await expect(page.locator('main img')).toHaveCount(0);
    await expect(page.locator('input[name="avatar_url"]')).toHaveCount(0);
    await page.goto(`/community/u/${encodeURIComponent(name)}`);
    await expect(page.locator('main img')).toHaveCount(0);
    expect(other, 'a request left for another host').toEqual([]);
    await page.request.post('/api/test/sign-in', { headers: { 'x-e2e-secret': secret }, data: { avatar: false } });
  });

  // COO-DEV-0037: the page threw a server error on render, and no test read its content.
  test('the profile page renders for its member, and a bio save is kept', async ({ page }) => {
    const res = await page.goto('/community/u/me', { waitUntil: 'load' });
    expect(res?.status()).toBe(200);
    await expect(page.locator('main')).not.toContainText('Application error');
    await expect(page.locator('h1')).toBeVisible();
    const bio = `e2e bio ${Date.now()}`;
    await page.locator('#me-bio').fill(bio);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.locator('[data-profile-result="saved"]')).toBeVisible();
    await page.reload();
    await expect(page.locator('#me-bio')).toHaveValue(bio);
    await page.locator('#me-bio').fill('');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.locator('[data-profile-result="saved"]')).toBeVisible();
  });

  test('signed out, the profile address leads to sign-in, without an error', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const res = await p.goto('/community/u/me');
    expect(res?.status()).toBe(200);
    expect(new URL(p.url()).pathname).not.toBe('/community/u/me');
    await expect(p.locator('body')).not.toContainText('Application error');
    await ctx.close();
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

  // LEGAL-03.14: an unfinished sign-up (link opened, the two boxes never ticked) is not a member.
  test('an unfinished sign-up has no public profile page and is sent to the terms step', async ({ page }) => {
    await signIn(page, 'none');
    const name = (await (await page.request.get('/api/auth/session')).json()).user.display_name as string;
    const res = await page.goto(`/community/u/${encodeURIComponent(name)}`);
    expect(res?.status(), 'the profile address of an unfinished sign-up').toBe(404);
    await page.goto('/community/u/me');
    await page.waitForURL('**/community/welcome', { timeout: 15_000 });
    // Once the two boxes are ticked, the same address answers.
    await signIn(page, 'current');
    expect((await page.goto(`/community/u/${encodeURIComponent(name)}`))?.status()).toBe(200);
  });

  test('the daily job deletes an unfinished sign-up 30 days after its last sign-in, and keeps a younger one', async ({ request }) => {
    const helper = async (action: string) => {
      const res = await request.post('/api/test/newsletter', { headers: { 'x-e2e-secret': secret }, data: { action } });
      expect(res.status()).toBe(200);
      return res.json();
    };
    await helper('seed_unfinished');
    const r = await helper('cleanup_accounts');
    expect(r.unfinished_deleted).toBeGreaterThanOrEqual(1);
    expect(r.old_left, 'the account aged 31 days is gone').toBe(0);
    expect(r.sessions_left, 'its session went with it').toBe(0);
    expect(r.young_left, 'the account aged 29 days stays').toBe(1);
  });

  test('a member who accepted an older terms version meets the terms step on the next post', async ({ page }) => {
    await signIn(page, 'stale');
    await tryToPost(page);
    await expect(page.locator('#accept_terms')).not.toBeChecked();
    await signIn(page, 'current'); // leave the test account as a member in good standing
  });
});
