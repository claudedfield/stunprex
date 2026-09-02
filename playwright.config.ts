import { defineConfig, devices } from '@playwright/test';

/**
 * D-WEB-10 — StunpreX e2e suite.
 *
 * The suite runs against a DEPLOYED url, never a local dev server: the point is
 * to catch what a visitor would hit. Target is set by E2E_BASE_URL —
 *   PR runs      → the Vercel preview deployment
 *   nightly runs → production
 *
 * Default is the canonical host: the apex. D-WEB-12 flipped the Vercel primary
 * domain, so www now 308s here. Redirects are followed either way.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'https://stunprex.com';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [['github'], ['json', { outputFile: 'e2e-results.json' }], ['html', { open: 'never' }]]
    : [['list'], ['json', { outputFile: 'e2e-results.json' }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Production is a real deploy behind a CDN; give navigation room without
    // masking a genuinely hung page.
    navigationTimeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
