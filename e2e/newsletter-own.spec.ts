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

test('/newsletter is either closed honestly or takes an address by POST with its lines beside it', async ({ page, request }) => {
  expect((await request.get('/api/newsletter/subscribe')).status()).toBe(405);
  await page.goto('/newsletter');
  const form = page.locator('[data-newsletter-form]');
  // Production stays closed until NEWSLETTER_OPEN=1 (D-NEWS-01): then there is no form, and the API
  // refuses before writing anything. Staging, and production once opened, show the form.
  if (await page.getByText('Sign-ups open here soon.').isVisible()) {
    await expect(form).toHaveCount(0);
    const res = await request.post('/api/newsletter/subscribe', { data: { name: 'Nobody', email: 'nobody@example.invalid' } });
    expect(res.status(), 'a closed newsletter refuses and writes nothing').toBe(503);
    return;
  }
  await expect(form.locator('input[type="email"]')).toBeVisible();
  await expect(form.locator('#newsletter-name'), 'the consent record carries a name (Grt. 6. § (2))').toBeVisible();
  await expect(form.locator('a[href="/privacy"]')).toBeVisible();
  await expect(form).toContainText('For readers 16 and over');
  // LEGAL-02.6: what subscribing means, and why the name is kept.
  await expect(form).toContainText('By subscribing you agree that DField Kft. (StunpreX) emails you its newsletter');
  await expect(form).toContainText('We keep your name with the record of your consent, as Hungarian law requires');
});

test('the archive lists issues 1 to 3, and an issue reads as sent, without the old footer', async ({ page }) => {
  await page.goto('/newsletter');
  for (const n of [1, 2, 3]) await expect(page.locator('main')).toContainText(`#${n}:`);
  await page.goto('/newsletter/first-touch');
  await expect(page.locator('h1')).toHaveText('The first touch and the next action');
  const main = page.locator('main');
  await expect(main).toContainText('Picture a pass arriving with a defender close behind.');
  await expect(main, 'beehiiv\'s footer is not part of the issue').not.toContainText('You are receiving this because');
  await expect(main, 'no Markdown left in the page').not.toContainText('**');
});

test('the content lint refuses an issue without an Evaluator PASS', async () => {
  const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nl-'));
  fs.writeFileSync(path.join(dir, 'issue-99-test.md'),
    '---\nnumber: 99\nsubject: "A test"\npreview: "A preview"\nslug: "test"\nsend_date: "2026-10-01"\n---\n\nText.\n');
  let code = 0, out = '';
  try { out = execFileSync('node', ['scripts/content-lint.mjs', '--dir', dir], { encoding: 'utf8' }); }
  catch (e) { const x = e as { status?: number; stdout?: string; stderr?: string }; code = x.status ?? 1; out = `${x.stdout ?? ''}${x.stderr ?? ''}`; }
  expect(code, out).not.toBe(0);
  expect(out).toContain('newsletter without an Evaluator PASS');
  fs.writeFileSync(path.join(dir, 'issue-99-test__evaluator.md'), '**Verdict: PASS.**\n');
  expect(execFileSync('node', ['scripts/content-lint.mjs', '--dir', dir], { encoding: 'utf8' })).toContain('[content-lint] OK');
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
    await page.locator('#newsletter-name').fill('E2E Tester');
    await page.locator('#newsletter-email').fill(ADDRESS);
    await page.getByRole('button', { name: 'Subscribe' }).click();
    // Wait for the form's own answer, so the row exists before the next step reads or changes it.
    // Only the form's elements count: Next.js puts an invisible role="alert" route announcer on every
    // page, and waiting on any alert let the test run ahead of the sign-up.
    await expect(page.locator('[data-newsletter-result], [data-newsletter-form] [role="alert"]').first()).toBeVisible();
  };
  const linkIn = (text: string, path: string) => {
    const m = text.match(new RegExp(`https?://[^\\s]+${path}\\?token=[^\\s]+`));
    expect(m, `no ${path} link in the message`).toBeTruthy();
    return new URL(m![0]).pathname + new URL(m![0]).search;
  };

  test('a sign-up without a name is refused and writes nothing', async ({ request }) => {
    await helper(request, 'reset');
    const res = await request.post('/api/newsletter/subscribe', { data: { email: ADDRESS, name: '  ' } });
    expect(res.status()).toBe(400);
    expect((await helper(request, 'state')).subscriber).toBeNull();
    expect(await outbox(request)).toHaveLength(0);
  });

  test('subscribing writes a pending row and sends one confirmation', async ({ page, request }) => {
    await helper(request, 'reset');
    await subscribeOnPage(page);
    await expect(page.locator('[data-newsletter-result]')).toContainText('Check your inbox');
    const { subscriber } = await helper(request, 'state');
    expect(subscriber.status).toBe('pending');
    expect(subscriber.consent_requested_at).toBeTruthy();
    expect(subscriber.name).toBe('E2E Tester');
    const mail = await outbox(request);
    expect(mail).toHaveLength(1);
    expect(mail[0].subject).toContain('Confirm');
    expect(mail[0].headers.From).toContain('news@stunprex.com');
    expect(mail[0].text_body).toContain('Hello E2E Tester,');
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
    await expect(page.locator('[data-newsletter-result]')).toContainText('already subscribed');
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
    // LEGAL-02.6: the three footer parts, in the text and the HTML version.
    for (const body of [issue.text_body, issue.html_body]) {
      expect(body).toContain('or write to');
      expect(body).toContain('hello@stunprex.com');
      expect(body).toContain('DField Kft., 2120 Dunakeszi, Torony köz 5. 1. ajtó, Hungary');
    }
    expect(issue.text_body, 'the name given is used in the greeting').toContain('Hello E2E Tester,');
  });

  test('the unsubscribe link unsubscribes with one click', async ({ page, request }) => {
    const issue = (await outbox(request))[0];
    await page.goto(linkIn(issue.text_body, '/newsletter/unsubscribe'));
    await expect(page.locator('[data-landing="done"]')).toContainText('we have deleted your name and address');
    // LEGAL-02.6: unsubscribing deletes the row at once; no row holds the address.
    expect((await helper(request, 'state')).subscriber, 'the row is deleted on unsubscribe').toBeNull();
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
    expect((await helper(request, 'state')).subscriber, 'the row is deleted on unsubscribe').toBeNull();
  });

  test('the clean-ups delete an unconfirmed sign-up past its link and a bounce older than 90 days', async ({ request }) => {
    await helper(request, 'seed_old');
    const r = await helper(request, 'cleanup');
    expect(r.pending_deleted).toBeGreaterThanOrEqual(1);
    expect(r.bounced_deleted).toBeGreaterThanOrEqual(1);
    expect(r.test_rows_left, 'no row holds either test address').toBe(0);
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
