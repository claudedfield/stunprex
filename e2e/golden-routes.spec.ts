import { test, expect } from '@playwright/test';
import { GOLDEN_ROUTES, CONSENT_PATTERNS, watchConsole } from './helpers';

/**
 * Item 1 — the 19 golden routes.
 * Each: HTTP 200, exactly one <h1>, no console errors, footer renders.
 * Plus the sitewide no-consent-banner guard (item 5).
 */
for (const route of GOLDEN_ROUTES) {
  test(`golden route ${route}`, async ({ page }) => {
    const console_ = watchConsole(page);

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `no response for ${route}`).not.toBeNull();
    expect(response!.status(), `${route} did not return 200`).toBe(200);

    // Exactly one h1 — heading hierarchy is a real accessibility and SEO contract.
    await expect(page.locator('h1'), `${route} must have exactly one <h1>`).toHaveCount(1);
    await expect(page.locator('h1')).not.toBeEmpty();

    // Footer renders, carrying the DField Kft. copyright (the entity attribution
    // that CLAUDE.md §10 says belongs in the footer and on /imprint only).
    const footer = page.locator('footer');
    await expect(footer, `${route} is missing its footer`).toBeVisible();
    await expect(footer).toContainText('DField Kft.');

    // No cookie-consent banner: the site is cookieless by design.
    const bodyText = await page.locator('body').innerText();
    for (const pattern of CONSENT_PATTERNS) {
      expect(bodyText, `${route} appears to show a cookie-consent banner`).not.toMatch(pattern);
    }

    expect(console_.errors, `${route} logged console errors`).toEqual([]);
  });
}

test('404 page renders and is not a soft-200', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist-e2e', {
    waitUntil: 'domcontentloaded',
  });
  expect(response!.status()).toBe(404);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('footer')).toContainText('DField Kft.');
});

/**
 * D-WEB-20: a post may carry a shorter `metaTitle` for the search snippet while
 * the H1 keeps the full headline. This asserts the two are actually different on
 * the weak-foot post, so a regression that dropped the field back to `title`
 * would fail rather than pass quietly.
 */
test('metaTitle is read into <title> and the H1 keeps the full headline', async ({ page }) => {
  const H1 = 'Weak foot dribbling drills: a progression that holds up under pressure';
  const META = 'Weak foot dribbling drills that hold up under pressure';

  await page.goto('/blog/weak-foot-dribbling-drills', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText(H1);
  const title = await page.title();
  expect(title, 'the <title> must come from metaTitle').toContain(META);
  expect(title, 'the <title> must not be the longer H1').not.toContain(H1);
});
