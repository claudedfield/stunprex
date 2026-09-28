/**
 * Postgres client: one shared `pg` pool for all server-side queries.
 * Import { sql, db } from here throughout the app; never import a driver directly.
 *
 * D-WEB-30: the site moves its database from Neon onto the VPS. `@vercel/postgres` speaks Neon's
 * WebSocket protocol and cannot reach a plain Postgres, so this module keeps its interface
 * (`sql` as a tagged template and `sql.query(text, params)`, both resolving to { rows, rowCount },
 * and `db` for the Auth.js adapter) on the standard `pg` driver, which reaches Neon and the VPS
 * alike. The connection string is POSTGRES_URL (pooled on Neon, the server itself on the VPS).
 */
import { Pool, type QueryResult, type QueryResultRow } from 'pg'

const pool = new Pool({ connectionString: process.env.POSTGRES_URL, max: 10 })

type Sql = {
  <R extends QueryResultRow = QueryResultRow>(strings: TemplateStringsArray, ...values: unknown[]): Promise<QueryResult<R>>
  query<R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<R>>
}

/** `sql\`... ${v} ...\`` becomes a parameterised query ($1, $2, ...); values are never spliced into the text. */
export const sql = Object.assign(
  <R extends QueryResultRow = QueryResultRow>(strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.reduce((acc, s, i) => acc + `$${i}` + s)
    return pool.query<R>(text, values)
  },
  { query: <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) => pool.query<R>(text, params) },
) as Sql

export const db = pool
