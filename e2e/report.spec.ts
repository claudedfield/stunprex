import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * LEGAL-03.2: the report form, open to anyone, followed end to end on staging: a report with no
 * name and no address reaches a moderator, who records a decision; a report with an address gets
 * the acknowledgement and the outcome. Staging captures the mail and sends none.
 */
const secret = process.env.E2E_SIGNIN_SECRET ?? '';
const ADDRESS = 'e2e-report@stunprex.test';
const SEED_QUESTION = '/community/should-i-worry-my-9-year-old-only-uses-their-strong-foot';

test('the footer and every post link to the report form, signed out', async ({ page }) => {
  await page.goto(SEED_QUESTION);
  await expect(page.locator('footer a[href="/report"]')).toBeVisible();
  await expect(page.locator('main [data-report-link="question"]')).toHaveCount(1);
  const answer = page.locator('main [data-report-link="answer"]').first();
  await expect(answer).toBeVisible();
  const href = await answer.getAttribute('href');
  expect(href).toContain('type=answer');
  expect(decodeURIComponent(href!)).toContain(`${SEED_QUESTION}#answer-`);
});

test('/report opens for anyone and is not indexed', async ({ page }) => {
  const res = await page.goto('/report');
  expect(res?.status()).toBe(200);
  expect(new URL(page.url()).pathname, 'no sign-in is asked for').toBe('/report');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('[data-report-form]')).toContainText('I believe, in good faith, that what I report is accurate and complete.');
  await expect(page.locator('[data-report-form]')).toContainText('This is about the sexual abuse or exploitation of a child.');
  await expect(page.locator('[data-report-form]')).toContainText('so that we can answer you');
});

