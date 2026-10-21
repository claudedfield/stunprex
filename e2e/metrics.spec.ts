import { test, expect, type APIRequestContext } from '@playwright/test';
import { countedPath, countedReferrer, sortRequest } from '../lib/metrics/core';

/**
 * Our own visit counting, way C (OT-138, 21 Oct 2026): the server counts the pages it sends, people
 * and robots apart; no script in the browser, nothing about a visitor kept. The first tests check
 * the rules with no server; the rest run on staging, where counting is on.
 */
const secret = process.env.E2E_SIGNIN_SECRET ?? '';
const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const PAGE_LOAD = {
  'user-agent': CHROME, accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'accept-language': 'en-GB,en;q=0.9',
  'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document', 'sec-fetch-site': 'none',
};

test('a counted path carries no query, no token, no address, no member name and no file', () => {
  expect(countedPath('/training/first-rondo?utm_source=x#top')).toBe('/training/first-rondo');
  expect(countedPath('/auth/verify?token=abc123&email=a%40b.c')).toBe('/auth/verify');
  expect(countedPath('/community/u/some.name-1')).toBe('/community/u/[member]');
  expect(countedPath('/community/u/me')).toBe('/community/u/me');
  expect(countedPath('/Blog/Post/')).toBe('/blog/post');
  expect(countedPath('/a b/<script>')).toBe('(other)');
  expect(countedPath('/person@example.com')).toBe('(other)');
  expect(countedPath('/.env')).toBeNull();
  expect(countedPath('/wp-login.php')).toBeNull();
  expect(countedPath('/api/auth/session')).toBeNull();
  expect(countedPath('//elsewhere.example/x')).toBeNull();
  expect(countedPath(42)).toBeNull();
});

test('a referrer is counted as a host name only, and never our own', () => {
  expect(countedReferrer('https://www.google.com/search?q=private+words', 'stunprex.com')).toBe('google.com');
  expect(countedReferrer('https://stunprex.com/training', 'stunprex.com')).toBeNull();
  expect(countedReferrer('https://www.stunprex.com/', 'stunprex.com')).toBeNull();
  expect(countedReferrer('not a url', 'stunprex.com')).toBeNull();
});

