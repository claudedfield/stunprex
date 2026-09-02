import { test, expect } from '@playwright/test';
import { watchConsole } from './helpers';

/**
 * Item 2 — /training filters.
 *
 * Guards the LA-01 distribution fix shipped in D-WEB-09: the market searches in
 * U-notation ("U10", "U12") while the site publishes chronological ranges, so
 * the search box resolves U-notation to the matching canon band. If that
 * regresses, the two target queries stop finding content and nobody notices —
 * exactly the failure mode this test exists for.
 */

const RESULT_COUNT = /(\d+)\s+drills?/;

async function countFor(page: import('@playwright/test').Page, query: string) {
  const search = page.locator('#drill-search');
  await search.fill(query);
  // The list filters synchronously in React state; wait for the count to settle.
  await expect(page.locator('body')).toContainText(RESULT_COUNT);
  const text = await page.locator('body').innerText();
  return Number(text.match(/(\d+)\s+drills?\s+found/)?.[1] ?? text.match(RESULT_COUNT)?.[1] ?? '0');
}

test('U-notation search returns non-empty drill lists', async ({ page }) => {
  const console_ = watchConsole(page);
  await page.goto('/training');

  const unfiltered = await countFor(page, '');
  expect(unfiltered, 'drill library should not be empty').toBeGreaterThan(0);

  for (const query of ['U10', 'U12']) {
    const count = await countFor(page, query);
    expect(count, `"${query}" returned no drills`).toBeGreaterThan(0);
    expect(count, `"${query}" did not actually filter`).toBeLessThan(unfiltered);
    // Results must be real cards, not just a count.
    await expect(page.locator('a[href^="/training/"]').first()).toBeVisible();
  }

  expect(console_.errors).toEqual([]);
});

test('U10 and U12 resolve to the same band, and a nonsense query returns none', async ({ page }) => {
  await page.goto('/training');
  const u10 = await countFor(page, 'U10');
  const u12 = await countFor(page, 'U12');
  // Both sit inside B2 (9–12 Foundation), so they must select the same set.
  expect(u12, 'U10 and U12 should resolve to the same band').toBe(u10);

  const lower = await countFor(page, 'u10');
  expect(lower, 'U-notation matching must be case-insensitive').toBe(u10);

  const nonsense = await countFor(page, 'zzz-not-a-band');
  expect(nonsense, 'a nonsense query must not match everything').toBe(0);
});

test('band names render on the filters — no raw internal tags', async ({ page }) => {
  await page.goto('/training');

  // Canon (Vol 2 §10): publishing ranges without names leaves the pedagogy
  // invisible. All five band names must be visible on the facet chips.
  for (const name of ['Discovery', 'Foundation', 'Development', 'Specialisation', 'Mastery']) {
    await expect(page.getByRole('button', { name: new RegExp(name) }).first()).toBeVisible();
  }

  // U-notation aliases render as labels too (indexable, not just matchable).
  await expect(page.getByRole('button', { name: /U9–U12/ })).toBeVisible();

  // No raw internal tags leaking into the UI.
  const body = await page.locator('body').innerText();
  expect(body, 'raw conviction tags must never render').not.toMatch(/Conviction\s+\d+/);
  expect(body, 'raw band identifiers must not be the visible label').not.toMatch(/\bB[1-5]\s*·/);
});

test('capacity filter narrows the list', async ({ page }) => {
  await page.goto('/training');
  const before = await countFor(page, '');
  await page.getByRole('button', { name: 'Perceptual', exact: true }).click();
  await expect(page.locator('body')).toContainText(RESULT_COUNT);
  const after = Number(
    (await page.locator('body').innerText()).match(/(\d+)\s+drills?\s+found/)?.[1] ?? '0',
  );
  expect(after).toBeGreaterThan(0);
  expect(after).toBeLessThan(before);
});
