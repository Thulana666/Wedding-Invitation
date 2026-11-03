import { SignJWT, jwtVerify } from 'jose';

/** Signed admin session tokens (HS256 JWT in an httpOnly cookie). */

export const SESSION_COOKIE = 'ds_admin_session';
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set to at least 32 characters.');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(username) {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .setAudience('ds-wedding-admin')
    .sign(secretKey());
}

export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ['HS256'],
      audience: 'ds-wedding-admin',
    });
    return payload.role === 'admin' ? { username: payload.sub } : null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
  };
}
