import { redirect } from 'next/navigation';
import { adminConfigured, getAdminSession } from '@/lib/server/auth';
import LoginForm from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  const safeNext = typeof next === 'string' && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';
  if (await getAdminSession()) redirect(safeNext);
  return <LoginForm next={safeNext} configured={adminConfigured()} />;
}
