import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { MAGIC_LINK_MAX_AGE_SECONDS } from '../lib/auth-constants';

/**
 * LEGAL-01i: every page and email says a sign-in link lasts 15 minutes. Auth.js sets a token's
 * expiry to now plus the provider's maxAge, or one day when none is set, which is what the site
 * did. This runs Auth.js's own token step against a stub adapter: no database, no mail sent.
 */
function repoRoot(): string {
  let dir = process.cwd();
  while (!fs.existsSync(path.join(dir, 'package.json')) && dir !== path.dirname(dir)) dir = path.dirname(dir);
  return dir;
}

test('auth.ts passes the 15 minute lifetime to the Email provider', () => {
  expect(MAGIC_LINK_MAX_AGE_SECONDS).toBe(15 * 60);
  const auth = fs.readFileSync(path.join(repoRoot(), 'auth.ts'), 'utf8');
  expect(auth).toMatch(/Email\(\{[\s\S]*?maxAge: MAGIC_LINK_MAX_AGE_SECONDS/);
});

test('a sign-in token expires 15 minutes after it is created', async () => {
  const file = path.join(repoRoot(), 'node_modules/@auth/core/lib/actions/signin/send-token.js');
  const { sendToken } = await import(pathToFileURL(file).href);
  let expires: Date | undefined;
  const before = Date.now();
  await sendToken(
    {
      body: { email: 'reader@example.com' },
      url: new URL('https://stunprex.com/api/auth/signin/email'),
      method: 'POST',
      headers: {},
      cookies: {},
      query: {},
    },
    {
      provider: { id: 'email', type: 'email', maxAge: MAGIC_LINK_MAX_AGE_SECONDS, sendVerificationRequest: async () => {} },
      callbacks: { signIn: async () => true, redirect: async ({ url }: { url: string }) => url },
      adapter: {
        getUserByEmail: async () => null,
        createVerificationToken: async (t: { expires: Date }) => {
          expires = t.expires;
          return t;
        },
      },
      url: new URL('https://stunprex.com/api/auth'),
      basePath: '/api/auth',
      secret: 'test-only-secret',
      callbackUrl: '/',
      theme: {},
    },
  );
  const seconds = (expires!.getTime() - before) / 1000;
  expect(seconds).toBeGreaterThan(15 * 60 - 5);
  expect(seconds).toBeLessThan(15 * 60 + 5);
});
