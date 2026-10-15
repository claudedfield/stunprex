import { test, expect } from '@playwright/test';
import { googleProfile, withoutTokens } from '../lib/auth/google';

/**
 * Sign in with Google. A real Google sign-in cannot run in the suite, so it checks the parts that
 * are ours: what we keep from Google, and that the button sends the browser to Google with our
 * client, our callback and the smallest scope. The request to Google is stopped before it leaves.
 */
const host = new URL(process.env.E2E_BASE_URL ?? 'https://stunprex.com').host;

test('from Google we keep the account id and the email address, not the name or the picture', () => {
  expect(googleProfile({ sub: '123', email: 'a@example.com', name: 'A Person', picture: 'https://x/y.png' } as never))
    .toEqual({ id: '123', email: 'a@example.com', name: null, image: null });
});

test("Google's tokens are not stored with the account link", () => {
  const stored = withoutTokens({ provider: 'google', providerAccountId: '123', userId: 'u', type: 'oidc',
    access_token: 'at', refresh_token: 'rt', id_token: 'it', expires_at: 1, scope: 'openid email', token_type: 'bearer', session_state: 's' });
  expect(Object.entries(stored).filter(([, v]) => v !== undefined).map(([k]) => k).sort())
    .toEqual(['provider', 'providerAccountId', 'type', 'userId']);
});

test('on production the Google button stays hidden until it is opened', async ({ page }) => {
  test.skip(host !== 'stunprex.com', 'production only');
  await page.goto('/signin');
  await expect(page.locator('[data-google-signin]')).toHaveCount(0);
});

test.describe('on staging', () => {
  test.skip(host !== 'staging.stunprex.com', 'staging only');

  for (const path of ['/signin', '/auth/sign-up']) {
    test(`${path} offers Google, and says what is taken from it`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
      await expect(page.locator('[data-google-signin]')).toContainText('only your email address');
    });
  }

  test('the button sends the browser to Google with our client, our callback and the scope "openid email"', async ({ page }) => {
    let sent = '';
    await page.route('https://accounts.google.com/**', (route) => { sent = route.request().url(); return route.abort(); });
    await page.goto('/signin?next=/training', { waitUntil: 'load', timeout: 60_000 });
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await expect.poll(() => sent, { timeout: 15_000 }).not.toBe('');
    const u = new URL(sent);
    expect(u.origin).toBe('https://accounts.google.com');
    expect(u.searchParams.get('client_id')).toMatch(/\.apps\.googleusercontent\.com$/);
    expect(u.searchParams.get('redirect_uri')).toBe('https://staging.stunprex.com/api/auth/callback/google');
    expect(u.searchParams.get('scope')).toBe('openid email');
    expect(u.searchParams.get('response_type')).toBe('code');
  });
});
