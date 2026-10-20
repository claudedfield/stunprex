import { test, expect } from '@playwright/test';

/**
 * Keeper ruling 61 (20 Oct 2026): capacity family F4 is Collective, not Communication. The old
 * address answers with a permanent redirect so links and search results keep working.
 */
test('/capacities/communication redirects permanently to /capacities/collective', async ({ request }) => {
  const res = await request.get('/capacities/communication', { maxRedirects: 0 });
  expect(res.status()).toBe(301);
  expect(new URL(res.headers()['location'], 'https://x').pathname).toBe('/capacities/collective');
});

test('the Collective page exists and the overview names the six families with Collective', async ({ page }) => {
  expect((await page.goto('/capacities/collective'))?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('Collective');
  await page.goto('/capacities');
  const main = page.locator('main');
  await expect(main.locator('a[href="/capacities/collective"]').first()).toBeVisible();
  await expect(main.locator('a[href="/capacities/communication"]')).toHaveCount(0);
});

test('the /training filter offers Collective as a family and no longer Communication', async ({ page }) => {
  await page.goto('/training');
  await expect(page.getByRole('button', { name: 'Collective', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Communication', exact: true })).toHaveCount(0);
});
