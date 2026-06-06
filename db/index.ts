/**
 * Vercel Postgres client — single shared pool for all server-side queries.
 * Import { sql } from here throughout the app.
 * Never import from @vercel/postgres directly — keep the import location stable.
 *
 * NEXT_PUBLIC_POSTGRES_URL is not needed; @vercel/postgres reads POSTGRES_URL
 * (and POSTGRES_URL_NON_POOLING etc.) from env automatically.
 */
export { sql, db } from '@vercel/postgres'
