import { wedding } from '@/config/wedding';
import { isValidEmail, isValidPhone, normalizePhone } from '@/lib/rsvp';

const STATUSES = ['pending', 'attending', 'declined'];
const eventIds = wedding.events.map((e) => e.id);

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Validates a guest record created or edited from the admin dashboard. */
export function validateAdminGuest(input) {
  const errors = {};
  const maxGuests = Number.parseInt(input?.maxGuests, 10);
  const status = STATUSES.includes(input?.status) ? input.status : 'pending';

  const data = {
    fullName: text(input?.fullName, 120),
    phone: normalizePhone(input?.phone ?? ''),
    email: text(input?.email, 160).toLowerCase(),
    maxGuests: Number.isFinite(maxGuests) ? maxGuests : wedding.rsvp.defaultMaxGuests,
    status,
    companions: 0,
    companionNames: [],
    events: [],
    notes: text(input?.notes, 1000),
    adminNotes: text(input?.adminNotes, 1000),
  };

  if (data.fullName.length < 2) errors.fullName = 'Enter the guest’s full name.';
  if (data.phone && !isValidPhone(data.phone)) errors.phone = 'Enter a valid phone number.';
  if (data.email && !isValidEmail(data.email)) errors.email = 'Enter a valid email address.';
  if (data.maxGuests < 1 || data.maxGuests > wedding.rsvp.maxGuestsLimit) {
    errors.maxGuests = `Party size must be between 1 and ${wedding.rsvp.maxGuestsLimit}.`;
  }

  if (status === 'attending') {
    const companions = Number.parseInt(input?.companions ?? 0, 10);
    data.companions = Number.isFinite(companions) ? companions : 0;
    if (data.companions < 0 || data.companions > Math.max(0, data.maxGuests - 1)) {
      errors.companions = 'Accompanying guests exceed the allowed party size.';
    }
    const names = Array.isArray(input?.companionNames) ? input.companionNames : [];
    data.companionNames = names
      .slice(0, Math.max(0, Math.min(data.companions, data.maxGuests - 1)))
      .map((n) => text(n, 120));
    const events = Array.isArray(input?.events) ? input.events.filter((id) => eventIds.includes(id)) : [];
    data.events = events.length ? [...new Set(events)] : [...eventIds];
  }

  return { ok: Object.keys(errors).length === 0, data, errors };
}
