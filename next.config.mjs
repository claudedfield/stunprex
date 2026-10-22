/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default Next.js settings — Vercel handles SSR, ISR, image optimisation,
  // edge caching, and previews. Nothing custom needed at scaffold time.
  reactStrictMode: true,
  // D-WEB-27: a self-contained server for the VPS image. Vercel builds ignore it.
  output: 'standalone',
  async redirects() {
    return [
      // D-WEB-24: the Codex stays internal (OT-007), so the stub's "later this year" was a promise
      // the site will not keep; a visitor looking for it lands on the public methodology page.
      { source: '/codex', destination: '/methodology', permanent: true },
      // Keeper ruling 61 (20 Oct 2026): capacity family F4 is Collective; old links and search results keep working.
      { source: '/capacities/communication', destination: '/capacities/collective', statusCode: 301 },
      // The owner's word of 20 Oct (D-CONTENT-23), the post plan's defaults: the Rodri breakdown is
      // retired until a match record exists (temporary, so it can come back), and the scanning
      // post's reader goes to the perceptual reference page.
      { source: '/blog/rodri-spatial-intelligence', destination: '/blog', permanent: false },
      { source: '/blog/scanning-while-dribbling', destination: '/capacities/perceptual', permanent: true },
      // QUALITY-0019 (f): the June capacity essays gave way to the capacity pages (21 Oct 2026).
      { source: '/blog/perceptual-capacity', destination: '/capacities/perceptual', permanent: true },
      { source: '/blog/cognitive-capacity', destination: '/capacities/cognitive', permanent: true },
      // The six retires both reads agreed (QUALITY-0020 (3), COO-DEV-0058 6; pages kept as drafts):
      // the hall page into its replacement (D-CONTENT-30), Follow the Leader into the Mirror Game,
      // the rest to the page of their main capacity family.
      { source: '/training/indoor-1v1-hall', destination: '/training/constrained-1v1-to-score', permanent: true },
      { source: '/training/follow-the-leader-discovery', destination: '/training/mirror-game-discovery', permanent: true },
      { source: '/training/pressure-cooker', destination: '/capacities/affective', permanent: true },
      { source: '/training/constraint-roulette', destination: '/capacities/adaptive', permanent: true },
      { source: '/training/varied-surface-transfer', destination: '/capacities/adaptive', permanent: true },
      { source: '/training/indoor-touch', destination: '/capacities/motor', permanent: true },
      // The journal's page comes with J1; until then /journal leads to the drills (temporary).
      { source: '/journal', destination: '/training', permanent: false },
    ];
  },
};

export default nextConfig;
