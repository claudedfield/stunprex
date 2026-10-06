import { test, expect } from '@playwright/test';

/**
 * Newsletter capture on the site's pages (D-WEB-13, LEGAL-01c; D-NEWS-01).
 *
 * Since D-NEWS-01 (28 Sep 2026) the newsletter is our own and beehiiv is retired: each block's
 * button leads to /newsletter, and nothing on our pages reaches beehiiv. No email address in any URL
 * (LEGAL-01c). The sign-up itself is tested in newsletter-own.spec.ts.
 *
 * SAFETY: every beehiiv host is still intercepted, so a stray link could never reach the old service.
 */

const CAPTURE_PAGES = [
  { route: '/', where: 'home' },
  { route: '/blog/soccer-dribbling-drills', where: 'end of a blog post' },
];

/** Block every beehiiv host so no test can reach the real service. */
async function sealBeehiiv(page: import('@playwright/test').Page) {
  const seen: string[] = [];
  for (const pattern of ['**://*.beehiiv.com/**', '**://beehiiv.com/**']) {
    await page.route(pattern, async (route) => {
      seen.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>intercepted</title><p>beehiiv intercepted by e2e</p>',
      });
    });
  }
  return seen;
}

for (const { route, where } of CAPTURE_PAGES) {
  test(`newsletter capture renders at ${where}, with no email field`, async ({ page }) => {
    await sealBeehiiv(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    const block = page.locator('[data-newsletter]').first();
    await expect(block, `no newsletter block at ${where}`).toBeVisible();
    const link = block.getByRole('link', { name: /subscribe/i });
    await expect(link, 'D-NEWS-01: our own page, not beehiiv').toHaveAttribute('href', /^\/newsletter\?from=/);
    await expect(link, 'LEGAL-01c: no email in the URL').not.toHaveAttribute('href', /email=/);
    await expect(page.locator('form[action*="beehiiv"]'), 'LEGAL-01c: no form posts an address').toHaveCount(0);
    await expect(block.locator('input'), 'LEGAL-01c: the address is typed on beehiiv, not here').toHaveCount(0);

    // LEGAL-01d and 01b, beside the action.
    await expect(block.locator('a[href="/privacy"]')).toBeVisible();
    await expect(block).toContainText('For readers 16 and over');
  });
}

test('no beehiiv script is loaded on our pages', async ({ page }) => {
  // The embed drops third-party cookies. If a script tag for beehiiv ever appears,
  // /cookies has silently become false.
  for (const { route } of CAPTURE_PAGES) {
    await sealBeehiiv(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('script[src*="beehiiv"]'),
      'a beehiiv script was added: this drops third-party cookies and breaks the /cookies claim',
    ).toHaveCount(0);
  }
});

test('the subscribe button leads to our own /newsletter page and nothing reaches beehiiv', async ({ page }) => {
  const reached = await sealBeehiiv(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-newsletter]').first().getByRole('link', { name: /subscribe/i }).click();
  await page.waitForURL('**/newsletter?from=*');
  expect(new URL(page.url()).searchParams.get('email'), 'LEGAL-01c: no address in the URL').toBeNull();
  expect(reached, 'D-NEWS-01: beehiiv is retired; nothing may reach it').toEqual([]);
});

test('end of a blog post is ONE card, with community as a text link', async ({ page }) => {
  // COO decision, D-WEB-13-FU: two stacked cards was clutter. The newsletter is
  // the primary distribution action; the community stays reachable from every
  // article (D-WEB-05's intent) but as quiet text, not a competing button.
  await sealBeehiiv(page);
  await page.goto('/blog/soccer-dribbling-drills', { waitUntil: 'domcontentloaded' });

  const cards = page.locator('article > div.rounded-xl');
  await expect(cards, 'the end-of-article block must be a single card').toHaveCount(1);

  // Exactly one primary action inside it, and it is the newsletter.
  await expect(cards.first().getByRole('link', { name: /subscribe/i })).toBeVisible();
  await expect(
    page.locator('a[href="/community"].btn-primary'),
    'the community link must not be a second primary button',
  ).toHaveCount(0);

  await expect(cards.first().locator('a[href="/community"]')).toHaveText(
    /bring a question to the community/i,
  );
});

test('/api/newsletter is retired and accepts no writes', async ({ request }) => {
  const res = await request.post('/api/newsletter', { data: { email: 'e2e@example.invalid' } });
  expect(res.status(), '/api/newsletter must not accept submissions').toBe(410);
});
