import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * D-AUTH-02: sign-in by a six-digit code or a one-press link, with bot protection, end to end on
 * staging. Staging never sends sign-in mail: it is captured and read back through
 * /api/test/signin-code, for one reserved test address. The tests share that address, so they run
 * in order.
 */
const secret = process.env.E2E_SIGNIN_SECRET ?? '';
const ADDRESS = 'e2e-signin@stunprex.test';

test('the sign-in code test route does not answer without its secret', async ({ request }) => {
  expect((await request.post('/api/test/signin-code', { data: { action: 'state' } })).status()).toBe(404);
});

test('the link page without a token signs nobody in and offers no button', async ({ page }) => {
  await page.goto('/auth/verify');
  await expect(page.locator('[data-signin-step="wait"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCount(0);
});

test.describe('code, link, trap and limits (staging)', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!secret, 'runs on staging only');

  const helper = async (request: APIRequestContext, action: string) => {
    const res = await request.post('/api/test/signin-code', { headers: { 'x-e2e-secret': secret }, data: { action } });
    expect(res.status()).toBe(200);
    return res.json();
  };
  const mails = async (request: APIRequestContext) => (await helper(request, 'mail')).messages as Array<{
    subject: string; headers: Record<string, string>; text_body: string; html_body: string }>;
  const ask = async (page: Page) => {
    await page.goto('/signin', { waitUntil: 'load', timeout: 60_000 });
    await page.locator('#email').fill(ADDRESS);
    await page.getByRole('button', { name: 'Send sign-in code' }).click();
  };
  const session = async (page: Page) => (await (await page.request.get('/api/auth/session')).json())?.user ?? null;
  const codeIn = (text: string) => text.match(/(\d{3}) (\d{3})/)!.slice(1).join('');
  const linkIn = (text: string) => {
    const u = new URL(text.match(/https?:\/\/\S+\/auth\/verify\?token=\S+/)![0]);
    return u.pathname + u.search;
  };

  test('asking to sign in sends one mail with a code and a link, and no Auth.js link', async ({ page, request }) => {
    await helper(request, 'reset');
    await ask(page);
    await expect(page.locator('[data-signin-step="code"]')).toBeVisible();
    const mail = await mails(request);
    expect(mail).toHaveLength(1);
    expect(mail[0].headers['Reply-To']).toBe('hello@stunprex.com');
    expect(mail[0].text_body).toMatch(/\d{3} \d{3}/);
    expect(mail[0].text_body).toContain('/auth/verify?token=');
    for (const body of [mail[0].text_body, mail[0].html_body]) {
      expect(body, 'the link that signs in on a plain GET is never mailed').not.toContain('/api/auth/callback');
    }
  });

  test('fetching the mailed link, as a mail scanner does, signs nobody in and makes no account', async ({ request }) => {
    const link = linkIn((await mails(request))[0].text_body);
    const res = await request.get(link);
    expect(res.status()).toBe(200);
    expect((await (await request.get('/api/auth/session')).json())?.user ?? null).toBeNull();
    expect((await helper(request, 'state')).users, 'no account before a person finishes').toBe(0);
  });

  test('a wrong code is refused; the right code signs in', async ({ page, request }) => {
    await helper(request, 'reset');
    await ask(page);
    const code = codeIn((await mails(request))[0].text_body);
    const wrong = code === '000000' ? '000001' : '000000';
    await page.locator('#signin-code').fill(wrong);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.locator('[data-signin-code-error]')).toContainText('not right');
    expect(await session(page)).toBeNull();
    await page.locator('#signin-code').fill(`${code.slice(0, 3)} ${code.slice(3)}`);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/community'), { timeout: 20_000 });
    expect(await session(page), 'signed in by the code').not.toBeNull();
    // The code works once.
    await page.context().clearCookies();
    const again = await page.request.post('/api/test/signin-code', { headers: { 'x-e2e-secret': secret }, data: { action: 'state' } });
    expect((await again.json()).users).toBe(1);
  });

  test('the mailed link opens a page with one button, and pressing it signs in', async ({ page, request }) => {
    await helper(request, 'reset');
    await ask(page);
    await expect(page.locator('[data-signin-step="code"]')).toBeVisible();
    const link = linkIn((await mails(request))[0].text_body);
    await page.context().clearCookies();
    await page.goto(link);
    expect(await session(page), 'opening the page is not signing in').toBeNull();
    await page.locator('[data-signin-step="link"]').getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/community'), { timeout: 20_000 });
    expect(await session(page), 'signed in by the button').not.toBeNull();
    // The link works once.
    await page.context().clearCookies();
    await page.goto(link);
    await page.locator('[data-signin-step="link"]').getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('[data-signin-step="expired"]')).toBeVisible();
    expect(await session(page)).toBeNull();
  });

  test('a request that fills the trap field is answered like a real one and is not mailed', async ({ page, request }) => {
    await helper(request, 'reset');
    await page.goto('/signin', { waitUntil: 'load', timeout: 60_000 });
    await page.locator('#email').fill(ADDRESS);
    await page.locator('#website').fill('https://example.invalid', { force: true });
    await page.getByRole('button', { name: 'Send sign-in code' }).click();
    await expect(page.locator('[data-signin-step="code"]')).toBeVisible();
    expect(await mails(request)).toHaveLength(0);
    expect((await helper(request, 'state')).codes).toBe(0);
  });

  test('the fourth request for one address within 15 minutes is refused with a reason', async ({ page, request }) => {
    await helper(request, 'reset');
    for (let i = 0; i < 3; i++) {
      await ask(page);
      await expect(page.locator('[data-signin-step="code"]')).toBeVisible();
    }
    await ask(page);
    await expect(page.locator('main [role="alert"]').filter({ hasText: 'already sent sign-in mail' })).toBeVisible();
    expect(await mails(request)).toHaveLength(3);
    await helper(request, 'reset');
  });
});
