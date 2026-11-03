import { randomInt } from 'node:crypto';
import { query } from './db';
import { wedding } from '@/config/wedding';

/** Guest / invitation data access. One row per invitation (party). */

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;

export function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

export function normalizeCode(value) {
  const code = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return code.length === CODE_LENGTH && [...code].every((c) => CODE_ALPHABET.includes(c)) ? code : null;
}

const iso = (value) => (value ? new Date(value).toISOString() : null);
const jsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export function toGuest(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    fullName: row.full_name,
    phone: row.phone || '',
    email: row.email || '',
    maxGuests: row.max_guests,
    status: row.status,
    companions: row.companions,
    companionNames: jsonArray(row.companion_names),
    events: jsonArray(row.events),
    allergies: row.allergies || '',
    notes: row.notes || '',
    adminNotes: row.admin_notes || '',
    source: row.source,
    firstRespondedAt: iso(row.first_responded_at),
    respondedAt: iso(row.responded_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

/** The subset a guest may see about their own invitation. */
export function toPublicGuest(guest) {
  if (!guest) return null;
  const { id, adminNotes, source, createdAt, updatedAt, firstRespondedAt, ...rest } = guest;
  return rest;
}

export async function getGuestByCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  const { rows } = await query('SELECT * FROM guests WHERE code = $1', [normalized]);
  return toGuest(rows[0]);
}

export async function getGuestById(id) {
  const { rows } = await query('SELECT * FROM guests WHERE id = $1', [id]);
  return toGuest(rows[0]);
}

async function insertWithUniqueCode(buildQuery) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const { rows } = await query(...buildQuery(generateCode()));
      return toGuest(rows[0]);
    } catch (error) {
      if (error?.code === '23505' && String(error?.detail || error?.message).includes('code')) continue;
      throw error;
    }
  }
  throw new Error('Could not generate a unique invitation code.');
}

const RESPONSE_COLUMNS = 'status, companions, companion_names, events, allergies, notes';

function responseValues(data) {
  const attending = data.attending === 'yes';
  return [
    attending ? 'attending' : 'declined',
    attending ? data.companions : 0,
    JSON.stringify(attending ? data.companionNames : []),
    JSON.stringify(attending ? data.events : []),
    attending ? data.allergies || null : null,
    data.notes || null,
  ];
}

/** Creates a new guest from an open (link-shared) RSVP. */
export async function createOpenRsvp(data) {
  return insertWithUniqueCode((code) => [
    `INSERT INTO guests (code, full_name, phone, email, max_guests, source, ${RESPONSE_COLUMNS},
       first_responded_at, responded_at)
     VALUES ($1, $2, $3, $4, $5, 'open', $6, $7, $8::jsonb, $9::jsonb, $10, $11, now(), now())
     RETURNING *`,
    [code, data.fullName, data.phone, data.email || null, wedding.rsvp.defaultMaxGuests, ...responseValues(data)],
  ]);
}

/** Updates the RSVP of an existing invitation. */
export async function updateRsvp(code, data) {
  const { rows } = await query(
    `UPDATE guests SET
       full_name = $2, phone = $3, email = $4,
       status = $5, companions = $6, companion_names = $7::jsonb, events = $8::jsonb,
       allergies = $9, notes = $10,
       first_responded_at = COALESCE(first_responded_at, now()),
       responded_at = now(), updated_at = now()
     WHERE code = $1
     RETURNING *`,
    [code, data.fullName, data.phone, data.email || null, ...responseValues(data)],
  );
  return toGuest(rows[0]);
}

/** Admin: create a guest manually. `data` is validated by the caller. */
export async function createGuest(data) {
  return insertWithUniqueCode((code) => [
    `INSERT INTO guests (code, full_name, phone, email, max_guests, admin_notes, source, ${RESPONSE_COLUMNS},
       first_responded_at, responded_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'admin', $7, $8, $9::jsonb, $10::jsonb, $11, $12,
       CASE WHEN $7::text = 'pending' THEN NULL ELSE now() END,
       CASE WHEN $7::text = 'pending' THEN NULL ELSE now() END)
     RETURNING *`,
    [code, data.fullName, data.phone || null, data.email || null, data.maxGuests, data.adminNotes || null, ...adminResponseValues(data)],
  ]);
}

function adminResponseValues(data) {
  const attending = data.status === 'attending';
  return [
    data.status,
    attending ? data.companions : 0,
    JSON.stringify(attending ? data.companionNames : []),
    JSON.stringify(attending ? data.events : []),
    attending ? data.allergies || null : null,
    data.notes || null,
  ];
}

