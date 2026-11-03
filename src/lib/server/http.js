import { NextResponse } from 'next/server';

export function json(data, status = 200, headers = {}) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export function jsonError(message, status = 400, extra = {}) {
  return json({ error: message, ...extra }, status);
}

export async function readJson(request, maxBytes = 20_000) {
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError('Request is too large.', 413);
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError('Invalid JSON body.', 400);
  }
}

export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'local';
}

/** Wraps a route handler so thrown errors become clean JSON responses. */
export function handle(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      if (error instanceof HttpError) return jsonError(error.message, error.status);
      console.error('[api]', error);
      return jsonError('Something went wrong. Please try again.', 500);
    }
  };
}
