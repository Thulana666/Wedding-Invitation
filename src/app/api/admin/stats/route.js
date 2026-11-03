import { requireAdmin } from '@/lib/server/auth';
import { getStats } from '@/lib/server/guests';
import { handle, json } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const GET = handle(async (request) => {
  const { response } = await requireAdmin(request);
  if (response) return response;
  return json(await getStats());
});
