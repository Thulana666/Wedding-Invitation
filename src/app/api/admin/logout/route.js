import { cookies } from 'next/headers';
import { json } from '@/lib/server/http';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', sessionCookieOptions(0));
  return json({ ok: true });
}
