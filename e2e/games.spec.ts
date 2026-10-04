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

/**
 * LEGAL-02.2: a game's best score lives in page memory only. Nothing is written to the device, and a
 * best-score key left by an earlier visit is removed. Checked two ways: in the browser, every write to
 * storage is counted on each game; in the source, no game file may touch storage at all, so a finished
 * game with a new best has no path to the device either.
 */
for (const slug of GAME_SLUGS) {
  test(`game ${slug} stores nothing on the device and clears an old best score`, async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __writes: string[] };
      w.__writes = [];
      // A best score as an earlier version of the site would have left it.
      if (!sessionStorage.getItem('__seeded')) {
        Storage.prototype.setItem.call(sessionStorage, '__seeded', '1');
        Storage.prototype.setItem.call(localStorage, 'stunprex_koipond_best', '7');
      }
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        w.__writes.push(k);
        return real.call(this, k, v);
      };
    });
    await page.goto(`/games/${slug}`);
    const firstEnabled = page.locator('main button').filter({ hasNot: page.locator('[disabled]') }).first();
    if (await firstEnabled.count()) {
      await firstEnabled.click();
      await page.waitForTimeout(600);
    }
    const state = () => page.evaluate(() => ({
      keys: Object.keys(localStorage), writes: (window as unknown as { __writes: string[] }).__writes }));
    expect(await state(), `${slug} wrote to or left something in local storage`).toEqual({ keys: [], writes: [] });
    await page.reload();
    expect(await state(), `${slug} after a reload`).toEqual({ keys: [], writes: [] });
  });
}

test('no game source touches local or session storage', async () => {
  const fs = await import('node:fs'); const path = await import('node:path');
  const dir = path.join(process.cwd(), 'components', 'games');
  const offenders = fs.readdirSync(dir).filter((f) => /\.tsx?$/.test(f))
    .filter((f) => /localStorage|sessionStorage/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  expect(offenders, 'a game reads or writes browser storage (LEGAL-02.2)').toEqual([]);
});
