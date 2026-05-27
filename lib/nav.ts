// Primary nav — D8 scope, aligned 2026-05-26.
// Codex internal (not linked publicly), Pricing out of Q1, Newsletter deferred,
// About + Sign in moved into the primary row.
export const PRIMARY_NAV = [
  { href: '/blog',       label: 'Blog',        blurb: 'Methodology-first articles on individual soccer player development.' },
  { href: '/training',   label: 'Training',    blurb: 'Drill library, themed and filterable.' },
  { href: '/community',  label: 'Community',   blurb: 'Ask. Answer. Compare to last week.' },
  { href: '/games',      label: 'Games',       blurb: 'Coming soon.' },
  { href: '/about',      label: 'About',       blurb: 'Who is behind the methodology.' },
] as const;

// No UTILITY_NAV at v1. Sign in lives in the header alongside the primary CTA.
// Codex internal until v0.7.2 absorption pass; Pricing out of Q1.
