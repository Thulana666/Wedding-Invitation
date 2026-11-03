import { wedding } from '@/config/wedding';
import { dietaryLabel, eventLabel, partySize, transportLabel } from '@/lib/rsvp';
import { requireAdmin } from '@/lib/server/auth';
import { toCsv } from '@/lib/server/csv';
import { allGuests } from '@/lib/server/guests';
import { handle, jsonError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

const colombo = (iso) =>
  iso
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: wedding.date.timezone,
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso))
    : '';

const STATUS = { pending: 'Pending', attending: 'Attending', declined: 'Declined' };

const col = {
  name: { label: 'Guest name', value: (g) => g.fullName },
  phone: { label: 'Contact number', value: (g) => g.phone },
  email: { label: 'Email', value: (g) => g.email },
  status: { label: 'RSVP status', value: (g) => STATUS[g.status] },
  allowed: { label: 'Allowed party size', value: (g) => g.maxGuests },
  party: { label: 'Party size', value: (g) => partySize(g) },
  companions: { label: 'Accompanying guests', value: (g) => g.companions },
  companionNames: { label: 'Accompanying guest names', value: (g) => g.companionNames },
  events: { label: 'Events', value: (g) => g.events.map(eventLabel) },
  dietary: { label: 'Meal preference', value: (g) => dietaryLabel(g.dietary) },
  dietaryNotes: { label: 'Meal notes', value: (g) => g.dietaryNotes },
  allergies: { label: 'Food allergies', value: (g) => g.allergies },
  transport: { label: 'Transport', value: (g) => transportLabel(g.transport) },
  transportNotes: { label: 'Transport notes', value: (g) => g.transportNotes },
  notes: { label: 'Guest notes', value: (g) => g.notes },
  adminNotes: { label: 'Admin notes', value: (g) => g.adminNotes },
  responded: { label: 'Responded (Sri Lanka time)', value: (g) => colombo(g.respondedAt) },
  checkedIn: { label: 'Checked in', value: (g) => colombo(g.checkedInAt) },
  checkedInCount: { label: 'Checked-in count', value: (g) => g.checkedInCount ?? '' },
  code: { label: 'Invitation code', value: (g) => g.code },
  source: { label: 'Source', value: (g) => (g.source === 'open' ? 'Open RSVP link' : 'Added by admin') },
};

const eventColumns = wedding.events.map((e) => ({ label: e.title, value: (g) => (g.events.includes(e.id) ? 'Yes' : 'No') }));
const attending = (g) => g.status === 'attending';

const LISTS = {
  all: {
    filter: () => true,
    columns: [col.name, col.phone, col.email, col.status, col.allowed, col.party, col.companions, col.companionNames, col.events, col.dietary, col.dietaryNotes, col.allergies, col.transport, col.transportNotes, col.notes, col.adminNotes, col.responded, col.checkedIn, col.checkedInCount, col.code, col.source],
  },
  confirmed: {
    filter: attending,
    columns: [col.name, col.phone, col.email, col.party, col.companionNames, col.events, col.dietary, col.allergies, col.transport, col.responded, col.code],
  },
  declined: {
    filter: (g) => g.status === 'declined',
    columns: [col.name, col.phone, col.email, col.notes, col.responded],
  },
  pending: {
    filter: (g) => g.status === 'pending',
    columns: [col.name, col.phone, col.email, col.allowed, col.code],
  },
  dietary: {
    filter: attending,
    columns: [col.name, col.party, col.dietary, col.dietaryNotes, col.allergies, col.companionNames],
  },
  transport: {
    filter: (g) => attending(g) && g.transport && g.transport !== 'own',
    columns: [col.name, col.phone, col.party, col.transport, col.transportNotes],
  },
  events: {
    filter: attending,
    columns: [col.name, col.phone, col.party, ...eventColumns, col.companionNames],
  },
};

export const GET = handle(async (request) => {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const list = new URL(request.url).searchParams.get('list') || 'all';
  const spec = LISTS[list];
  if (!spec) return jsonError('Unknown export list.', 400);

  const guests = (await allGuests()).filter(spec.filter);
  const csv = toCsv(spec.columns, guests);
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="dilki-supun-${list}-guests-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
});
