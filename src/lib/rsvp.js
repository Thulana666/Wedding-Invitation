import { wedding } from '@/config/wedding';

/**
 * RSVP validation shared by the guest form (per step) and the API (full).
 * Returns { ok, data, errors } where errors maps field → message.
 */

const LIMITS = { name: 120, phone: 24, email: 160, short: 300, long: 1000 };

const eventIds = wedding.events.map((e) => e.id);
const dietaryIds = wedding.rsvp.dietaryOptions.map((o) => o.id);
const transportIds = wedding.rsvp.transportOptions.map((o) => o.id);

function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

export function normalizePhone(value) {
  return clean(value, LIMITS.phone).replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
}

export function isValidPhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export const RSVP_STEPS = {
  guest: ['fullName', 'phone', 'email'],
  attendance: ['attending'],
  party: ['companions', 'companionNames', 'events'],
  preferences: ['dietary', 'dietaryNotes', 'allergies', 'transport', 'transportNotes'],
  notes: ['notes'],
};

export function validateRsvp(input, { maxGuests = wedding.rsvp.defaultMaxGuests, fields } = {}) {
  const errors = {};
  const only = fields ? new Set(fields) : null;
  const check = (field) => !only || only.has(field);

  const data = {
    fullName: clean(input?.fullName, LIMITS.name),
    phone: normalizePhone(input?.phone ?? ''),
    email: clean(input?.email, LIMITS.email).toLowerCase(),
    attending: input?.attending === 'yes' ? 'yes' : input?.attending === 'no' ? 'no' : '',
    companions: 0,
    companionNames: [],
    events: [],
    dietary: '',
    dietaryNotes: '',
    allergies: '',
    transport: '',
    transportNotes: '',
    notes: clean(input?.notes, LIMITS.long),
  };

  if (check('fullName')) {
    if (data.fullName.length < 2) errors.fullName = 'Please enter your full name.';
  }
  if (check('phone')) {
    if (!data.phone) errors.phone = 'Please enter a contact number.';
    else if (!isValidPhone(data.phone)) errors.phone = 'Please enter a valid phone number.';
  }
  if (check('email') && data.email && !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address, or leave it empty.';
  }
  if (check('attending') && !data.attending) {
    errors.attending = 'Please let us know if you can join us.';
  }

  if (data.attending === 'yes') {
    const maxCompanions = Math.max(0, maxGuests - 1);
    const companions = Number.parseInt(input?.companions ?? 0, 10);
    data.companions = Number.isFinite(companions) ? companions : 0;

    const names = Array.isArray(input?.companionNames) ? input.companionNames : [];
    data.companionNames = names.slice(0, maxCompanions).map((n) => clean(n, LIMITS.name));

    const events = Array.isArray(input?.events) ? input.events : [];
    data.events = [...new Set(events.filter((id) => eventIds.includes(id)))];

    data.dietary = dietaryIds.includes(input?.dietary) ? input.dietary : '';
    data.dietaryNotes = clean(input?.dietaryNotes, LIMITS.short);
    data.allergies = clean(input?.allergies, LIMITS.short);
    data.transport = transportIds.includes(input?.transport) ? input.transport : '';
    data.transportNotes = clean(input?.transportNotes, LIMITS.short);

    if (check('companions')) {
      if (data.companions < 0 || data.companions > maxCompanions) {
        errors.companions =
          maxCompanions === 0
            ? 'This invitation is for you only.'
            : `You can bring up to ${maxCompanions} accompanying ${maxCompanions === 1 ? 'guest' : 'guests'}.`;
      }
    }
    if (check('companionNames')) {
      const count = Math.min(Math.max(data.companions, 0), maxCompanions);
      data.companionNames = data.companionNames.slice(0, count);
      for (let i = 0; i < count; i += 1) {
        if (!data.companionNames[i] || data.companionNames[i].length < 2) {
          errors.companionNames = 'Please add the name of each accompanying guest.';
          break;
        }
      }
    }
    if (check('events') && data.events.length === 0) {
      errors.events = 'Please choose at least one event.';
    }
    if (check('dietary') && !data.dietary) {
      errors.dietary = 'Please choose a meal preference.';
    }
    if (check('dietaryNotes') && data.dietary === 'other' && !data.dietaryNotes) {
      errors.dietaryNotes = 'Please tell us your meal preference.';
    }
    if (check('transport') && !data.transport) {
      errors.transport = 'Please choose a transport option.';
    }
  }

  return { ok: Object.keys(errors).length === 0, data, errors };
}

export function partySize(guest) {
  return guest.status === 'attending' ? 1 + (guest.companions || 0) : 0;
}

export function optionLabel(options, id) {
  return options.find((o) => o.id === id)?.label || '';
}

export const dietaryLabel = (id) => optionLabel(wedding.rsvp.dietaryOptions, id);
export const transportLabel = (id) => optionLabel(wedding.rsvp.transportOptions, id);
export const eventLabel = (id) => wedding.events.find((e) => e.id === id)?.title || id;
