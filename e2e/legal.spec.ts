import { test, expect } from '@playwright/test';
import { CONSENT_PATTERNS, watchConsole } from './helpers';

/**
 * Item 5 — legal pages (D-WEB-08).
 *
 * The entity fields were verified against the official NAV data sheet and
 * owner-confirmed. They are the one thing on the site that is legally load
 * bearing, so they are asserted literally, character for character.
 */

const LEGAL_ROUTES = ['/imprint', '/privacy', '/cookies', '/terms'] as const;

for (const route of LEGAL_ROUTES) {
  test(`${route} carries a last-updated date`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByText(/Last updated/i)).toBeVisible();
    // Rendered as a semantic <time> so the date is machine-readable.
    await expect(page.locator('time[datetime]')).toHaveCount(1);
    // LEGAL-00: the hotfix date on all four pages.
    await expect(page.locator('time[datetime]')).toHaveAttribute('datetime', '2026-09-24');
  });
}

test('/imprint carries the verified entity fields exactly', async ({ page }) => {
  const console_ = watchConsole(page);
  await page.goto('/imprint');

  const main = page.locator('main');
  // Company registration, tax and VAT numbers — NAV-verified, owner-confirmed.
  await expect(main, 'company registration number').toContainText('13-09-242182');
  await expect(main, 'tax number').toContainText('32876217-2-13');
  await expect(main, 'EU VAT number').toContainText('HU32876217');

  // English name order. "Mező Dezső" (Hungarian order) is a regression.
  await expect(main, 'managing director name').toContainText('Dezső Mező');
  await expect(main).not.toContainText('Mező Dezső');

  // Registered seat and hosting disclosure.
  await expect(main).toContainText('2120 Dunakeszi, Torony köz 5. 1. ajtó');
  await expect(main).toContainText('Vercel Inc.');

  // Contact is a real mailto link, not plain text.
  await expect(page.locator('a[href="mailto:hello@stunprex.com"]').first()).toBeVisible();

  expect(console_.errors).toEqual([]);
});

test('/privacy names the controller, sub-processors and GDPR rights', async ({ page }) => {
  await page.goto('/privacy');
  const main = page.locator('main');
  await expect(main).toContainText('DField Kft.');
  await expect(main).toContainText('Beehiiv');
  await expect(main).toContainText(/Art\. 6\(1\)\(a\) GDPR/);
  await expect(main).toContainText(/NAIH/);
  await expect(page.locator('a[href="mailto:hello@stunprex.com"]').first()).toBeVisible();
});

test('/cookies says the site uses no analytics or tracking (LEGAL-00)', async ({ page }) => {
  await page.goto('/cookies');
  const main = page.locator('main');
  await expect(main).toContainText('We use no analytics or tracking at present.');
  await expect(main).not.toContainText(/cookieless/i);
});

test('the age passages read as LEGAL-00 set them', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('main')).toContainText('People aged 16 or over may create their own account.');
  await expect(page.locator('main')).not.toContainText(/verifiable parental consent/i);
  await page.goto('/terms');
  await expect(page.locator('main')).toContainText('You may create an account if you are 16 or older');
  await expect(page.locator('main')).not.toContainText(/Minors require parental consent/i);
});

test('no Vercel analytics or speed-insights script is requested (owner decision, 24 Sep)', async ({ page }) => {
  // Analytics stay off until the opt-in control ships (LEGAL-01f); /cookies says so.
  const hits: string[] = [];
  page.on('request', (r) => {
    if (/\/_vercel\/(insights|speed-insights)\/|va\.vercel-scripts\.com/.test(r.url())) hits.push(r.url());
  });
  for (const route of ['/', '/cookies', '/privacy', '/community', '/blog/soccer-dribbling-drills']) {
    await page.goto(route, { waitUntil: 'load' });
  }
  expect(hits, 'an analytics or speed-insights script was requested').toEqual([]);
});

test('no cookie-consent banner on any legal page, and no cookies are set', async ({
  page,
  context,
}) => {
  for (const route of LEGAL_ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const body = await page.locator('body').innerText();
    for (const pattern of CONSENT_PATTERNS) {
      expect(body, `${route} appears to show a cookie-consent banner`).not.toMatch(pattern);
    }
  }

  // /cookies says the site uses no analytics or tracking. Hold the page to that claim:
  // a first-party tracking cookie here would make the published policy false.
  const cookies = await context.cookies();
  const tracking = cookies.filter((c) => !/^__Host-|^__Secure-|authjs|csrf/i.test(c.name));
  expect(
    tracking.map((c) => c.name),
    'a non-essential cookie was set — /cookies says the site sets none',
  ).toEqual([]);
});
