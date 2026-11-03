// Deletes the embedded development database (stop `npm run dev` first).
// Has no effect on a PostgreSQL database configured through DATABASE_URL.
import { rm } from 'node:fs/promises';
import path from 'node:path';

try {
  process.loadEnvFile('.env.local');
} catch {
  /* no .env.local — use the default location */
}

const dir = process.env.PGLITE_DIR || path.join(process.cwd(), '.data', 'pglite');
await rm(dir, { recursive: true, force: true });
console.log(`Removed local database at ${dir}. It will be recreated on next start.`);
