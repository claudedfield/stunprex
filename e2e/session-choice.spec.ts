import { test, expect, type Page, type APIRequestContext, type BrowserContext } from '@playwright/test';
import { googleTrust } from '../lib/auth/google';

/**
 * Legal 03.4 (the session choice) and C1 (which Google sign-ins are one click), revision 3 sections
 * 1 and 5. The rule itself is checked with no server; the rest runs on staging, where sign-in mail
 * is captured and read back through /api/test/session-choice.
 */
const secret = process.env.E2E_SIGNIN_SECRET ?? '';
const KEEP = 'e2e-keep@stunprex.test';
const DAY = 24 * 60 * 60;

test('Google: one click only where Google is the authority for the address (C1, three cases)', () => {
  expect(googleTrust({ email: 'someone@gmail.com', email_verified: true })).toBe('one-click');
  expect(googleTrust({ email: 'coach@club.example', email_verified: true, hd: 'club.example' })).toBe('one-click');
  expect(googleTrust({ email: 'parent@outlook.example', email_verified: true }), 'another address: code first').toBe('confirm');
  expect(googleTrust({ email: 'someone@gmail.com', email_verified: false })).toBe('refuse');
  expect(googleTrust({ email: 'parent@outlook.example' })).toBe('refuse');
  expect(googleTrust(undefined)).toBe('refuse');
});

test('the session-choice test route does not answer without its secret', async ({ request }) => {
  expect((await request.post('/api/test/session-choice', { data: { action: 'state' } })).status()).toBe(404);
});

test.describe('the session choice and the Google address check (staging)', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!secret, 'runs on staging only');

  const helper = async (request: APIRequestContext, data: Record<string, unknown>) => {
    const res = await request.post('/api/test/session-choice', { headers: { 'x-e2e-secret': secret }, data });
    expect(res.status()).toBe(200);
    return res.json();
  };
  const codeIn = (text: string) => text.match(/(\d{3}) (\d{3})/)!.slice(1).join('');
  const sessionCookie = async (context: BrowserContext) =>
    (await context.cookies()).find((c) => /authjs\.session-token$/.test(c.name)) ?? null;

  /** Sign in by the emailed code from /signin, with the box ticked or not. */
  const signIn = async (page: Page, request: APIRequestContext, keep: boolean) => {
    await page.goto('/signin', { waitUntil: 'load', timeout: 60_000 });
    const box = page.getByLabel('Keep me signed in on this device for 30 days');
    await expect(box, 'never ticked by default').not.toBeChecked();
    if (keep) await box.check();
    await page.locator('#email').fill(KEEP);
    await page.getByRole('button', { name: 'Send sign-in code' }).click();
    await expect(page.locator('[data-signin-step="code"]')).toBeVisible();
    await expect.poll(async () => (await helper(request, { action: 'mail', who: 'keep' })).text).not.toBeNull();
    const code = codeIn((await helper(request, { action: 'mail', who: 'keep' })).text);
    await page.locator('#signin-code').fill(code);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/community'), { timeout: 20_000 });
  };

  test('not ticked: a session cookie in the browser, 24 hours on the server, and signing out removes it', async ({ page, context, request }) => {
    await helper(request, { action: 'reset' });
    await signIn(page, request, false);
    expect((await sessionCookie(context))?.expires, 'a session cookie has no expiry').toBe(-1);
    const { session } = await helper(page.request, { action: 'session' });
    expect(session.keep).toBe(false);
    expect(session.seconds).toBeGreaterThan(DAY - 600);
    expect(session.seconds).toBeLessThanOrEqual(DAY);
    // Reading the session through Auth.js's own route sets the cookie again: still a session cookie.
    await page.request.get('/api/auth/session');
    expect((await sessionCookie(context))?.expires).toBe(-1);
    expect((await helper(page.request, { action: 'session' })).session.seconds, 'not extended').toBeLessThanOrEqual(DAY);
    await page.goto('/community');
    await page.locator('[data-auth-nav="signed-in"]').first().getByRole('button', { name: 'Sign out' }).click();
    await expect.poll(async () => sessionCookie(context)).toBeNull();
  });

  test('ticked: the cookie is kept 30 days, and so is the session on the server', async ({ page, context, request }) => {
    await helper(request, { action: 'reset' });
    await signIn(page, request, true);
    const cookie = await sessionCookie(context);
    const left = cookie!.expires - Date.now() / 1000;
    expect(left).toBeGreaterThan(30 * DAY - 600);
    expect(left).toBeLessThanOrEqual(30 * DAY + 60);
    const { session } = await helper(page.request, { action: 'session' });
    expect(session.keep).toBe(true);
    expect(session.seconds).toBeGreaterThan(30 * DAY - 600);
  });

  for (const keep of [false, true]) {
    test(`the Google button carries the choice (${keep ? 'ticked' : 'not ticked'})`, async ({ page, context }) => {
      await page.route(/accounts\.google\.com/, (route) => route.abort());
      await page.goto('/signin', { waitUntil: 'load', timeout: 60_000 });
      if (keep) await page.getByLabel('Keep me signed in on this device for 30 days').check();
      const toGoogle = page.waitForRequest(/accounts\.google\.com/);
      await page.getByRole('button', { name: 'Continue with Google' }).click();
      await toGoogle;
      const choice = (await context.cookies()).find((c) => c.name === 'sx-signin');
      expect(choice?.value.startsWith(keep ? '1.' : '0.')).toBe(true);
      expect(choice!.expires - Date.now() / 1000, 'the choice cookie lasts at most 15 minutes').toBeLessThanOrEqual(15 * 60 + 5);
    });
  }

  test('another address: nothing is linked or opened until the emailed code is typed; then the link stands', async ({ page, request, browser }) => {
    await helper(request, { action: 'reset' });
    await page.goto('/', { waitUntil: 'load', timeout: 60_000 });
    await helper(page.request, { action: 'hold_google', keep: false });
    await page.goto('/auth/google-confirm');
    await expect(page.locator('[data-google-confirm="held"]')).toContainText('e2e-google@stunprex.test');
    expect(await helper(request, { action: 'state' }), 'no account and no link yet').toMatchObject({ users: 0, linked: 0, held: 1 });

    // Another browser, without this one's sign-in cookie, sees nothing of it.
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto('/auth/google-confirm');
    await expect(otherPage.locator('[data-google-confirm="expired"]')).toBeVisible();
    await expect(otherPage.locator('main')).not.toContainText('e2e-google@stunprex.test');
    await other.close();

    await page.getByRole('button', { name: 'Email me the code' }).click();
    await expect(page.locator('[data-signin-step="code"]')).toBeVisible();
    await expect.poll(async () => (await helper(request, { action: 'mail', who: 'google' })).text).not.toBeNull();
    await page.locator('#signin-code').fill(codeIn((await helper(request, { action: 'mail', who: 'google' })).text));
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/community'), { timeout: 20_000 });
    expect(await helper(request, { action: 'state' })).toMatchObject({ users: 1, linked: 1, held: 0 });
    await helper(request, { action: 'reset' });
  });
});
