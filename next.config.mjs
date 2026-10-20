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
    ];
  },
};

export default nextConfig;
