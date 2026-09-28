import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * D-NEWS-01: our own newsletter, end to end on staging. Staging never sends: its mail is captured
 * in a table and read back through /api/test/newsletter, and only e2e@stunprex.test is accepted
 * (COO-DEV-0016). These tests share that one address, so they run in order.
 */
const secret = process.env.E2E_SIGNIN_SECRET ?? '';
const ADDRESS = 'e2e@stunprex.test';

test('the newsletter test route does not answer without its secret', async ({ request }) => {
  expect((await request.post('/api/test/newsletter', { data: { action: 'state' } })).status()).toBe(404);
});

test('/newsletter takes an address by POST only, with the privacy and age lines beside it', async ({ page, request }) => {
  expect((await request.get('/api/newsletter/subscribe')).status()).toBe(405);
  await page.goto('/newsletter');
  const form = page.locator('[data-newsletter-form]');
  await expect(form.locator('input[type="email"]')).toBeVisible();
  await expect(form.locator('a[href="/privacy"]')).toBeVisible();
  await expect(form).toContainText('For readers 16 and over');
});

test.describe('subscribe, confirm, unsubscribe (staging)', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!secret, 'runs on staging only');

  const helper = async (request: APIRequestContext, action: string) => {
    const res = await request.post('/api/test/newsletter', { headers: { 'x-e2e-secret': secret }, data: { action } });
    expect(res.status()).toBe(200);
    return res.json();
  };
  const outbox = async (request: APIRequestContext) => (await helper(request, 'outbox')).messages as Array<{
    subject: string; headers: Record<string, string>; text_body: string; html_body: string }>;
  const subscribeOnPage = async (page: Page) => {
    await page.goto('/newsletter');
    await page.locator('#newsletter-email').fill(ADDRESS);
    await page.getByRole('button', { name: 'Subscribe' }).click();
    // Wait for the answer, so the row exists before the next step reads or changes it.
    await expect(page.locator('[data-newsletter-result], [role="alert"]').first()).toBeVisible();
  };
  const linkIn = (text: string, path: string) => {
    const m = text.match(new RegExp(`https?://[^\\s]+${path}\\?token=[^\\s]+`));
    expect(m, `no ${path} link in the message`).toBeTruthy();
    return new URL(m![0]).pathname + new URL(m![0]).search;
  };

  test('subscribing writes a pending row and sends one confirmation', async ({ page, request }) => {
    await helper(request, 'reset');
    await subscribeOnPage(page);
    await expect(page.locator('[data-newsletter-result]')).toContainText('Check your inbox');
    const { subscriber } = await helper(request, 'state');
    expect(subscriber.status).toBe('pending');
    expect(subscriber.consent_requested_at).toBeTruthy();
    const mail = await outbox(request);
    expect(mail).toHaveLength(1);
    expect(mail[0].subject).toContain('Confirm');
    expect(mail[0].headers.From).toContain('news@stunprex.com');
  });

  test('subscribing again within 24 hours sends nothing more', async ({ page, request }) => {
    await subscribeOnPage(page);
    await expect(page.locator('[data-newsletter-result]')).toContainText('Check your inbox');
    expect(await outbox(request)).toHaveLength(1);
  });

  test('the confirmation link confirms, and a second sign-up makes no second row', async ({ page, request }) => {
    await page.goto(linkIn((await outbox(request))[0].text_body, '/newsletter/confirm'));
    await expect(page.locator('[data-landing="done"]')).toContainText('You are subscribed');
    const { subscriber } = await helper(request, 'state');
    expect(subscriber.status).toBe('confirmed');
    expect(subscriber.confirmed_at).toBeTruthy();
    await subscribeOnPage(page);
    await expect(page.locator('[role="alert"], [data-newsletter-result]').first()).toContainText('already subscribed');
    expect((await helper(request, 'state')).subscriber.rows).toBe(1);
  });

  test('an issue carries one-click unsubscribe headers and link, and no tracking', async ({ request }) => {
    expect((await helper(request, 'send_issue')).result).toMatch(/^sent/);
    const issue = (await outbox(request))[0];
    expect(issue.subject).toBe('E2E test issue');
    expect(issue.headers['List-Unsubscribe']).toMatch(/^<https:\/\/[^>]+\/api\/newsletter\/unsubscribe\?token=/);
    expect(issue.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(issue.headers['Reply-To']).toBe('hello@stunprex.com');
    expect(issue.html_body, 'no image, so no pixel').not.toMatch(/<img/i);
    expect(issue.html_body, 'no script').not.toMatch(/<script/i);
    expect(issue.html_body, 'links are not rewritten').toContain('href="https://stunprex.com/training"');
    expect(issue.text_body).toContain('/newsletter/unsubscribe?token=');
  });

  test('the unsubscribe link unsubscribes with one click', async ({ page, request }) => {
    const issue = (await outbox(request))[0];
    await page.goto(linkIn(issue.text_body, '/newsletter/unsubscribe'));
    await expect(page.locator('[data-landing="done"]')).toContainText('You are unsubscribed');
    const { subscriber } = await helper(request, 'state');
    expect(subscriber.status).toBe('unsubscribed');
    expect(subscriber.unsubscribed_at).toBeTruthy();
    expect((await helper(request, 'send_issue')).result, 'an unsubscribed address is not mailed').toMatch(/nothing sent/);
  });

  test('the List-Unsubscribe-Post header unsubscribes with one POST', async ({ page, request }) => {
    await helper(request, 'reset');
    await subscribeOnPage(page);
    await page.goto(linkIn((await outbox(request))[0].text_body, '/newsletter/confirm'));
    await expect(page.locator('[data-landing="done"]')).toBeVisible();
    await helper(request, 'send_issue');
    const target = (await outbox(request))[0].headers['List-Unsubscribe'].match(/<(https:[^>]+)>/)![1];
    const res = await request.post(new URL(target).pathname + new URL(target).search, {
      headers: { 'content-type': 'application/x-www-form-urlencoded' }, data: 'List-Unsubscribe=One-Click' });
    expect(res.status()).toBe(200);
    expect((await helper(request, 'state')).subscriber.status).toBe('unsubscribed');
  });

  test('an expired confirmation link shows the form again', async ({ page, request }) => {
    await helper(request, 'reset');
    await subscribeOnPage(page);
    await helper(request, 'expire');
    await page.goto(linkIn((await outbox(request))[0].text_body, '/newsletter/confirm'));
    await expect(page.locator('[data-landing="expired"]')).toContainText('expired');
    await expect(page.locator('[data-landing="expired"] [data-newsletter-form]')).toBeVisible();
    expect((await helper(request, 'state')).subscriber.status).toBe('pending');
    await helper(request, 'reset');
  });
});
