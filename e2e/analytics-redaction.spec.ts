import { test, expect } from '@playwright/test';
import { redactAnalyticsUrl, redactEvent } from '../lib/analytics-redact';

/**
 * LEGAL-01f: Web Analytics and Speed Insights send the page URL. Profile URLs carry a member's
 * display name, which defaults to the local part of their email, so the name never leaves.
 */
test('a profile URL reaches analytics as /community/u/[member]', () => {
  expect(redactAnalyticsUrl('https://stunprex.com/community/u/jane.doe')).toBe(
    'https://stunprex.com/community/u/[member]',
  );
  expect(redactAnalyticsUrl('https://stunprex.com/community/u/jane.doe?tab=answers#top')).toBe(
    'https://stunprex.com/community/u/[member]',
  );
  expect(redactEvent({ type: 'pageview', url: 'https://stunprex.com/community/u/sam' }).url).toBe(
    'https://stunprex.com/community/u/[member]',
  );
});

test('search, sign-in and auth URLs lose their query strings; other pages are sent as they are', () => {
  expect(redactAnalyticsUrl('https://stunprex.com/community/search?q=my+son+aged+11')).toBe(
    'https://stunprex.com/community/search',
  );
  expect(redactAnalyticsUrl('https://stunprex.com/signin?callbackUrl=%2Fcommunity')).toBe('https://stunprex.com/signin');
  expect(redactAnalyticsUrl('https://stunprex.com/auth/verify?email=a%40b.example')).toBe(
    'https://stunprex.com/auth/verify',
  );
  expect(redactAnalyticsUrl('https://stunprex.com/training?band=9-12')).toBe('https://stunprex.com/training?band=9-12');
  expect(redactAnalyticsUrl('https://stunprex.com/community')).toBe('https://stunprex.com/community');
});
