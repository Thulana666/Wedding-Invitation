import { getStats } from '@/lib/server/guests';
import Overview from '@/components/admin/Overview';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const stats = await getStats();
  return <Overview initialStats={stats} />;
}
