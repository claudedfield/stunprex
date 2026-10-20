import { test, expect } from '@playwright/test';

/**
 * The owner's word of 20 Oct 2026, "publish all that awaits" (D-CONTENT-23): what went live, and
 * the post plan's two redirects.
 */
test('two straightened drill pages carry their new titles; page 4 links page 1 by its new name', async ({ page }) => {
  await page.goto('/training/wall-scan-receive');
  await expect(page.locator('h1')).toContainText('Wall Look-and-Receive');
  await page.goto('/training/self-call-sea');
  await expect(page.locator('h1')).toContainText("Carry to the Card's Gate");
  await expect(page.locator('main')).not.toContainText('the version without a coach of');
  await page.goto('/training/self-audit-session');
  await expect(page.locator('main a[href="/training/wall-scan-receive"]').first()).toHaveText('Wall Look-and-Receive');
});

test('the constraints article is published and listed', async ({ page }) => {
  expect((await page.goto('/blog/constraints-in-training-the-pitch'))?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('Constraints in training, part 1: the pitch');
  await page.goto('/blog');
  await expect(page.locator('main a[href="/blog/constraints-in-training-the-pitch"]').first()).toBeVisible();
});

for (const [slug, h1] of [['perceptual', 'The perceptual capacity'], ['cognitive', 'The cognitive capacity']] as const) {
  test(`/capacities/${slug} shows the reference text above its drill list`, async ({ page }) => {
    await page.goto(`/capacities/${slug}`);
    await expect(page.locator('h1')).toContainText(h1);
    await expect(page.locator('[data-capacity-reference]')).toBeVisible();
  });
}

test('a family without a reference text keeps its one-line description', async ({ page }) => {
  await page.goto('/capacities/motor');
  await expect(page.locator('h1')).toHaveText('Motor');
  await expect(page.locator('[data-capacity-reference]')).toHaveCount(0);
});

test('the Rodri breakdown is retired for now (temporary redirect to the blog); the scanning post goes to the perceptual page', async ({ request }) => {
  const rodri = await request.get('/blog/rodri-spatial-intelligence', { maxRedirects: 0 });
  expect(rodri.status()).toBe(307);
  expect(new URL(rodri.headers()['location'], 'https://x').pathname).toBe('/blog');
  const scan = await request.get('/blog/scanning-while-dribbling', { maxRedirects: 0 });
  expect(scan.status()).toBe(308);
  expect(new URL(scan.headers()['location'], 'https://x').pathname).toBe('/capacities/perceptual');
});

test('three heading pages carry their heading-and-load section', async ({ page }) => {
  for (const slug of ['attacking-header-direct', 'defensive-heading-clear', 'aerial-balloon-discovery']) {
    await page.goto(`/training/${slug}`);
    await expect(page.locator('main'), slug).toContainText(/heading/i);
  }
});
