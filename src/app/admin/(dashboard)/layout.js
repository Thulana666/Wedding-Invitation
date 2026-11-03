import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/server/auth';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

/** Server-side guard for every dashboard page (in addition to proxy.js). */
export default async function DashboardLayout({ children }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return <AdminShell username={session.username}>{children}</AdminShell>;
}
