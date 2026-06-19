// Shared filter-chip styling — one source of truth so the /blog and /training
// filter/search UIs render identically (unified style across the site).
export function filterChipClass(active: boolean): string {
  return `inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold font-ui tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1 ${
    active
      ? 'border-deepblue bg-deepblue text-white'
      : 'border-deepblue/25 text-brown/70 hover:border-deepblue hover:text-deepblue'
  }`;
}
