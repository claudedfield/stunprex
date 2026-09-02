import { test, expect } from '@playwright/test';

/**
 * Item 4 — newsletter form.
 *
 * SCOPE NOTE FOR THE COO — the brief asks for a test that the newsletter form
 * "renders and submits against a mocked endpoint". No newsletter form currently
 * renders anywhere on the site, so that test has nothing to bind to.
 *
 * This is the recorded state, not a defect: D-WEB-05 replaced both capture
 * points per the D2/D8 "newsletter deferred" decision — the home-page section
 * became <JoinCommunity>, and the end-of-article block on blog posts became a
 * community CTA. `NewsletterCapture` and `EmailCaptureForm` still exist in the
 * repo but are imported by nothing; `/api/newsletter` still exists and still
 * writes to Postgres. LIVE_STATE §5 confirms the Beehiiv stand-up has not
 * happened, so the form is expected back only when distribution starts.
 *
 * The brief forbids production changes, so no form was added. Instead:
 *   1. an ACTIVE test pins the current decided state, and will fail the moment
 *      a capture form appears — which is either the Beehiiv work landing (good,
 *      flip the test below on) or an undecided regression (bad, catch it now);
 *   2. the real render-and-submit test is written in full and skipped, so it
 *      activates by deleting one `.skip` once a form ships.
 */

const CAPTURE_ROUTES = ['/', '/blog/soccer-dribbling-drills', '/community'];

test('newsletter capture is absent sitewide (D2/D8 deferred — remove when Beehiiv lands)', async ({
  page,
}) => {
  for (const route of CAPTURE_ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('input[type="email"]'),
      `${route} now renders an email capture field. If the Beehiiv newsletter has ` +
        `been stood up, enable the skipped submit test below and delete this one. ` +
        `If not, a capture form has appeared without a decision.`,
    ).toHaveCount(0);
  }
});

test('the community CTA stands in place of the old newsletter block', async ({ page }) => {
  // What actually replaced the capture form — worth pinning so the swap is not
  // silently undone.
  await page.goto('/');
  await expect(page.getByRole('link', { name: /join the community/i }).first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// Ready to activate: delete `.skip` when a newsletter form ships.
// The endpoint is intercepted, so this NEVER reaches the real Postgres-backed
// /api/newsletter route from CI.
// ---------------------------------------------------------------------------
test.skip('newsletter form renders and submits against a mocked endpoint', async ({ page }) => {
  let submitted: { email?: string } | null = null;

  await page.route('**/api/newsletter', async (route) => {
    submitted = route.request().postDataJSON?.() ?? null;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto('/');

  const email = page.locator('input[type="email"]').first();
  await expect(email).toBeVisible();
  await email.fill('e2e@example.invalid');
  await page.getByRole('button', { name: /subscribe|sign up|join/i }).first().click();

  // The request was intercepted — the real capture backend was never touched.
  await expect.poll(() => submitted?.email).toBe('e2e@example.invalid');
  await expect(page.getByText(/you.re on the list|thank|confirm/i).first()).toBeVisible();
});
