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

/**
 * LEGAL-01m: staging.stunprex.com sits behind HTTP basic authentication. CI passes the
 * credentials as E2E_STAGING_AUTH ("user:password"); they are sent to the staging origin only,
 * never to production (the host tests request www and the apex directly).
 */
const stagingAuth = process.env.E2E_STAGING_AUTH ?? '';
const [stagingUser, ...stagingPass] = stagingAuth.split(':');
const httpCredentials = stagingAuth
  ? { username: stagingUser, password: stagingPass.join(':'), origin: 'https://staging.stunprex.com', send: 'always' as const }
  : undefined;

/**
 * Found 13 Oct 2026: answering the 401 challenge page by page made about one first page load in
 * seven hang in the browser (scripts and images left pending until the test timed out), which
 * showed as slow, flaky runs on staging only. Sending the header with every request removes the
 * challenge and the hangs (0 of 120 loads). The header then goes with every request of a run
 * against staging; the suite fails on any request to a host that is not ours, and our own
 * server writes "REDACTED" for this header in its log.
 */
const stagingHeaders = stagingAuth && new URL(baseURL).host === 'staging.stunprex.com'
  ? { Authorization: `Basic ${Buffer.from(stagingAuth).toString('base64')}` }
  : undefined;

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
    httpCredentials,
    extraHTTPHeaders: stagingHeaders,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Production is a real deploy behind a CDN; give navigation room without
    // masking a genuinely hung page.
    navigationTimeout: 30_000,
  },
  // D-WEB-31: the suite names itself in its user-agent, and the site's counter leaves such
  // requests out, so the nightly run on production adds nothing to the totals. The counter's own
  // tests set a plain browser user-agent to be counted.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], userAgent: `${devices['Desktop Chrome'].userAgent} StunpreX-E2E` } }],
});
