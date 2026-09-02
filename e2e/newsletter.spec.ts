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

test('/api/newsletter is retired and accepts no writes', async ({ request }) => {
  const res = await request.post('/api/newsletter', { data: { email: 'e2e@example.invalid' } });
  expect(res.status(), '/api/newsletter must not accept submissions').toBe(410);
});
