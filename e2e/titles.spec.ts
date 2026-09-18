import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * D-WEB-25 Part C: the brand shown twice.
 *
 * The layout template appends " · StunpreX" to every page title. Pages whose own
 * title already named the brand rendered it twice, for example "Community ·
 * StunpreX · StunpreX"; those titles are now absolute. Fetched rather than
 * navigated: this reads the served <title> only.
 */
const NAMES_BRAND = [
  '/community',
  '/community/search',
  '/community/welcome',
  '/signin',
  '/auth/sign-up',
  '/training',
  '/capacities',
  '/capacities/perceptual',
  '/training/yes-rondo',
];
const PLAIN = ['/privacy', '/games', '/blog'];

async function title(request: APIRequestContext, route: string): Promise<string> {
  const response = await request.get(route);
  expect(response.status(), `${route} status`).toBe(200);
  const m = (await response.text()).match(/<title>([^<]*)<\/title>/);
  expect(m, `${route} has a <title>`).not.toBeNull();
  return m![1].replace(/&amp;/g, '&');
}

test('titles that name the brand carry it once', async ({ request }) => {
  for (const route of NAMES_BRAND) {
    const t = await title(request, route);
    expect(t.match(/StunpreX/g)?.length, `${route}: "${t}"`).toBe(1);
  }
});

test('titles that do not name the brand get it once from the template', async ({ request }) => {
  for (const route of PLAIN) {
    const t = await title(request, route);
    expect(t, route).toMatch(/ · StunpreX$/);
    expect(t.match(/StunpreX/g)?.length, `${route}: "${t}"`).toBe(1);
  }
});
