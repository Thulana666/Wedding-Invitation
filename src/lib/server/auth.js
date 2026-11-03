import { createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from './session';
import { jsonError } from './http';

/** Admin credential checks and route guards. Credentials come from env vars. */

function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

function checkPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    // Format: scrypt:<salt base64url>:<key base64url>  (see scripts/hash-password.mjs)
    const [scheme, salt, key] = hash.split(':');
    if (scheme !== 'scrypt' || !salt || !key) return false;
    const expected = Buffer.from(key, 'base64url');
    const actual = scryptSync(String(password), Buffer.from(salt, 'base64url'), expected.length);
    return timingSafeEqual(actual, expected);
  }
  const plain = process.env.ADMIN_PASSWORD;
  if (!plain || plain.length < 12) return false;
  return safeEqual(password, plain);
}

export function adminConfigured() {
  const hasPassword = Boolean(process.env.ADMIN_PASSWORD_HASH) || (process.env.ADMIN_PASSWORD || '').length >= 12;
  return Boolean(process.env.ADMIN_USERNAME) && hasPassword && (process.env.AUTH_SECRET || '').length >= 32;
}

export function verifyCredentials(username, password) {
  const expectedUser = process.env.ADMIN_USERNAME;
  if (!adminConfigured() || typeof username !== 'string' || typeof password !== 'string') return false;
  // Evaluate both checks to keep timing uniform.
  const userOk = safeEqual(username.trim().toLowerCase(), expectedUser.trim().toLowerCase());
  const passOk = checkPassword(password);
  return userOk && passOk;
}

export async function getAdminSession() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return request.method === 'GET' || request.method === 'HEAD';
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Guards an admin API route. Returns `{ session }` on success or
 * `{ response }` holding the error response to return.
 */
export async function requireAdmin(request) {
  const session = await getAdminSession();
  if (!session) return { response: jsonError('Unauthorized', 401) };
  if (request && request.method !== 'GET' && !sameOrigin(request)) {
    return { response: jsonError('Cross-origin request blocked', 403) };
  }
  return { session };
}
