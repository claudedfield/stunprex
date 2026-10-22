import { test, expect } from '@playwright/test';

/** The six agreed retires (QUALITY-0020) and the Coach's straightening batch A (QUALITY-0025), 22 Oct 2026. */

test('each retired drill leads to its replacement or its family page', async ({ request }) => {
  for (const [from, to] of [
    ['/training/indoor-1v1-hall', '/training/constrained-1v1-to-score'],
    ['/training/follow-the-leader-discovery', '/training/mirror-game-discovery'],
    ['/training/pressure-cooker', '/capacities/affective'],
    ['/training/constraint-roulette', '/capacities/adaptive'],
    ['/training/varied-surface-transfer', '/capacities/adaptive'],
    ['/training/indoor-touch', '/capacities/motor'],
  ]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(308);
    expect(new URL(res.headers()['location'], 'https://x').pathname).toBe(to);
    expect((await request.get(to)).status(), to).toBe(200);
  }
});

test('the straightened batch A pages are live with no em-dash in what they show', async ({ page }) => {
  for (const slug of ['aerial-control-cushion', 'breakaway-finish-fatigue', 'counter-press-five-seconds', 'transition-gates-win-go-forward', 'change-of-pace-carry']) {
    await page.goto(`/training/${slug}`);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(await page.locator('main').innerText(), slug).not.toContain('—');
  }
  await page.goto('/training/aerial-control-cushion');
  await expect(page.locator('main')).toContainText('Heading and load');
});
