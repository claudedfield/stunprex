// Eight-section primary nav — Blueprint v2.1 §5/§12. Locked.
export const PRIMARY_NAV = [
  { href: '/playbook',   label: 'Playbook',    blurb: 'Soccer intelligence at your fingertips.' },
  { href: '/training',   label: 'Training',    blurb: 'Train smarter, play better.' },
  { href: '/community',  label: 'Community',   blurb: 'Connect. Compete. Grow together.' },
  { href: '/games',      label: 'Games',       blurb: 'Boost your Soccer IQ with fun & interactive games.' },
  { href: '/reviews',    label: 'Reviews',     blurb: 'Gear up for success.' },
  { href: '/shop',       label: 'Shop',        blurb: 'The right tools for next-level training.' },
  { href: '/me',         label: 'MyStunpreX',  blurb: 'Your journey, your progress, your success.' },
] as const;

// Brand-spine / utility nav — top-right + footer. Build Plan §A.
export const UTILITY_NAV = [
  { href: '/codex',           label: 'Codex' },
  { href: '/methodology',     label: 'Methodology' },
  { href: '/pricing',         label: 'Pricing' },
  { href: '/about',           label: 'About' },
] as const;
