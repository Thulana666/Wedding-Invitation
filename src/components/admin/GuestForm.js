'use client';

import { useEffect, useState } from 'react';
import { wedding } from '@/config/wedding';
import Modal from './Modal';
import styles from './Admin.module.css';

const { rsvp, events } = wedding;

const blank = {
  fullName: '',
  phone: '',
  email: '',
  maxGuests: rsvp.defaultMaxGuests,
  status: 'pending',
  companions: 0,
  companionNames: [],
  events: events.map((e) => e.id),
  notes: '',
  adminNotes: '',
};

const when = (iso) =>
  iso ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: wedding.date.timezone }).format(new Date(iso)) : '—';

function InviteLink({ guest }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(`${window.location.origin}/invite/${guest.code}`);
  }, [guest.code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Dear ${guest.fullName}, you are warmly invited to the wedding of ${wedding.couple.names}. Please view your invitation and RSVP here: ${url}`)}`;

  return (
    <div className={styles.inviteBox}>
      <div className={styles.inviteInfo}>
        <p className={styles.fieldLabel}>Personal invitation link</p>
        <code>{url}</code>
        <p className={styles.muted}>Send this link to the guest — it opens their personal invitation and RSVP.</p>
        <div className={styles.inline}>
          <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={copy}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <a className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} href={whatsapp} target="_blank" rel="noopener noreferrer">
            Share on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function GuestForm({ guest, onClose, onSaved }) {
  const isNew = !guest;
  const [form, setForm] = useState(() => ({ ...blank, ...(guest || {}), events: guest?.events?.length ? guest.events : blank.events }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(guest);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const maxCompanions = Math.max(0, Number(form.maxGuests || 1) - 1);
  const attending = form.status === 'attending';

  const save = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    try {
      const res = await fetch(isNew ? '/api/admin/guests' : `/api/admin/guests/${guest.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, maxGuests: Number(form.maxGuests), companions: Number(form.companions) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.errors || {});
        setError(data.error || 'Could not save.');
        return;
      }
      onSaved(data.guest, isNew);
      if (isNew) setCurrent(data.guest);
      else onClose();
    } finally {
      setBusy(false);
    }
  };

  // After creating, show the generated invitation link instead of the form.
  if (isNew && current) {
    return (
      <Modal
        title="Guest added"
        onClose={onClose}
        footer={
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>
            Done
          </button>
        }
      >
        <p>
          <strong>{current.fullName}</strong> has been added with a party of up to {current.maxGuests}. Send them their personal link:
        </p>
        <InviteLink guest={current} />
      </Modal>
    );
  }

  const err = (k) => errors[k] && <span className={styles.fieldError}>{errors[k]}</span>;

  return (
    <Modal
      wide
      title={isNew ? 'Add guest' : `Edit ${guest.fullName}`}
      onClose={onClose}
      footer={
        <>
          {error && <span className={styles.formError}>{error}</span>}
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="guest-form" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy}>
            {busy ? 'Saving…' : isNew ? 'Add guest' : 'Save changes'}
          </button>
        </>
      }
    >
      {!isNew && current && (
        <>
          <InviteLink guest={current} />
          <dl className={styles.metaRow}>
            <div>
              <dt>Source</dt>
              <dd>{current.source === 'open' ? 'Open RSVP link' : 'Added by admin'}</dd>
            </div>
            <div>
              <dt>Responded</dt>
              <dd>{when(current.respondedAt)}</dd>
            </div>
          </dl>
        </>
      )}

      <form id="guest-form" className={styles.formGrid} onSubmit={save} noValidate>
        <label className={`${styles.field} ${styles.span2}`}>
          <span>Full name *</span>
          <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} aria-invalid={!!errors.fullName} />
          {err('fullName')}
        </label>
        <label className={styles.field}>
          <span>Contact number</span>
          <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errors.phone} />
          {err('phone')}
        </label>
        <label className={styles.field}>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} />
          {err('email')}
        </label>
        <label className={styles.field}>
          <span>Allowed party size (incl. guest)</span>
          <input type="number" min="1" max={rsvp.maxGuestsLimit} value={form.maxGuests} onChange={(e) => set('maxGuests', e.target.value)} aria-invalid={!!errors.maxGuests} />
          {err('maxGuests')}
        </label>
        <label className={styles.field}>
          <span>RSVP status</span>
          <select value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="pending">Pending</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
          </select>
        </label>

        {attending && (
          <>
            <label className={styles.field}>
              <span>Accompanying guests (max {maxCompanions})</span>
              <input
                type="number"
                min="0"
                max={maxCompanions}
                value={form.companions}
                onChange={(e) => {
                  const n = Math.max(0, Math.min(Number(e.target.value), maxCompanions));
                  setForm((f) => ({ ...f, companions: n, companionNames: Array.from({ length: n }, (_, i) => f.companionNames[i] || '') }));
                }}
                aria-invalid={!!errors.companions}
              />
              {err('companions')}
            </label>
            <fieldset className={styles.field}>
              <legend>Events</legend>
              <div className={styles.inline}>
                {events.map((ev) => (
                  <label key={ev.id} className={styles.check}>
                    <input
                      type="checkbox"
                      checked={form.events.includes(ev.id)}
                      onChange={(e) => set('events', e.target.checked ? [...form.events, ev.id] : form.events.filter((x) => x !== ev.id))}
                    />
                    {ev.title}
                  </label>
                ))}
              </div>
            </fieldset>
            {Array.from({ length: Number(form.companions) || 0 }, (_, i) => (
              <label key={i} className={styles.field}>
                <span>Guest {i + 2} name</span>
                <input
                  value={form.companionNames[i] || ''}
                  onChange={(e) => {
                    const names = [...form.companionNames];
                    names[i] = e.target.value;
                    set('companionNames', names);
                  }}
                />
              </label>
            ))}
          </>
        )}

        <label className={`${styles.field} ${styles.span2}`}>
          <span>Guest notes</span>
          <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </label>
        <label className={`${styles.field} ${styles.span2}`}>
          <span>Private admin notes</span>
          <textarea rows={2} value={form.adminNotes} onChange={(e) => set('adminNotes', e.target.value)} placeholder="e.g. table number, relation" />
        </label>
      </form>
    </Modal>
  );
}