test('people and robots are told apart from what the request carries', () => {
  const sort = (h: Record<string, string>, method = 'GET') => sortRequest(method, new Headers(h));
  expect(sort(PAGE_LOAD)).toEqual({ as: 'person', navigation: true });
  // The site's own in-page navigation.
  expect(sort({ 'user-agent': CHROME, rsc: '1', 'sec-fetch-mode': 'cors', 'sec-fetch-site': 'same-origin' })).toEqual({ as: 'person', navigation: false });
  // Robots that say who they are, by name.
  expect(sort({ ...PAGE_LOAD, 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' })).toEqual({ as: 'robot', name: 'google' });
  expect(sort({ 'user-agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2)' })).toEqual({ as: 'robot', name: 'openai' });
  expect(sort({ 'user-agent': 'facebookexternalhit/1.1' })).toEqual({ as: 'robot', name: 'link-previews' });
  expect(sort({ 'user-agent': 'python-requests/2.32' })).toEqual({ as: 'robot', name: 'other-named' });
  expect(sort({ ...PAGE_LOAD, 'user-agent': CHROME.replace('Chrome/', 'HeadlessChrome/') })).toEqual({ as: 'robot', name: 'other-named' });
  expect(sort({})).toEqual({ as: 'robot', name: 'no-user-agent' });
  // A browser's name without a browser's headers: a robot that does not say so.
  expect(sort({ 'user-agent': CHROME })).toEqual({ as: 'robot', name: 'undeclared' });
  expect(sort({ ...PAGE_LOAD, 'accept-language': '' })).toEqual({ as: 'robot', name: 'undeclared' });
  expect(sort({ 'user-agent': CHROME, rsc: '1' })).toEqual({ as: 'robot', name: 'undeclared' });
  // Not counted at all: prefetches, other methods, our own tests, and browsers that ask not to be measured.
  expect(sort({ ...PAGE_LOAD, 'sec-purpose': 'prefetch' })).toEqual({ as: 'none' });
  expect(sort({ 'user-agent': CHROME, rsc: '1', 'next-router-prefetch': '1', 'sec-fetch-mode': 'cors', 'sec-fetch-site': 'same-origin' })).toEqual({ as: 'none' });
  expect(sort(PAGE_LOAD, 'HEAD')).toEqual({ as: 'none' });
  expect(sort({ ...PAGE_LOAD, 'user-agent': `${CHROME} StunpreX-E2E` })).toEqual({ as: 'none' });
  expect(sort({ ...PAGE_LOAD, dnt: '1' })).toEqual({ as: 'none' });
  expect(sort({ ...PAGE_LOAD, 'sec-gpc': '1' })).toEqual({ as: 'none' });
});

test('the old browser counter is gone', async ({ request }) => {
  expect((await request.post('/api/m', { data: '{}' })).status()).toBe(404);
});

test('the metrics test route does not answer without its secret', async ({ request }) => {
  expect((await request.post('/api/test/metrics', { data: { action: 'columns' } })).status()).toBe(404);
});

test.describe('counting on staging', () => {
  test.skip(!secret, 'runs on staging only');

  const helper = async (request: APIRequestContext, data: Record<string, string>) => {
    const res = await request.post('/api/test/metrics', { headers: { 'x-e2e-secret': secret }, data });
    expect(res.status()).toBe(200);
    return res.json();
  };
  const read = async (request: APIRequestContext, kind: string, key: string) => (await helper(request, { action: 'read', kind, key })).n as number;

  test('the totals table has no column for an IP address, a browser or a time of day', async ({ request }) => {
    expect((await helper(request, { action: 'columns' })).columns).toEqual(['day', 'key', 'kind', 'n']);
  });

  test.describe('a person\'s browser', () => {
    test.use({ userAgent: CHROME });
    test('is counted by the server, with no script, no cookie, nothing stored and no other host', async ({ page, context, request }) => {
      const other: string[] = [];
      const own = new URL(process.env.E2E_BASE_URL ?? 'https://stunprex.com').host;
      const toCounter: string[] = [];
      page.on('request', (r) => {
        const u = new URL(r.url());
        if (u.host !== own) other.push(u.host);
        if (u.pathname.startsWith('/api/m')) toCounter.push(u.pathname);
      });
      const before = await read(request, 'pageview', '/imprint');
      await page.goto('/imprint?token=secret-token-value&email=person%40example.com', { waitUntil: 'load', timeout: 60_000 });
      await expect.poll(() => read(request, 'pageview', '/imprint')).toBeGreaterThan(before);
      await page.waitForTimeout(500);
      expect(toCounter, 'the browser sends nothing for counting').toEqual([]);
      expect(other, 'a request left for another host').toEqual([]);
      expect((await context.cookies()).map((c) => c.name).filter((n) => !/authjs/i.test(n)), 'counting sets no cookie').toEqual([]);
      expect(await page.evaluate(() => window.localStorage.length + window.sessionStorage.length), 'nothing stored on the device').toBe(0);
    });
  });

  test('a robot is counted as a robot, by name', async ({ request }) => {
    const google = await read(request, 'robot', 'google');
    const undeclared = await read(request, 'robot', 'undeclared');
    const googlePage = await read(request, 'robot_page', 'google /cookies');
    await request.get('/cookies', { headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } });
    // A browser's name with none of a browser's headers.
    await request.get('/cookies', { headers: { 'user-agent': CHROME } });
    await expect.poll(() => read(request, 'robot', 'google')).toBeGreaterThan(google);
    await expect.poll(() => read(request, 'robot', 'undeclared')).toBeGreaterThan(undeclared);
    expect(await read(request, 'robot_page', 'google /cookies')).toBeGreaterThan(googlePage);
  });
});
