/**
 * LEGAL-01i: the sign-in link's lifetime. Every page and email tells people 15 minutes, and
 * Auth.js defaults to 24 hours when a provider sets no maxAge, so the value lives here and
 * auth.ts passes it to the Email provider.
 */
export const MAGIC_LINK_MAX_AGE_SECONDS = 15 * 60;
