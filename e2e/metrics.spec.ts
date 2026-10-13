import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { countedPath, countedReferrer, countedEvent, notCounted } from '../lib/metrics/core';

/**
 * D-WEB-31: our own counters. The first tests check the rules that keep personal data and junk out
 * of the totals, with no server. The rest run on staging, where measuring is on, and read the
 * totals back through /api/test/metrics.
 */
const secret = process.env.E2E_SIGNIN_SECRET ?? '';

test('a counted path carries no query, no token, no address and no member name', () => {
  expect(countedPath('/training/first-rondo?utm_source=x#top')).toBe('/training/first-rondo');
  expect(countedPath('/auth/verify?token=abc123&email=a%40b.c')).toBe('/auth/verify');
  expect(countedPath('/newsletter/confirm?token=abc')).toBe('/newsletter/confirm');
  expect(countedPath('/community/u/some.name-1')).toBe('/community/u/[member]');
  expect(countedPath('/community/u/me')).toBe('/community/u/me');
  expect(countedPath('/Blog/Post/')).toBe('/blog/post');
  expect(countedPath('/a b/<script>')).toBe('(other)');
  expect(countedPath('/person@example.com')).toBe('(other)');
  expect(countedPath('/api/auth/session')).toBeNull();
  expect(countedPath('https://elsewhere.example/x')).toBeNull();
  expect(countedPath('//elsewhere.example/x')).toBeNull();
  expect(countedPath(42)).toBeNull();
});

test('a referrer is counted as a host name only, and never our own', () => {
  expect(countedReferrer('https://www.google.com/search?q=private+words', 'stunprex.com')).toBe('google.com');
  expect(countedReferrer('https://stunprex.com/training', 'stunprex.com')).toBeNull();
  expect(countedReferrer('https://www.stunprex.com/', 'stunprex.com')).toBeNull();
  expect(countedReferrer('not a url', 'stunprex.com')).toBeNull();
  expect(countedReferrer('', 'stunprex.com')).toBeNull();
});

test('only listed events are counted, and a detail with odd characters is dropped', () => {
  expect(countedEvent('drill_read_complete', 'first-rondo')).toBe('drill_read_complete:first-rondo');
  expect(countedEvent('drill_filter_used', 'ageBand:9-12')).toBe('drill_filter_used:ageband:9-12');
  expect(countedEvent('newsletter_signup', 'person@example.com')).toBe('newsletter_signup');
  expect(countedEvent('community_question_started', undefined)).toBe('community_question_started');
  expect(countedEvent('made_up_event', 'x')).toBeNull();
});

test('robots, and browsers that ask not to be measured, are not counted', () => {
  const h = (o: Record<string, string>) => new Headers(o);
  const chrome = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
  expect(notCounted(h({ 'user-agent': chrome }))).toBe(false);
  expect(notCounted(h({ 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }))).toBe(true);
  expect(notCounted(h({}))).toBe(true);
  expect(notCounted(h({ 'user-agent': chrome, dnt: '1' }))).toBe(true);
  expect(notCounted(h({ 'user-agent': chrome, 'sec-gpc': '1' }))).toBe(true);
});

test('the metrics test route does not answer without its secret', async ({ request }) => {
  expect((await request.post('/api/test/metrics', { data: { action: 'columns' } })).status()).toBe(404);
});

test('the counter answers 204, sets no cookie, and refuses a GET', async ({ request }) => {
  const res = await request.post('/api/m', { data: JSON.stringify({ t: 'pageview', p: '/' }), headers: { 'content-type': 'text/plain' } });
  expect(res.status()).toBe(204);
  expect(res.headers()['set-cookie']).toBeUndefined();
  expect((await request.get('/api/m')).status()).toBe(405);
});

