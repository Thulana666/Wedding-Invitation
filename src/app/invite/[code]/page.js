import WeddingExperience from '@/components/experience/WeddingExperience';
import { getGuestByCode, toPublicGuest } from '@/lib/server/guests';

export const dynamic = 'force-dynamic';

// Personal links share the main preview, but are never indexed.
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function InvitePage({ params }) {
  const { code } = await params;
  let guest = null;
  try {
    guest = toPublicGuest(await getGuestByCode(code));
  } catch (error) {
    console.error('[invite]', error);
  }
  return <WeddingExperience invitation={guest} inviteNotFound={!guest} />;
}
