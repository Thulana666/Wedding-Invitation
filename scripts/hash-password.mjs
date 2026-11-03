// Creates an ADMIN_PASSWORD_HASH value for .env.local
// Usage: node scripts/hash-password.mjs "your strong password"
import { randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: node scripts/hash-password.mjs "<password of at least 12 characters>"');
  process.exit(1);
}

const salt = randomBytes(16);
const key = scryptSync(password, salt, 64);
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString('base64url')}:${key.toString('base64url')}`);
