'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { wedding } from '@/config/wedding';
import { downloadIcs } from '@/lib/calendar';
import { WeddingSymbol } from '@/components/ui/Ornament';
import styles from './Rsvp.module.css';

const EASE = [0.22, 1, 0.36, 1];

export default function RsvpConfirmation({ guest, onEdit }) {
  const attending = guest.status === 'attending';
  const firstName = guest.fullName.split(' ')[0];
  const [qr, setQr] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = `${window.location.origin}/invite/${guest.code}`;
    setLink(url);
    if (!attending) return;
    QRCode.toDataURL(url, { margin: 1, width: 360, errorCorrectionLevel: 'M', color: { dark: '#352B2B', light: '#FFFFFF' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [attending, guest.code]);

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
        <div className={styles.pass}>
          <div className={styles.passInfo}>
            <p className={styles.passLabel}>Your entry pass</p>
            <p className={styles.passName}>{guest.fullName}</p>
            <p className={styles.passMeta}>
              {party} {party === 1 ? 'guest' : 'guests'}
              {eventNames.length ? ` · ${eventNames.join(' & ')}` : ''}
            </p>
            <p className={styles.passMeta}>{wedding.date.long}</p>
            <p className={styles.passCode}>{guest.code}</p>
          </div>
          <div className={styles.qr}>
            {qr ? <img src={qr} alt={`QR entry pass for ${guest.fullName}`} width={150} height={150} /> : <span className={styles.qrLoading} />}
          </div>
        </div>
      )}
      {attending && <p className={styles.passHint}>Please show this QR code at the entrance. Take a screenshot to keep it handy.</p>}

      <div className={styles.doneActions}>
        {attending && (
          <button type="button" className="btn btn-gold" onClick={downloadIcs}>
            Add to calendar
          </button>
        )}
        {!guest.checkedIn && (
          <button type="button" className="btn btn-line" onClick={onEdit}>
            {attending ? 'Edit my response' : 'Changed your mind? Update'}
          </button>
        )}
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