/** Admin: update any field of a guest. */
export async function updateGuest(id, data) {
  const { rows } = await query(
    `UPDATE guests SET
       full_name = $2, phone = $3, email = $4, max_guests = $5, admin_notes = $6,
       status = $7, companions = $8, companion_names = $9::jsonb, events = $10::jsonb,
       allergies = $11, notes = $12,
       first_responded_at = CASE WHEN $7::text = 'pending' THEN first_responded_at ELSE COALESCE(first_responded_at, now()) END,
       responded_at = CASE WHEN $7::text = status AND responded_at IS NOT NULL THEN responded_at
                           WHEN $7::text = 'pending' THEN NULL ELSE now() END,
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, data.fullName, data.phone || null, data.email || null, data.maxGuests, data.adminNotes || null, ...adminResponseValues(data)],
  );
  return toGuest(rows[0]);
}

export async function deleteGuest(id) {
  const { rows } = await query('DELETE FROM guests WHERE id = $1 RETURNING id', [id]);
  return rows.length > 0;
}

const SORTS = {
  name: 'lower(full_name)',
  status: 'status',
  party: '(CASE WHEN status = \'attending\' THEN 1 + companions ELSE 0 END)',
  responded: 'responded_at',
  created: 'created_at',
};

export async function listGuests({
  search = '',
  status = '',
  event = '',
  source = '',
  sort = 'created',
  dir = 'desc',
  page = 1,
  pageSize = 20,
} = {}) {
  const where = [];
  const params = [];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replaceAll('?', `$${params.length}`));
  };

  if (search) {
    add(
      `(full_name ILIKE ? OR phone ILIKE ? OR email ILIKE ? OR code ILIKE ? OR companion_names::text ILIKE ?)`,
      `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`,
    );
  }
  if (['pending', 'attending', 'declined'].includes(status)) add('status = ?', status);
  if (status === 'responded') where.push(`status <> 'pending'`);
  if (event) add('events @> ?::jsonb', JSON.stringify([event]));
  if (['admin', 'open'].includes(source)) add('source = ?', source);

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderBy = SORTS[sort] || SORTS.created;
  const direction = dir === 'asc' ? 'ASC' : 'DESC';
  const size = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const current = Math.max(Number(page) || 1, 1);

  const [{ rows: countRows }, { rows }] = await Promise.all([
    query(`SELECT count(*)::int AS total FROM guests ${whereSql}`, params),
    query(
      `SELECT * FROM guests ${whereSql}
       ORDER BY ${orderBy} ${direction} NULLS LAST, id ${direction}
       LIMIT ${size} OFFSET ${(current - 1) * size}`,
      params,
    ),
  ]);

  const total = countRows[0]?.total ?? 0;
  return { guests: rows.map(toGuest), total, page: current, pageSize: size, pages: Math.max(1, Math.ceil(total / size)) };
}

export async function allGuests() {
  const { rows } = await query('SELECT * FROM guests ORDER BY lower(full_name) ASC, id ASC');
  return rows.map(toGuest);
}

export async function getStats() {
  const [{ rows: totals }, { rows: trend }, { rows: sizes }, { rows: events }] =
    await Promise.all([
      query(`
        SELECT
          count(*)::int AS invitations,
          coalesce(sum(max_guests), 0)::int AS seats,
          count(*) FILTER (WHERE status <> 'pending')::int AS responses,
          count(*) FILTER (WHERE status = 'attending')::int AS attending,
          count(*) FILTER (WHERE status = 'declined')::int AS declined,
          count(*) FILTER (WHERE status = 'pending')::int AS pending,
          coalesce(sum(companions) FILTER (WHERE status = 'attending'), 0)::int AS companions,
          coalesce(sum(1 + companions) FILTER (WHERE status = 'attending'), 0)::int AS expected
        FROM guests`),
      query(`
        SELECT to_char(first_responded_at AT TIME ZONE 'Asia/Colombo', 'YYYY-MM-DD') AS day,
               count(*) FILTER (WHERE status = 'attending')::int AS attending,
               count(*) FILTER (WHERE status = 'declined')::int AS declined
        FROM guests WHERE first_responded_at IS NOT NULL
        GROUP BY 1 ORDER BY 1`),
      query(`
        SELECT (1 + companions)::int AS size, count(*)::int AS parties
        FROM guests WHERE status = 'attending' GROUP BY 1 ORDER BY 1`),
      query(`
        SELECT e.id, sum(1 + g.companions)::int AS people, count(*)::int AS parties
        FROM guests g, jsonb_array_elements_text(g.events) AS e(id)
        WHERE g.status = 'attending' GROUP BY 1`),
    ]);

  return { totals: totals[0], trend, sizes, events };
}
