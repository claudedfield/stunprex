import { test, expect } from '@playwright/test';

/**
 * The review bar (OT-063): on staging only, on pages that ask for a read. The fixture is a draft
 * post (content/posts/review-bar-fixture.mdx), never published.
 */
const host = new URL(process.env.E2E_BASE_URL ?? 'https://stunprex.com').host;
const secret = process.env.E2E_SIGNIN_SECRET ?? '';
const FIXTURE = '/review/posts/review-bar-fixture';

test('production has no review pages, no review routes and no bar', async ({ page, request }) => {
  test.skip(host !== 'stunprex.com', 'production only');
  expect((await request.get('/review')).status()).toBe(404);
  expect((await request.get(FIXTURE)).status()).toBe(404);
  expect((await request.get('/api/review?path=/blog/x')).status()).toBe(404);
  expect((await request.post('/api/review', { data: { path: FIXTURE, text: 'x' } })).status()).toBe(404);
  await page.goto('/blog');
  await expect(page.locator('[data-review-bar]')).toHaveCount(0);
});

test('the draft fixture is never public', async ({ request }) => {
  expect((await request.get('/blog/review-bar-fixture')).status()).toBe(404);
});

test.describe('on staging', () => {
  test.skip(host !== 'staging.stunprex.com' || !secret, 'staging only');
  test.describe.configure({ mode: 'serial' });
  const notes = (request: import('@playwright/test').APIRequestContext) =>
    request.get('/api/review/notes').then((r) => r.json());

  test('/review lists the page with its question, and /review/posts lists the draft', async ({ page }) => {
    await page.goto('/review');
    await expect(page.locator('[data-review-list]')).toContainText('Review bar test page');
    await expect(page.locator('[data-review-list]')).toContainText('Is this test question shown?');
    await page.goto('/review/posts');
    await expect(page.locator('[data-review-drafts]')).toContainText('Review bar test page');
  });

  test('the bar shows the question and the default, and keeps a note with the staging login', async ({ page, request }) => {
    await request.delete(`/api/review/notes?path=${encodeURIComponent(FIXTURE)}`, { headers: { 'x-e2e-secret': secret } });
    await page.goto(FIXTURE);
    const bar = page.locator('[data-review-bar]');
    await expect(bar.locator('[data-review-question]')).toHaveText('Is this test question shown?');
    await expect(bar.locator('[data-review-default]')).toContainText('The test passes as it is.');
    await expect(page.locator('header').first()).toBeVisible();
    const note = `test note ${Date.now()}`;
    await bar.getByLabel('Your note').fill(note);
    await bar.getByRole('button', { name: 'Save note' }).click();
    await expect(bar.locator('[data-review-saved]')).toBeVisible();
    await expect(bar.getByLabel('Your note'), 'the box is cleared for another note').toHaveValue('');
    const { notes: rows } = await notes(request);
    const mine = rows.find((n: { text: string }) => n.text === note);
    expect(mine?.path).toBe(FIXTURE);
    expect(mine?.by_login).toBe((process.env.E2E_STAGING_AUTH ?? '').split(':')[0]);
    await request.delete(`/api/review/notes?path=${encodeURIComponent(FIXTURE)}`, { headers: { 'x-e2e-secret': secret } });
  });

  test('a page that asks for no read shows no bar and takes no note', async ({ page, request }) => {
    await page.goto('/blog/constraints-in-training-the-pitch');
    await expect(page.locator('[data-review-bar]')).toHaveCount(0);
    const r = await request.post('/api/review', { data: { path: '/blog/constraints-in-training-the-pitch', text: 'x' } });
    expect(r.status()).toBe(400);
  });

  test('deleting notes needs the secret', async ({ request }) => {
    expect((await request.delete(`/api/review/notes?path=${encodeURIComponent(FIXTURE)}`)).status()).toBe(404);
  });
});
