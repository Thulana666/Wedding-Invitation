import { wedding } from '@/config/wedding';
import { validateRsvp } from '@/lib/rsvp';
import { createOpenRsvp, getGuestByCode, normalizeCode, toPublicGuest, updateRsvp } from '@/lib/server/guests';
import { clientIp, handle, json, jsonError, readJson } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';

function deadlinePassed() {
  const { deadline } = wedding.rsvp;
  if (!deadline) return false;
  // Deadline is inclusive until the end of that day in Sri Lanka.
  return Date.now() > new Date(`${deadline}T23:59:59+05:30`).getTime();
}

/** Submit or update an RSVP. With `code` it updates that invitation. */
export const POST = handle(async (request) => {
  const ip = clientIp(request);
  const limit = rateLimit(`rsvp:${ip}`, { limit: 12, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return jsonError('Too many submissions. Please try again in a few minutes.', 429, { retryAfter: limit.retryAfter });
  }

  const body = await readJson(request);

  // Honeypot field — real guests never fill it in.
  if (body.website) return json({ ok: true });

  if (deadlinePassed()) {
    return jsonError('The RSVP deadline has passed. Please contact the family directly.', 403);
  }

  if (body.code) {
    const code = normalizeCode(body.code);
    const guest = code ? await getGuestByCode(code) : null;
    if (!guest) return jsonError('We could not find this invitation.', 404);

    const { ok, data, errors } = validateRsvp(body, { maxGuests: guest.maxGuests });
    if (!ok) return jsonError('Please check the highlighted fields.', 422, { errors });

    const updated = await updateRsvp(code, data);
    if (!updated) return jsonError('This invitation can no longer be updated.', 409);
    return json({ guest: toPublicGuest(updated) });
  }

  if (!wedding.rsvp.allowOpenRsvp) {
    return jsonError('Please use the personal invitation link you received to RSVP.', 403);
  }

  const { ok, data, errors } = validateRsvp(body, { maxGuests: wedding.rsvp.defaultMaxGuests });
  if (!ok) return jsonError('Please check the highlighted fields.', 422, { errors });

  const created = await createOpenRsvp(data);
  return json({ guest: toPublicGuest(created) }, 201);
});
