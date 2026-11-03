import { validateAdminGuest } from '@/lib/server/admin-validation';
import { requireAdmin } from '@/lib/server/auth';
import { createGuest, listGuests } from '@/lib/server/guests';
import { handle, json, jsonError, readJson } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const GET = handle(async (request) => {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const p = new URL(request.url).searchParams;
  const result = await listGuests({
    search: (p.get('search') || '').slice(0, 100),
    status: p.get('status') || '',
    event: p.get('event') || '',
    source: p.get('source') || '',
    sort: p.get('sort') || 'created',
    dir: p.get('dir') || 'desc',
    page: p.get('page') || 1,
    pageSize: p.get('pageSize') || 20,
  });
  return json(result);
});

export const POST = handle(async (request) => {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const { ok, data, errors } = validateAdminGuest(await readJson(request));
  if (!ok) return jsonError('Please check the highlighted fields.', 422, { errors });

  const guest = await createGuest(data);
  return json({ guest }, 201);
});
