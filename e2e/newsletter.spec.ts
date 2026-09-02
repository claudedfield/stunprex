import { test, expect } from '@playwright/test';

/**
 * Newsletter capture — beehiiv wiring (D-WEB-13).
 *
 * Flipped from the D-WEB-10 absence-assertion now that beehiiv is live. Capture is
 * PATTERN B: a first-party GET form to beehiiv's hosted subscribe page, with no
 * beehiiv script on any StunpreX page. That choice came from measurement, and
 * these tests hold the line on it.
 *
 * SAFETY: every beehiiv host is intercepted, so a test run can never create a real
 * subscription. Nothing here submits to a live capture backend.
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
  test(`newsletter capture renders at ${where}`, async ({ page }) => {
    await sealBeehiiv(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    const email = page.locator('input[type="email"]').first();
    await expect(email, `no capture field at ${where}`).toBeVisible();

    // Pattern B: the form must GET to beehiiv's hosted page, not to our own API.
    const form = page.locator('form[action*="beehiiv.com"]').first();
    await expect(form).toHaveAttribute('method', /get/i);
    await expect(form).toHaveAttribute('action', /stunprex\.beehiiv\.com\/subscribe/);

    await expect(page.getByRole('button', { name: /subscribe/i }).first()).toBeVisible();
  });
}

test('no beehiiv script is loaded on our pages', async ({ page }) => {
  // The embed drops third-party cookies (see EmailCaptureForm). If a script tag
  // for beehiiv ever appears, /cookies has silently become false.
  for (const { route } of CAPTURE_PAGES) {
    await sealBeehiiv(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('script[src*="beehiiv"]'),
      'a beehiiv script was added: this drops third-party cookies and breaks the /cookies claim',
    ).toHaveCount(0);
  }
});

test('capture submits to beehiiv with the address, and never to our own API', async ({ page }) => {
  const reached = await sealBeehiiv(page);

  let ownApiHit = false;
  await page.route('**/api/newsletter', async (route) => {
    ownApiHit = true;
    await route.fulfill({ status: 410, body: '{"ok":false}' });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').first().fill('e2e@example.invalid');
  await page.getByRole('button', { name: /subscribe/i }).first().click();
  await page.waitForLoadState('domcontentloaded');

  const target = reached.find((u) => u.includes('/subscribe'));
  expect(target, 'submitting did not reach the beehiiv subscribe page').toBeTruthy();

  const params = new URL(target!).searchParams;
  expect(params.get('email'), 'the typed address must be carried to beehiiv').toBe(
    'e2e@example.invalid',
  );
  // Attribution without beehiiv's third-party attribution.js.
  expect(params.get('utm_source')).toBe('stunprex.com');

  expect(ownApiHit, 'capture must not post to the retired /api/newsletter').toBe(false);
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
  await expect(cards.first().getByRole('button', { name: /subscribe/i })).toBeVisible();
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
