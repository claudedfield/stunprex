import { test, expect } from '@playwright/test';
import { GAMES } from '../lib/games/registry';

/** The live window of 22 Oct 2026: COO-DEV-0058 items 3 and 4, QUALITY-0019 (f), LEGAL-0024, LEGAL-0036, LEGAL-0038. */

test('the games registry names no conviction number and no player', () => {
  for (const g of GAMES) {
    for (const v of Object.values(g)) {
      if (typeof v !== 'string') continue;
      expect(v, g.slug).not.toMatch(/Conviction\s*\d|\bC\d{1,2}\b|Xavi/);
    }
  }
});

test('the June capacity essays lead to the capacity pages, and /journal leads to the drills for now', async ({ request }) => {
  for (const [from, to, code] of [
    ['/blog/perceptual-capacity', '/capacities/perceptual', 308],
    ['/blog/cognitive-capacity', '/capacities/cognitive', 308],
    ['/journal', '/training', 307],
  ] as const) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(code);
    expect(new URL(res.headers()['location'], 'https://x').pathname).toBe(to);
  }
});

test('/privacy says what happens to a report, how robots are kept apart, and how long reports are kept', async ({ page }) => {
  await page.goto('/privacy');
  const main = page.locator('main');
  await expect(main).toContainText('Reports (our report form at stunprex.com/report, open to anyone)');
  await expect(main).toContainText('We keep a reporter’s identity confidential');
  await expect(main).toContainText('Reports and our decisions: 1 year from the decision');
  await expect(main).toContainText('sign-in, report and newsletter emails');
  await expect(main).toContainText('To keep people and automated programs apart');
});

test('/cookies names the short cookie that carries the sign-in choice', async ({ page }) => {
  await page.goto('/cookies');
  await expect(page.locator('main')).toContainText('a short cookie, kept at most 15 minutes, that carries your choice below');
});
