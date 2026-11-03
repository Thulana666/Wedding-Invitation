'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { wedding } from '@/config/wedding';
import { downloadIcs } from '@/lib/calendar';
import { WeddingSymbol } from '@/components/ui/Ornament';
import styles from './Rsvp.module.css';

const EASE = [0.22, 1, 0.36, 1];

export default function RsvpConfirmation({ guest, onEdit }) {
  const attending = guest.status === 'attending';
  const firstName = guest.fullName.split(' ')[0];
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLink(`${window.location.origin}/invite/${guest.code}`);
  }, [guest.code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable */
    }
  };

  const party = 1 + (guest.companions || 0);
  const eventNames = wedding.events.filter((e) => guest.events?.includes(e.id)).map((e) => e.title);

  return (
    <motion.div
      className={styles.done}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.8, ease: EASE }}
      role="status"
    >
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1, ease: EASE, delay: 0.1 }}>
        <WeddingSymbol className={styles.doneSymbol} size={80} />
      </motion.div>
      <p className="kicker">{attending ? 'RSVP confirmed' : 'Response received'}</p>
      <h3 className={`display ${styles.doneTitle}`}>Thank you, {firstName}</h3>
      <p className={styles.doneMessage}>{attending ? wedding.rsvp.acceptedMessage : wedding.rsvp.declinedMessage}</p>

      {attending && (
        <div className={styles.summary}>
          <p className={styles.summaryLabel}>Your reply</p>
          <p className={styles.summaryName}>{guest.fullName}</p>
          <p className={styles.summaryMeta}>
            {party} {party === 1 ? 'guest' : 'guests'}
            {eventNames.length ? ` · ${eventNames.join(' & ')}` : ''}
          </p>
          <p className={styles.summaryMeta}>
            {wedding.date.long} · {wedding.venue.short}
          </p>
        </div>
      )}

      <div className={styles.doneActions}>
        {attending && (
          <button type="button" className="btn btn-gold" onClick={downloadIcs}>
            Add to calendar
          </button>
        )}
        <button type="button" className="btn btn-line" onClick={onEdit}>
          {attending ? 'Edit my response' : 'Changed your mind? Update'}
        </button>
      </div>

      {link && (
        <div className={styles.linkBox}>
          <p>Your personal RSVP link — use it to view or change your response anytime:</p>
          <div>
            <code>{link}</code>
            <button type="button" onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
