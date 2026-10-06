/**
 * LEGAL-01a: the Terms of Use version a member accepts, held in one place.
 *
 * It is the "Last updated" date of /terms. When the terms change, change this constant in the
 * same release: every member then meets the terms step (/community/welcome) on their next write,
 * and their acceptance is recorded against the new version.
 */
export const TERMS_VERSION = '2026-09-24'

/** "24 September 2026", for the checkbox label. */
export const TERMS_VERSION_LABEL = new Date(`${TERMS_VERSION}T00:00:00Z`).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
})
