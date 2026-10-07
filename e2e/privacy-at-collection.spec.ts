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

// LEGAL-01a: both sign-in pages name the Terms of Use and the Privacy Notice beside the action,
// and sign-up collects no newsletter consent it cannot act on.
for (const route of ['/auth/sign-in', '/auth/sign-up']) {
  test(`${route} links the Terms of Use and the Privacy Notice`, async ({ page }) => {
    await page.goto(route);
    const main = page.locator('main');
    await expect(main).toContainText('Creating an account means accepting our');
    await expect(main.locator('a[href="/terms"]').first()).toBeVisible();
    await expect(main.locator('a[href="/privacy"]').first()).toBeVisible();
  });
}

test('/auth/sign-up shows no newsletter box and sets no cookie on submit', async ({ page, context }) => {
  // The sign-in request itself is stopped, so no link is mailed to anyone.
  await page.route('**/*', (route) =>
    route.request().method() === 'POST' && route.request().headers()['next-action'] ? route.abort() : route.continue());
  await page.goto('/auth/sign-up');
  await expect(page.locator('main input[type="checkbox"]')).toHaveCount(0);
  await expect(page.locator('main')).toContainText('No password. We send a one-time sign-in code.');
  await page.locator('#signup-email').fill('e2e@stunprex.test');
  await page.getByRole('button', { name: /Continue with email/ }).click();
  await page.waitForTimeout(500);
  const names = (await context.cookies()).map((c) => c.name);
  expect(names.filter((n) => !/authjs/i.test(n)), 'no cookie other than the sign-in system').toEqual([]);
  expect(names).not.toContain('signup_newsletter');
});
