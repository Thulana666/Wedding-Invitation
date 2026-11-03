'use client';

import { wedding } from '@/config/wedding';
import { Divider, Monogram } from '@/components/ui/Ornament';
import styles from './Footer.module.css';

export default function Footer() {
  const { couple, date, venue } = wedding;

  const replay = () => {
    try {
      sessionStorage.removeItem('ds-opened');
    } catch {
      /* storage unavailable */
    }
    document.documentElement.removeAttribute('data-opened');
    window.scrollTo({ top: 0 });
    window.location.reload();
  };

  return (
    <footer className={styles.footer}>
      <div className="container">
        <Monogram className={styles.mono} left={couple.monogram.left} right={couple.monogram.right} />
        <p className={`script ${styles.names}`}>{couple.names}</p>
        <Divider className={styles.divider} />
        <p className={styles.meta}>
          {date.long} · {venue.short}
        </p>
        <p className={styles.thanks}>With love and gratitude, from both our families.</p>
        <button type="button" className={styles.replay} onClick={replay}>
          View the invitation again
        </button>
      </div>
    </footer>
  );
}
