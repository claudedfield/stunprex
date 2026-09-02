import { test, expect } from '@playwright/test';
import { GAME_SLUGS, watchConsole } from './helpers';

/**
 * Item 3 — the ten games.
 *
 * Each game route loads, the game root mounts, and one basic interaction fires
 * without console errors. Only three of the ten use <canvas>; the rest are
 * DOM-driven, so "the game mounted" is asserted structurally instead: the
 * GameShell frame plus at least one interactive control inside <main>.
 * Header and Footer sit outside <main>, so controls there belong to the game.
 */
for (const slug of GAME_SLUGS) {
  test(`game ${slug} loads and responds to interaction`, async ({ page }) => {
    const console_ = watchConsole(page);

    const response = await page.goto(`/games/${slug}`, { waitUntil: 'domcontentloaded' });
    expect(response!.status()).toBe(200);

    // Page frame.
    await expect(page.locator('h1')).toHaveCount(1);

    // GameShell mounted — the honesty frame ships on every game by contract.
    await expect(page.getByText('What this trains')).toBeVisible();

    // Game root mounted: a canvas, or interactive controls for the DOM games.
    const controls = page.locator('main button');
    const canvas = page.locator('main canvas');
    const controlCount = await controls.count();
    const canvasCount = await canvas.count();
    expect(
      controlCount + canvasCount,
      `${slug} rendered no game root (no canvas, no controls)`,
    ).toBeGreaterThan(0);

    // One basic interaction: click the first enabled control and let it settle.
    const firstEnabled = controls.filter({ hasNot: page.locator('[disabled]') }).first();
    if (await firstEnabled.count()) {
      await firstEnabled.click();
      await page.waitForTimeout(600);
    }

    expect(console_.errors, `${slug} logged console errors`).toEqual([]);
  });
}

test('games index lists every live game', async ({ page }) => {
  await page.goto('/games');
  for (const slug of GAME_SLUGS) {
    await expect(
      page.locator(`a[href="/games/${slug}"]`).first(),
      `games index is missing ${slug}`,
    ).toBeVisible();
  }
});
