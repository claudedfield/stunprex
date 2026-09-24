import { test, expect } from '@playwright/test';

/**
 * LEGAL-01d: every place that takes personal data carries a link to the Privacy Notice
 * beside its action. This covers the public forms; the signed-in forms (profile edit,
 * posting, reporting) are covered once a preview can sign in (decision T).
 */
for (const route of ['/auth/sign-in', '/auth/sign-up']) {
  test(`${route}: the privacy link sits inside the form`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('form a[href="/privacy"]').first()).toBeVisible();
  });
}
