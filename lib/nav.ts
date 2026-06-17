// Primary nav — Blog, Training, Games, Community.
export const PRIMARY_NAV = [
  { href: '/blog',       label: 'Blog',        blurb: 'Methodology-first articles on soccer player development.' },
  { href: '/training',   label: 'Training',    blurb: 'Codex-aligned drills for individual player development.' },
  { href: '/games',      label: 'Games',       blurb: 'Cognitive games for perception and decision-making.' },
  { href: '/community',  label: 'Community',   blurb: 'Connect. Compete. Grow together.' },
] as const;

// Utility nav — top strip removed; kept as empty export for type safety.
export const UTILITY_NAV: readonly { href: string; label: string }[] = [];
