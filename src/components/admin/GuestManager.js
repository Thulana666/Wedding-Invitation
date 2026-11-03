'use client';

import { useCallback, useEffect, useState } from 'react';
import { wedding } from '@/config/wedding';
import { partySize } from '@/lib/rsvp';
import GuestForm from './GuestForm';
import Modal from './Modal';
import { EXPORTS } from './Overview';
import styles from './Admin.module.css';

const STATUS_LABEL = { pending: 'Pending', attending: 'Attending', declined: 'Declined' };
const DEFAULT_QUERY = { search: '', status: '', event: '', sort: 'created', dir: 'desc', page: 1, pageSize: 20 };

const shortDate = (iso) =>
  iso ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: wedding.date.timezone }).format(new Date(iso)) : '—';

export default function GuestManager({ openNew }) {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [searchInput, setSearchInput] = useState('');
  const [data, setData] = useState({ guests: [], total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(openNew ? 'new' : null);
  const [deleting, setDeleting] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v !== null));
    try {
      const res = await fetch(`/api/admin/guests?${params}`, { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/admin/login?next=/admin/guests';
        return;
      }
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError('Could not load guests.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setQuery((q) => (q.search === searchInput ? q : { ...q, search: searchInput, page: 1 })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilter = (key, value) => setQuery((q) => ({ ...q, [key]: value, page: 1 }));
  const sortBy = (key) => setQuery((q) => ({ ...q, sort: key, dir: q.sort === key && q.dir === 'asc' ? 'desc' : 'asc', page: 1 }));

  const updateStatus = async (guest, status) => {
    const res = await fetch(`/api/admin/guests/${guest.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  };

  const remove = async () => {
    const res = await fetch(`/api/admin/guests/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    if (res.ok) load();
  };

  const sortHead = (id, children) => (
    <th key={id} aria-sort={query.sort === id ? (query.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={styles.sortBtn} onClick={() => sortBy(id)}>
        {children}
        <span aria-hidden="true">{query.sort === id ? (query.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  );

  const filtersActive = ['status', 'event'].some((k) => query[k]) || query.search;

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Guest management</p>
          <h1 className={styles.pageTitle}>Guests</h1>
          <p className={styles.pageSub}>{data.total} {data.total === 1 ? 'invitation' : 'invitations'} match</p>
        </div>
        <div className={styles.headActions}>
          <div className={styles.dropdown}>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setExportOpen((o) => !o)} aria-expanded={exportOpen}>
              Export CSV ▾
            </button>
            {exportOpen && (
              <ul className={styles.menu} onClick={() => setExportOpen(false)}>
                {EXPORTS.map((e) => (
                  <li key={e.list}>
                    <a href={`/api/admin/export?list=${e.list}`} download>
                      {e.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setEditing('new')}>
            Add guest
          </button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className="sr-only">Search guests</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input type="search" placeholder="Search name, phone, email, code…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </label>
        <select aria-label="Filter by status" value={query.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="attending">Attending</option>
          <option value="declined">Declined</option>
          <option value="pending">Pending</option>
          <option value="responded">Responded</option>
        </select>
        <select aria-label="Filter by event" value={query.event} onChange={(e) => setFilter('event', e.target.value)}>
          <option value="">All events</option>
          {wedding.events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
            </option>
          ))}
        </select>
        {filtersActive && (
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => {
              setSearchInput('');
              setQuery(DEFAULT_QUERY);
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className={styles.tableCard}>
        {error && <p className={styles.formError}>{error}</p>}
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                {sortHead('name', 'Guest')}
                <th>Contact</th>
                {sortHead('status', 'Status')}
                {sortHead('party', 'Party')}
                <th>Allergies &amp; notes</th>
                {sortHead('responded', 'Replied')}
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {!loading && data.guests.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>
                    {filtersActive ? 'No guests match these filters.' : 'No guests yet — add your first guest or share the RSVP link.'}
                  </td>
                </tr>
              )}
              {data.guests.map((g) => (
                <tr key={g.id}>
                  <td>
                    <button type="button" className={styles.nameBtn} onClick={() => setEditing(g)}>
                      {g.fullName}
                    </button>
                    {g.companionNames.length > 0 && <span className={styles.sub}>+ {g.companionNames.join(', ')}</span>}
                    {g.source === 'open' && <span className={styles.tag}>Open RSVP</span>}
                  </td>
                  <td>
                    {g.phone ? <a href={`tel:${g.phone}`}>{g.phone}</a> : '—'}
                    {g.email && <span className={styles.sub}>{g.email}</span>}
                  </td>
                  <td>
                    <select
                      className={`${styles.statusSelect} ${styles[`status_${g.status}`]}`}
                      value={g.status}
                      onChange={(e) => updateStatus(g, e.target.value)}
                      aria-label={`RSVP status for ${g.fullName}`}
                    >
                      {Object.entries(STATUS_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={styles.num}>
                    {g.status === 'attending' ? partySize(g) : '—'}
                    <span className={styles.sub}>of {g.maxGuests}</span>
                  </td>
                  <td className={styles.notesCell}>
                    {g.allergies && <span className={styles.allergy}>⚠ {g.allergies}</span>}
                    {g.notes && <span className={styles.sub}>{g.notes}</span>}
                    {!g.allergies && !g.notes && '—'}
                  </td>
                  <td>{shortDate(g.respondedAt)}</td>
                  <td className={styles.rowActions}>
                    <button type="button" className={styles.linkBtn} onClick={() => setEditing(g)}>
                      Edit
                    </button>
                    <button type="button" className={`${styles.linkBtn} ${styles.danger}`} onClick={() => setDeleting(g)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className={styles.pager}>
          <span>
            Page {data.page} of {data.pages} · {data.total} total
          </span>
          <label>
            <span className="sr-only">Rows per page</span>
            <select value={query.pageSize} onChange={(e) => setFilter('pageSize', Number(e.target.value))}>
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </label>
          <div className={styles.inline}>
            <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} disabled={data.page <= 1} onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}>
              Previous
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} disabled={data.page >= data.pages} onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}>
              Next
            </button>
          </div>
        </footer>
      </div>

      {editing && (
        <GuestForm
          key={editing === 'new' ? 'new' : editing.id}
          guest={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => load()}
        />
      )}

      {deleting && (
        <Modal
          title="Delete guest?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={remove}>
                Delete permanently
              </button>
            </>
          }
        >
          <p>
            This permanently removes <strong>{deleting.fullName}</strong> and their RSVP. Their personal invitation link will stop working.
          </p>
        </Modal>
      )}
    </div>
  );
}
