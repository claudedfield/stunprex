import { test, expect } from '@playwright/test';

/**
 * D-WEB-12 follow-up — lock the magic-link host to the served host.
 *
 * WHAT THIS EXISTS TO CATCH: during D-WEB-12 the Vercel primary-domain flip
 * silently inverted a code-level workaround in `auth.ts`. That code rewrote
 * magic-link hosts apex -> www to avoid a cross-host hop mid-callback; once www
 * started redirecting to the apex, the rewrite put the hop straight back into
 * the auth callback — the exact failure it was written to prevent. It still
 * authenticated, so nothing was visibly broken and nothing would have flagged it.
 *
 * The invariant that must hold, whatever the canonical host is: THE HOST AUTH.JS
 * BUILDS LINKS ON MUST EQUAL THE HOST BEING SERVED, with no redirect between the
 * click and the callback.
 *
 * Asserted without sending mail or creating state — `/api/auth/providers` reports
 * the exact `callbackUrl` a magic link will carry, which is the thing that broke.
 */

test('magic-link callback host equals the served host', async ({ request, baseURL }) => {
  const served = new URL(baseURL!).host;

  const res = await request.get('/api/auth/providers');
  expect(res.status()).toBe(200);
  const providers = await res.json();

  const callbackUrl: string | undefined = providers?.email?.callbackUrl;
  expect(callbackUrl, 'the email provider must expose a callbackUrl').toBeTruthy();

  expect(
    new URL(callbackUrl!).host,
    `magic links would be built on a different host than the one being served — ` +
      `this puts a cross-host redirect inside the auth callback (see D-WEB-12)`,
  ).toBe(served);
});

test('auth endpoints never bounce to another host', async ({ request, baseURL }) => {
  const served = new URL(baseURL!).host;

  for (const path of ['/api/auth/providers', '/api/auth/csrf', '/api/auth/signin']) {
    const res = await request.get(path, { maxRedirects: 0 });
    const location = res.headers()['location'];
    if (location) {
      expect(
        new URL(location, baseURL!).host,
        `${path} redirects off the served host — the auth flow must not change host`,
      ).toBe(served);
    }
  }
});

/**
 * Production-only: the redirect must run www -> apex, never the reverse. Skipped
 * against preview deployments, which have no www variant.
 */
test('www redirects to the apex in one hop, not the reverse', async ({ request, baseURL }) => {
  test.skip(
    !/(^|\.)stunprex\.com$/.test(new URL(baseURL!).host),
    'host-specific check — only meaningful against the real domain',
  );

  const res = await request.get('https://www.stunprex.com/api/auth/providers', {
    maxRedirects: 0,
  });
  expect(res.status(), 'www must issue a permanent redirect').toBe(308);
  expect(res.headers()['location']).toBe('https://stunprex.com/api/auth/providers');

  // And the apex must be the end of the chain — not redirect back.
  const apex = await request.get('https://stunprex.com/api/auth/providers', { maxRedirects: 0 });
  expect(apex.status(), 'the apex must serve, not redirect').toBe(200);
});
