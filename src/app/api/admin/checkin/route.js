import { requireAdmin } from '@/lib/server/auth';
import { checkInGuest, getGuestByCode, getGuestById, normalizeCode, undoCheckIn } from '@/lib/server/guests';
import { handle, json, jsonError, readJson } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

/** Accepts a raw code or any URL ending in /invite/<code>. */
function extractCode(value) {
  const raw = String(value || '').trim();
  const fromUrl = raw.match(/\/invite\/([A-Za-z0-9-]+)/);
  return normalizeCode(fromUrl ? fromUrl[1] : raw);
}

function verdict(guest) {
  if (guest.status !== 'attending') return { state: 'not_attending', message: `RSVP status is “${guest.status}”.` };
  if (guest.checkedInAt) return { state: 'already', message: 'This invitation has already been checked in.' };
  return { state: 'ready', message: 'Invitation verified.' };
}

/**
 * actions:
 *  - lookup  { code }            → verify an invitation
 *  - checkin { code, count }     → check in (never twice)
 *  - undo    { id }              → reverse a check-in
 */
export const POST = handle(async (request) => {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const body = await readJson(request, 2000);

  if (body.action === 'undo') {
    const id = Number.parseInt(body.id, 10);
    const guest = Number.isSafeInteger(id) && id > 0 ? await undoCheckIn(id) : null;
    if (!guest) return jsonError('Guest not found.', 404);
    return json({ guest, ...verdict(guest) });
  }

  const code = extractCode(body.code);
  if (!code) return jsonError('That does not look like a valid invitation code.', 400);
  const guest = await getGuestByCode(code);
  if (!guest) return jsonError('No invitation matches this code.', 404, { state: 'not_found' });

  if (body.action === 'checkin') {
    const v = verdict(guest);
    if (v.state !== 'ready') return json({ guest, ...v }, 409);

    const party = 1 + guest.companions;
    const requested = Number.parseInt(body.count ?? party, 10);
    const count = Math.min(Math.max(Number.isFinite(requested) ? requested : party, 1), guest.maxGuests);

    const checked = await checkInGuest(code, count);
    if (!checked) {
      // Another device checked this guest in a moment ago.
      const fresh = await getGuestById(guest.id);
      return json({ guest: fresh, ...verdict(fresh) }, 409);
    }
    return json({ guest: checked, state: 'checked_in', message: `Welcome! ${count} ${count === 1 ? 'guest' : 'guests'} checked in.` });
  }

  return json({ guest, ...verdict(guest) });
});
