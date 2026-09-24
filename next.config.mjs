/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default Next.js settings — Vercel handles SSR, ISR, image optimisation,
  // edge caching, and previews. Nothing custom needed at scaffold time.
  reactStrictMode: true,
  // D-WEB-27: a self-contained server for the VPS image. Vercel builds ignore it.
  output: 'standalone',
};

export default nextConfig;
