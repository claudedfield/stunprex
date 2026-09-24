// db/migrate.mjs: applies db/migrations/*.sql in name order, each file once, and records it.
//
// D-WEB-27, decision M: this runs on every deploy, before the new version starts serving, so it
// must be safe to run again and again. Each file runs inside its own transaction and is recorded
// in schema_migrations; a recorded file is never run again. A failing file rolls back and exits 1,
// which stops the deploy while the old version keeps serving. Migrations must stay additive and
// backward compatible with the code still serving (new columns nullable or defaulted; no renames
// or drops in the release that stops using them), and reach a Neon branch on staging first.
//
// 001 and 002 predate the record and are written with IF NOT EXISTS, so their first recorded run
// changes nothing. Uses the raw pg client over the direct (non-pooling) connection: pg accepts
// multi-statement SQL, which prepared statements do not.

import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), 'migrations')
const connectionString = process.env.POSTGRES_URL_NON_POOLING

if (!connectionString) {
  console.error('[migrate] POSTGRES_URL_NON_POOLING is not set; refusing to deploy without a database.')
  process.exit(1)
}

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()
const client = new pg.Client({ connectionString })
await client.connect()

try {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`)
  const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name))
  let applied = 0
  for (const file of files) {
    if (done.has(file)) continue
    const sql = await readFile(join(migrationsDir, file), 'utf8')
    console.log(`[migrate] applying ${file}`)
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw new Error(`${file}: ${err.message}`)
    }
    applied += 1
  }
  console.log(`[migrate] done: ${applied} applied, ${files.length - applied} already recorded`)
} catch (err) {
  console.error('[migrate] FAILED, nothing from the failing file was kept:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
