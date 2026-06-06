// db/migrate.mjs — runs all SQL migration files on every Vercel build.
// Idempotent: each migration uses CREATE TABLE IF NOT EXISTS / CREATE EXTENSION IF NOT EXISTS.
// Reads *.sql files in db/migrations/ in lexicographic order (001_, 002_, …).
// Uses raw pg client (not @vercel/postgres) — pg's client.query() accepts
// multi-statement SQL strings; @vercel/postgres uses prepared statements which break on them.
//
// Graceful degradation:
//   - No POSTGRES_URL_NON_POOLING or POSTGRES_URL → logs warning, exits 0 (safe for preview deploys)
//   - No db/migrations/ directory → logs warning, exits 0
//   - Migration failure → logs error, exits 1 (fails the Vercel build — good: bad schema = no deploy)

import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, 'migrations')

// Prefer the non-pooling connection for multi-statement migrations
const connectionString = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL

if (!connectionString) {
  console.warn('[migrate] No POSTGRES_URL_NON_POOLING or POSTGRES_URL found — skipping migrations.')
  process.exit(0)
}

// Check migrations directory exists
let files
try {
  files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort()
} catch {
  console.warn('[migrate] No db/migrations/ directory found — skipping migrations.')
  process.exit(0)
}

if (files.length === 0) {
  console.log('[migrate] No SQL files in db/migrations/ — nothing to run.')
  process.exit(0)
}

const client = new pg.Client({ connectionString })
await client.connect()

try {
  for (const file of files) {
    console.log(`[migrate] Running ${file}…`)
    const sql = await readFile(join(migrationsDir, file), 'utf8')
    await client.query(sql)
    console.log(`[migrate] ✓ ${file}`)
  }
  console.log(`[migrate] Done — ${files.length} migration file(s) applied.`)
} catch (err) {
  console.error('[migrate] FAILED:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