test.describe('a report followed to a moderator (staging)', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!secret, 'runs on staging only');

  const run = Date.now();
  const ANON = `e2e-report-marker anonymous ${run}: this answer describes something that should be looked at.`;
  const NAMED = `e2e-report-marker named ${run}: this question looks like an advertisement.`;

  const helper = async (request: APIRequestContext, action: string) => {
    const res = await request.post('/api/test/report', { headers: { 'x-e2e-secret': secret }, data: { action } });
    expect(res.status()).toBe(200);
    return res.json();
  };
  const openFromAnswer = async (page: Page) => {
    await page.goto(SEED_QUESTION, { waitUntil: 'load', timeout: 60_000 });
    await page.locator('main [data-report-link="answer"]').first().click();
    await page.waitForURL('**/report?**');
    await page.waitForLoadState('load');
    await expect(page.locator('#report-url')).toHaveValue(new RegExp(`^${SEED_QUESTION}#answer-`));
  };

  test('with no name, no address and the child-safety box, the report is stored and nothing asks for contact details', async ({ page, request }) => {
    await helper(request, 'reset');
    await openFromAnswer(page);
    await page.locator('#report-what').fill(ANON);
    await page.locator('#report-child').check();
    await expect(page.locator('[data-report-contact="visitor"]')).toContainText('(optional)');
    await page.locator('#report-good-faith').check();
    await page.getByRole('button', { name: 'Send report' }).click();
    await expect(page.locator('[data-report-result="sent"]')).toBeVisible();

    const { reports } = await helper(request, 'state');
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ status: 'open', child_safety: true, target_type: 'answer', has_member: false, has_name: false, has_email: false, good_faith: true });
    const { messages } = await helper(request, 'mail');
    expect(messages).toHaveLength(1);
    expect(messages[0].to_address).toBe('hello@stunprex.com');
    expect(messages[0].text_body, 'the notice carries the address of the item').toContain(`${SEED_QUESTION}#answer-`);
    expect(messages[0].text_body, 'and nothing of what was written').not.toContain('anonymous');
  });

  test('without the child-safety box, a visitor is asked for a name and an address; without the good-faith box nothing is stored', async ({ page, request }) => {
    await openFromAnswer(page);
    await page.locator('#report-what').fill(NAMED);
    await page.locator('#report-good-faith').check();
    await page.getByRole('button', { name: 'Send report' }).click();
    await expect(page.locator('[data-report-result="error"]')).toContainText('so that we can answer you');
    await expect(page.locator('#report-what'), 'what was typed survives the error').toHaveValue(NAMED);
    await page.locator('#report-name').fill('E2E Reporter');
    await page.locator('#report-email').fill(ADDRESS);
    await page.locator('#report-good-faith').uncheck();
    await page.getByRole('button', { name: 'Send report' }).click();
    await expect(page.locator('[data-report-result="error"]')).toContainText('tick the box');
    expect((await helper(request, 'state')).reports).toHaveLength(1);
  });

  test('a report with an address is acknowledged at once', async ({ page, request }) => {
    await page.goto(`/report?type=question&id=seed&url=${encodeURIComponent(SEED_QUESTION)}`, { waitUntil: 'load', timeout: 60_000 });
    await page.locator('#report-what').fill(NAMED);
    await page.locator('#report-name').fill('E2E Reporter');
    await page.locator('#report-email').fill(ADDRESS);
    await page.locator('#report-good-faith').check();
    await page.getByRole('button', { name: 'Send report' }).click();
    await expect(page.locator('[data-report-result="sent"]')).toBeVisible();
    const { messages } = await helper(request, 'mail');
    const ack = messages.filter((m: { to_address: string }) => m.to_address === ADDRESS);
    expect(ack).toHaveLength(1);
    expect(ack[0].subject).toBe('We have received your report');
    expect(ack[0].text_body).toContain(`https://stunprex.com${SEED_QUESTION}`);
    expect(ack[0].headers['Reply-To']).toBe('hello@stunprex.com');
  });

  test('a filled trap field is answered like a report and stores nothing', async ({ page, request }) => {
    await page.goto(`/report?type=question&id=seed&url=${encodeURIComponent(SEED_QUESTION)}`, { waitUntil: 'load', timeout: 60_000 });
    await page.locator('#report-what').fill(`${NAMED} (trap)`);
    await page.locator('#report-name').fill('E2E Reporter');
    await page.locator('#report-email').fill(ADDRESS);
    await page.locator('#report-website').fill('https://example.invalid', { force: true });
    await page.locator('#report-good-faith').check();
    await page.getByRole('button', { name: 'Send report' }).click();
    await expect(page.locator('[data-report-result="sent"]')).toBeVisible();
    expect((await helper(request, 'state')).reports).toHaveLength(2);
  });

  test('both reports are in the moderator queue; a decision is recorded with a reason, and the outcome is mailed where there is an address', async ({ page, request }) => {
    const signIn = (role: string) => page.request.post('/api/test/sign-in', { headers: { 'x-e2e-secret': secret }, data: { terms: 'current', role } });
    expect((await signIn('moderator')).status()).toBe(200);
    try {
      await page.goto('/community/moderation', { waitUntil: 'load', timeout: 60_000 });
      const anon = page.locator('[data-report-row]').filter({ hasText: `anonymous ${run}` });
      const named = page.locator('[data-report-row]').filter({ hasText: `named ${run}` });
      await expect(anon).toHaveCount(1);
      await expect(named).toHaveCount(1);
      await expect(anon).toHaveAttribute('data-child-safety', 'yes');
      await expect(anon.locator('[data-report-from]')).toContainText('gave no name');
      await expect(anon.locator('[data-report-from]')).toContainText('nobody to write to');
      await expect(page.locator('[data-report-row]').first(), 'child-safety reports lead the queue').toHaveAttribute('data-child-safety', 'yes');

      // A decision needs a reason.
      await anon.locator('select[name="decision"]').selectOption('left');
      await anon.locator('textarea[name="reason"]').fill('short');
      await anon.getByRole('button', { name: 'Record decision' }).click();
      await expect(anon.locator('[role="alert"]')).toContainText('reason');
      await anon.locator('textarea[name="reason"]').fill('The answer gives ordinary coaching advice and breaks no rule.');
      await anon.getByRole('button', { name: 'Record decision' }).click();
      await expect(page.locator('[data-report-row]').filter({ hasText: `anonymous ${run}` })).toHaveCount(0);

      await named.locator('select[name="decision"]').selectOption('removed');
      await named.locator('textarea[name="reason"]').fill('The post advertised a paid service, against the community rules.');
      await named.getByRole('button', { name: 'Record decision' }).click();
      await expect(page.locator('[data-report-row]').filter({ hasText: `named ${run}` })).toHaveCount(0);

      const { reports } = await helper(request, 'state');
      const byType = (t: string) => reports.find((r: { target_type: string }) => r.target_type === t);
      expect(byType('answer')).toMatchObject({ status: 'dismissed', decision: 'left', outcome_sent: false });
      expect(byType('question')).toMatchObject({ status: 'actioned', decision: 'removed', outcome_sent: true });
      const outcome = (await helper(request, 'mail')).messages.filter((m: { subject: string }) => m.subject === 'Your report about content on StunpreX');
      expect(outcome).toHaveLength(1);
      expect(outcome[0].to_address).toBe(ADDRESS);
      expect(outcome[0].text_body).toContain('We have removed it.');
      expect(outcome[0].text_body).toContain('reply to this email and a person will look again');
      expect(outcome[0].text_body).toContain('NMHH (nmhh.hu)');
    } finally {
      await signIn('user');
      await helper(request, 'reset');
    }
  });
});
