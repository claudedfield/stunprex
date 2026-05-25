// Primary nav — D8 scope: Home, Blog, Community, About. Other sections return when built.
export const PRIMARY_NAV = [
  { href: '/blog',       label: 'Blog',        blurb: 'Methodology-first articles on soccer player development.' },
  { href: '/community',  label: 'Community',   blurb: 'Connect. Compete. Grow together.' },
] as const;

// Brand-spine / utility nav — top-right + footer. Build Plan §A.
export const UTILITY_NAV = [
  { href: '/codex',           label: 'Codex' },
  { href: '/methodology',     label: 'Methodology' },
  { href: '/pricing',         label: 'Pricing' },
  { href: '/about',           label: 'About' },
] as const;
