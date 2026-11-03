import { cookies } from 'next/headers';
import { adminConfigured, verifyCredentials } from '@/lib/server/auth';
import { clientIp, handle, json, jsonError, readJson } from '@/lib/server/http';
import { rateLimit, resetRateLimit } from '@/lib/server/rate-limit';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export const POST = handle(async (request) => {
  if (!adminConfigured()) {
    return jsonError('Admin login is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD and AUTH_SECRET.', 503);
  }

  const key = `login:${clientIp(request)}`;
  const limit = rateLimit(key, { limit: 6, windowMs: 15 * 60 * 1000 });
  if (!limit.ok) {
    return jsonError(`Too many attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`, 429);
  }

  const { username, password } = await readJson(request, 2000);
  if (!verifyCredentials(username, password)) {
    return jsonError('Incorrect username or password.', 401);
  }

  resetRateLimit(key);
  const token = await createSessionToken(String(username).trim().toLowerCase());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
  return json({ ok: true });
});