test.describe('counting on staging', () => {
  test.skip(!secret, 'runs on staging only');

  // A browser-like user-agent of this run's own, so its visitor code belongs to no other test.
  const UA = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 e2e-${Date.now()}`;
  test.use({ userAgent: UA });

  const helper = async (request: APIRequestContext, data: Record<string, string>) => {
    const res = await request.post('/api/test/metrics', { headers: { 'x-e2e-secret': secret }, data });
    expect(res.status()).toBe(200);
    return res.json();
  };
  const read = async (request: APIRequestContext, kind: string, key: string) => (await helper(request, { action: 'read', kind, key })).n as number;
  /** Open a page and wait until its page-view message has left (a beacon; its answer is not exposed). */
  const view = async (page: Page, url: string) => {
    const sent = page.waitForRequest((r) => new URL(r.url()).pathname === '/api/m' && r.postData()?.includes('"pageview"') === true);
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
    return sent;
  };

  test('no table of the counter has a column for an IP address, a user-agent or a time of day', async ({ request }) => {
    const { columns } = await helper(request, { action: 'columns' });
    expect(columns).toEqual([
      'metrics_daily.day', 'metrics_daily.key', 'metrics_daily.kind', 'metrics_daily.n',
      'metrics_salt.month', 'metrics_salt.salt',
      'metrics_visitors.code', 'metrics_visitors.first_day', 'metrics_visitors.last_day', 'metrics_visitors.month',
    ]);
  });

  test('a page view is counted once, on our own host, with no cookie and no query string', async ({ page, context, request }) => {
    const other: string[] = [];
    const own = new URL(process.env.E2E_BASE_URL ?? 'https://stunprex.com').host;
    page.on('request', (r) => { const h = new URL(r.url()).host; if (h !== own) other.push(h); });
    const before = await read(request, 'pageview', '/imprint');
    const req = await view(page, '/imprint?token=secret-token-value&email=person%40example.com');
    expect(req.postData(), 'the message itself carries no query string').not.toContain('secret-token-value');
    expect(req.postData()).not.toContain('person');
    await expect.poll(() => read(request, 'pageview', '/imprint')).toBeGreaterThan(before);
    expect(other, 'a request left for another host').toEqual([]);
    expect((await context.cookies()).map((c) => c.name).filter((n) => !/authjs/i.test(n)), 'measuring sets no cookie').toEqual([]);
    expect(await page.evaluate(() => window.localStorage.length + window.sessionStorage.length), 'nothing stored on the device').toBe(0);
  });

  test('a visitor is new once, nothing more the same day, and returning on a later day', async ({ page, request }) => {
    await helper(request, { action: 'forget_visitor' });
    const newBefore = await read(request, 'visitor', 'new');
    await view(page, '/imprint');
    await expect.poll(async () => (await helper(request, { action: 'visitor' })).row).not.toBeNull();
    const newAfter = await read(request, 'visitor', 'new');
    expect(newAfter).toBeGreaterThan(newBefore);
    const returningBefore = await read(request, 'visitor', 'returning');
    await view(page, '/cookies');
    const { today, row } = await helper(request, { action: 'visitor' });
    expect(row.first_day).toBe(today);
    // As if the first visit had been yesterday.
    await helper(request, { action: 'age_visitor' });
    await view(page, '/terms');
    await expect.poll(async () => (await helper(request, { action: 'visitor' })).row.last_day).toBe(today);
    expect(await read(request, 'visitor', 'returning')).toBeGreaterThan(returningBefore);
    expect((await helper(request, { action: 'visitor' })).row.first_day, 'the first day is kept').not.toBe(today);
    await helper(request, { action: 'forget_visitor' });
  });

  test('a filter on /training is counted as an event, by its name and not by anything typed', async ({ page, request }) => {
    await view(page, '/training');
    const sent = page.waitForRequest((r) => new URL(r.url()).pathname === '/api/m' && r.postData()?.includes('drill_filter_used') === true);
    // The first unpressed button of a filter group is an option ("All" starts pressed).
    await page.locator('main button[aria-pressed="false"]').first().click();
    const body = JSON.parse((await sent).postData()!);
    expect(body.e).toBe('drill_filter_used');
    await expect.poll(() => read(request, 'event', `drill_filter_used:${String(body.d).toLowerCase()}`)).toBeGreaterThan(0);
  });
});

test.describe('a browser that asks not to be measured', () => {
  test.use({ extraHTTPHeaders: { DNT: '1' } });
  test('sends nothing to the counter', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
    let sent = 0;
    page.on('request', (r) => { if (new URL(r.url()).pathname === '/api/m') sent += 1; });
    await page.goto('/imprint', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    expect(sent).toBe(0);
  });
});
