import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

/**
 * Database access.
 *
 * - With DATABASE_URL (or POSTGRES_URL, as set by Vercel's Postgres
 *   integrations) set, connects to PostgreSQL through `pg` (production).
 * - Without it, uses PGlite — a full Postgres engine embedded in Node — stored
 *   in ./.data/pglite, so local development needs no database install.
 *
 * Both expose the same `query(text, params)` → `{ rows }` interface and run
 * the same SQL.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS guests (
  id                 SERIAL PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,
  full_name          TEXT NOT NULL,
  phone              TEXT,
  email              TEXT,
  max_guests         INTEGER NOT NULL DEFAULT 2 CHECK (max_guests >= 1),
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attending', 'declined')),
  companions         INTEGER NOT NULL DEFAULT 0 CHECK (companions >= 0),
  companion_names    JSONB NOT NULL DEFAULT '[]'::jsonb,
  events             JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes              TEXT,
  admin_notes        TEXT,
  source             TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('admin', 'open')),
  first_responded_at TIMESTAMPTZ,
  responded_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guests_status_idx ON guests (status);
CREATE INDEX IF NOT EXISTS guests_name_idx ON guests (lower(full_name));
CREATE INDEX IF NOT EXISTS guests_first_responded_idx ON guests (first_responded_at);
`;

async function connect() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (url) {
    const { Pool } = await import('pg');
    const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
    const pool = new Pool({
      connectionString: url,
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      ssl: local || /sslmode=disable/.test(url) ? false : { rejectUnauthorized: false },
    });
    return { kind: 'postgres', query: (text, params = []) => pool.query(text, params) };
  }

  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    throw new Error('DATABASE_URL must be set in production.');
  }

  const { PGlite } = await import('@electric-sql/pglite');
  const dir = process.env.PGLITE_DIR || path.join(process.cwd(), '.data', 'pglite');
  mkdirSync(path.dirname(dir), { recursive: true });
  let pg;
  try {
    pg = await PGlite.create(dir);
  } catch (error) {
    // A dev server that was killed leaves a stale lock file behind; clear it once and retry.
    const lock = path.join(dir, 'postmaster.pid');
    if (!existsSync(lock)) throw error;
    console.warn('[db] Removing stale lock file from the local database and retrying.');
    rmSync(lock, { force: true });
    pg = await PGlite.create(dir);
  }
  return { kind: 'pglite', query: (text, params = []) => pg.query(text, params) };
}

async function init() {
  const db = await connect();
  if (db.kind === 'pglite') {
    // PGlite's query() runs one statement at a time.
    for (const statement of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) {
      await db.query(statement);
    }
  } else {
    await db.query(SCHEMA);
  }
  return db;
}

function getDb() {
  // Cache on globalThis so hot reloads in development reuse one connection.
  if (!globalThis.__dsWeddingDb) {
    globalThis.__dsWeddingDb = init().catch((error) => {
      globalThis.__dsWeddingDb = undefined;
      throw error;
    });
  }
  return globalThis.__dsWeddingDb;
}

export async function query(text, params = []) {
  const db = await getDb();
  return db.query(text, params);
}
