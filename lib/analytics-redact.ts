/**
 * LEGAL-01f: the page URL sent to Web Analytics and Speed Insights carries no personal data.
 * Profile URLs carry a display name, by default the local part of the member's email, so they
 * are sent as /community/u/[member]. Search, sign-in and auth pages lose their query strings.
 * Every other URL is sent as it is.
 */
const PROFILE = /^\/community\/u\/[^/]+/;
const DROP_QUERY = [/^\/community\/search\/?$/, /^\/signin\/?$/, /^\/auth(\/|$)/];

export function redactAnalyticsUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw, 'https://stunprex.com');
  } catch {
    return raw;
  }
  let path = u.pathname;
  let search = u.search;
  let hash = u.hash;
  if (PROFILE.test(path)) {
    path = path.replace(PROFILE, '/community/u/[member]');
    search = '';
    hash = '';
  }
  if (DROP_QUERY.some((re) => re.test(path))) search = '';
  const tail = `${path}${search}${hash}`;
  return /^https?:\/\//.test(raw) ? `${u.origin}${tail}` : tail;
}

export function redactEvent<T extends { url: string }>(event: T): T {
  return { ...event, url: redactAnalyticsUrl(event.url) };
}
