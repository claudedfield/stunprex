import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * D-WEB-24: the derived methodology page (owner decision OT-007).
 *
 * The wording is the Writer's text of record, so these checks guard what the page
 * must carry and must never show, not its sentences: the title and every internal
 * link from the text, no em-dash, no conviction number and no conviction as a
 * heading. The Codex stays internal, so /codex sends a visitor here permanently.
 */

function repoRoot(): string {
  let dir = process.cwd();
  while (!fs.existsSync(path.join(dir, 'package.json')) && dir !== path.dirname(dir)) {
    dir = path.dirname(dir);
  }
  return dir;
}

const SOURCE = fs.readFileSync(path.join(repoRoot(), 'content/pages/methodology.mdx'), 'utf8');
const TITLE: string = JSON.parse(SOURCE.match(/^title: (.+)$/m)![1]);
const LINKS = [...SOURCE.matchAll(/\]\((\/[^)]+)\)/g)].map((m) => m[1]);

test('the methodology page renders the text of record: title, links, and nothing it must not show', async ({ page }) => {
  const response = await page.goto('/methodology', { waitUntil: 'domcontentloaded' });
  expect(response!.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText(TITLE);

  const main = page.locator('main');
  expect(LINKS.length, 'the text of record carries its internal links').toBeGreaterThan(0);
  for (const href of LINKS) {
    await expect(main.locator(`a[href="${href}"]`).first(), `missing link ${href}`).toBeAttached();
  }

  const text = await main.innerText();
  expect(text, 'no em-dash anywhere on the page').not.toContain('\u2014');
  expect(text, 'no conviction number on the page').not.toMatch(/Conviction\s*\d/);
  for (const heading of await main.locator('h1, h2, h3').allInnerTexts()) {
    expect(heading, 'no conviction as a heading').not.toMatch(/Conviction/i);
  }
});

test('/codex redirects permanently to /methodology', async ({ request }) => {
  const response = await request.get('/codex', { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers()['location']).toMatch(/\/methodology$/);
});
