import { validateAdminGuest } from '@/lib/server/admin-validation';
import { requireAdmin } from '@/lib/server/auth';
import { deleteGuest, getGuestById, updateGuest } from '@/lib/server/guests';
import { handle, json, jsonError, readJson } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

async function guestId(params) {
  const { id } = await params;
  const n = Number.parseInt(id, 10);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export const GET = handle(async (request, { params }) => {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const id = await guestId(params);
  const guest = id && (await getGuestById(id));
  if (!guest) return jsonError('Guest not found.', 404);
  return json({ guest });
});

export const PATCH = handle(async (request, { params }) => {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const id = await guestId(params);
  const existing = id && (await getGuestById(id));
  if (!existing) return jsonError('Guest not found.', 404);

  // Merge so partial updates (e.g. status only) keep the other fields.
  const { ok, data, errors } = validateAdminGuest({ ...existing, ...(await readJson(request)) });
  if (!ok) return jsonError('Please check the highlighted fields.', 422, { errors });

  const guest = await updateGuest(id, data);
  return json({ guest });
});

export const DELETE = handle(async (request, { params }) => {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const id = await guestId(params);
  if (!id || !(await deleteGuest(id))) return jsonError('Guest not found.', 404);
  return json({ ok: true });
});
