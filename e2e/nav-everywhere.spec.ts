import { test, expect } from '@playwright/test';

/**
 * Every page carries the site's navigation and footer, so a visitor can always go elsewhere
 * (owner report, 22 Oct 2026: /community/u/me had none).
 */
const secret = process.env.E2E_SIGNIN_SECRET ?? '';

const hasNav = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('header').first()).toBeVisible();
  await expect(page.locator('footer').first()).toBeVisible();
};

test('the sign-in link page carries the navigation', async ({ page }) => {
  await page.goto('/auth/verify');
  await hasNav(page);
});

test.describe('signed-in pages carry the navigation', () => {
  test.skip(!secret, 'signed-in tests run on staging only');
  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/test/sign-in', { headers: { 'x-e2e-secret': secret }, data: { terms: 'current' } });
    expect(res.status()).toBe(200);
  });
  for (const path of ['/community/u/me', '/community/ask']) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await hasNav(page);
    });
  }
});
