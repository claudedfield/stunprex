import type { Page, ConsoleMessage } from '@playwright/test';

/**
 * Console-error collector.
 *
 * Third-party noise that is not a site defect is filtered out, so a failure
 * here always means something real. Keep this list short and justified — every
 * entry is a thing the suite stops watching.
 */
const IGNORED_CONSOLE = [
  /Failed to load resource.*(favicon|apple-touch-icon)/i,
  // Browser extensions injected into the page in local runs.
  /chrome-extension:\/\//i,
  // Vercel Analytics no-ops loudly when a request is blocked by a client-side
  // blocker; that is the visitor's browser, not the site.
  /\/_vercel\/insights/i,
  /va\.vercel-scripts\.com/i,
];

export interface ConsoleWatcher {
  errors: string[];
}

/** Attach before navigating; read `.errors` after the assertions that matter. */
export function watchConsole(page: Page): ConsoleWatcher {
  const watcher: ConsoleWatcher = { errors: [] };

  const record = (text: string) => {
    if (IGNORED_CONSOLE.some((r) => r.test(text))) return;
    watcher.errors.push(text);
  };

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') record(msg.text());
  });
  page.on('pageerror', (err) => record(`pageerror: ${err.message}`));

  return watcher;
}

/** The 19 golden routes. Two are content detail pages, pinned deliberately. */
export const GOLDEN_ROUTES = [
  '/',
  '/about',
  '/methodology',
  '/training',
  '/games',
  '/blog',
  '/community',
  '/capacities',
  '/for-players',
  '/for-parents',
  '/for-coaches',
  '/privacy',
  '/terms',
  '/cookies',
  '/imprint',
  '/codex',
  '/pricing',
  '/training/yes-rondo',
  '/blog/soccer-dribbling-drills',
] as const;

/** Live game slugs — mirrors lib/games/registry.ts. */
export const GAME_SLUGS = [
  'koi-pond',
  'shoulder-check',
  'commit-window',
  'peripheral-pulse',
  'pass-lanes',
  'pattern-break',
  'two-things-at-once',
  'rondo-recall',
  'switch-the-play',
  'hold-your-nerve',
] as const;

/**
 * Cookie-consent banners are a FAILURE, not a feature: the site is cookieless
 * by design (D-WEB-06) and /cookies says so in writing. If one ever appears,
 * either the copy became false or a tracker was added without a decision.
 */
export const CONSENT_PATTERNS = [
  /accept (all )?cookies/i,
  /cookie (consent|preferences|settings)/i,
  /we use cookies/i,
  /manage (your )?(cookie|tracking) preferences/i,
];
