import { test, expect } from '@playwright/test';

/**
 * D-WEB-17: self-referential canonicals.
 *
 * Google Search Console reported "Duplicate without user-selected canonical"
 * on 6 Sep 2026 for pages that shipped with no canonical tag at all, which
 * left Google to pick one itself. These are the 16 sitemap URLs that were
 * missing it. The tag is invisible on the page, so nothing but a check like
 * this notices when one goes missing again.
 *
 * Fetched rather than navigated: this asserts a tag in the served HTML, and 16
 * page loads would cost the nightly far more than 16 requests.
 */

const EXPECTED: Record<string, string> = {
  '/': 'https://stunprex.com',
  '/about': 'https://stunprex.com/about',
  '/codex': 'https://stunprex.com/codex',
  '/community': 'https://stunprex.com/community',
  '/pricing': 'https://stunprex.com/pricing',
  '/games': 'https://stunprex.com/games',
  '/games/koi-pond': 'https://stunprex.com/games/koi-pond',
  '/games/shoulder-check': 'https://stunprex.com/games/shoulder-check',
  '/games/commit-window': 'https://stunprex.com/games/commit-window',
  '/games/peripheral-pulse': 'https://stunprex.com/games/peripheral-pulse',
  '/games/pass-lanes': 'https://stunprex.com/games/pass-lanes',
  '/games/pattern-break': 'https://stunprex.com/games/pattern-break',
  '/games/two-things-at-once': 'https://stunprex.com/games/two-things-at-once',
  '/games/rondo-recall': 'https://stunprex.com/games/rondo-recall',
  '/games/switch-the-play': 'https://stunprex.com/games/switch-the-play',
  '/games/hold-your-nerve': 'https://stunprex.com/games/hold-your-nerve',
};

/**
 * Next.js normalises a canonical of "https://stunprex.com/" to the same URL
 * without the trailing slash. An empty path and "/" are the same resource, so
 * both readings are accepted for the home page only.
 */
function acceptable(route: string, found: string): boolean {
  const want = EXPECTED[route];
  return found === want || (route === '/' && found === `${want}/`);
}

test('every page that was missing a canonical now serves a self-referential one', async ({
  request,
}) => {
  const failures: string[] = [];

  for (const route of Object.keys(EXPECTED)) {
    const res = await request.get(route);
    if (res.status() !== 200) {
      failures.push(`${route}: HTTP ${res.status()}`);
      continue;
    }
    const found = (await res.text()).match(
      /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/,
    )?.[1];
    if (!found) {
      failures.push(`${route}: no canonical tag`);
    } else if (!acceptable(route, found)) {
      failures.push(`${route}: canonical is ${found}, expected ${EXPECTED[route]}`);
    }
  }

  // Report every offender in one run rather than stopping at the first.
  expect(failures, `canonical problems:\n${failures.join('\n')}`).toEqual([]);
});
