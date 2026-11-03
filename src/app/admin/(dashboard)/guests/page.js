import GuestManager from '@/components/admin/GuestManager';

export const dynamic = 'force-dynamic';

export default async function GuestsPage({ searchParams }) {
  const params = await searchParams;
  return <GuestManager openNew={params?.new === '1'} />;
}
