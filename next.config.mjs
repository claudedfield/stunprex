/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default Next.js settings — Vercel handles SSR, ISR, image optimisation,
  // edge caching, and previews. Nothing custom needed at scaffold time.
  reactStrictMode: true,
  async redirects() {
    return [
      // D-WEB-24: the Codex stays internal (OT-007), so the stub's "later this year" was a promise
      // the site will not keep; a visitor looking for it lands on the public methodology page.
      { source: '/codex', destination: '/methodology', permanent: true },
    ];
  },
};

export default nextConfig;
