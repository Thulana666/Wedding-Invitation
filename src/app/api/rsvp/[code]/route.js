import { getGuestByCode, normalizeCode, toPublicGuest } from '@/lib/server/guests';
import { clientIp, handle, json, jsonError } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';

/** Returns a guest's own RSVP, looked up by their private invitation code. */
export const GET = handle(async (request, { params }) => {
  const limit = rateLimit(`rsvp-lookup:${clientIp(request)}`, { limit: 30, windowMs: 60 * 1000 });
  if (!limit.ok) return jsonError('Too many requests.', 429);

  const { code } = await params;
  const normalized = normalizeCode(code);
  const guest = normalized ? await getGuestByCode(normalized) : null;
  if (!guest) return jsonError('Invitation not found.', 404);
  return json({ guest: toPublicGuest(guest) });
});
