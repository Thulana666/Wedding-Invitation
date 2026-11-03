import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/server/session';

/**
 * First line of defence for the admin area. Every admin page and API route
 * also verifies the session itself on the server.
 */
export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();

  let session = null;
  try {
    session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  } catch {
    session = null; // AUTH_SECRET missing — treated as signed out.
  }
  if (session) return NextResponse.next();

  if (isApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
