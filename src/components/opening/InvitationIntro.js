'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { wedding } from '@/config/wedding';
import GoldDust from '@/components/ambient/GoldDust';
import { CornerFlourish, Divider, WeddingSymbol } from '@/components/ui/Ornament';
import styles from './InvitationIntro.module.css';

const EASE = [0.22, 1, 0.36, 1];
const DOOR = [0.65, 0, 0.35, 1];

function CardFace({ guestName, withMusic, onToggleMusic, onOpen, inert }) {
  const { families, couple, date, venue, invitation } = wedding;
  const tab = inert ? -1 : undefined;
  return (
    <div className={styles.card}>
      {['tl', 'tr', 'bl', 'br'].map((c) => (
        <CornerFlourish key={c} className={`${styles.corner} ${styles[c]}`} />
      ))}

      {guestName && <p className={styles.dear}>Dear {guestName},</p>}

      <WeddingSymbol className={styles.symbol} size={74} />

      <div className={styles.families}>
        <p>
          <span>{families.bride.father}</span> <span className={styles.amp}>&amp;</span> <span>{families.bride.mother}</span>
        </p>
        <p className={styles.and}>and</p>
        <p>
          <span>{families.groom.father}</span> <span className={styles.amp}>&amp;</span> <span>{families.groom.mother}</span>
        </p>
      </div>

      <p className={styles.request}>{invitation.request}</p>

      <p className={`script ${styles.names}`}>
        <span>{couple.bride}</span> <span className={styles.namesAmp}>&amp;</span> <span>{couple.groom}</span>
      </p>

      <Divider className={styles.divider} width={150} />

      <p className={styles.date}>{date.long}</p>
      <p className={styles.venue}>{venue.short}</p>

      <button type="button" className={`btn btn-gold ${styles.open}`} onClick={onOpen} tabIndex={tab}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
          <path d="M3.5 6.5 12 13l8.5-6.5" />
        </svg>
        Open Invitation
      </button>

      <button
        type="button"
        className={styles.musicToggle}
        onClick={onToggleMusic}
        aria-pressed={withMusic}
        tabIndex={tab}
      >
        <span className={`${styles.switch} ${withMusic ? styles.switchOn : ''}`} aria-hidden="true" />
        {withMusic ? 'Open with music' : 'Open without music'}
      </button>
    </div>
  );
}

/**
 * The opening screen: a gatefold invitation card. On "Open Invitation" the
 * card splits at its seam and swings open in 3D, light floods through and the
 * camera pushes into the hero.
 */
export default function InvitationIntro({ guestName, defaultMusic = true, onOpen, onDone }) {
  const reduced = useReducedMotion();
  const [opening, setOpening] = useState(false);
  const [withMusic, setWithMusic] = useState(defaultMusic);

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    onOpen?.({ withMusic });
  };

  const faceProps = {
    guestName,
    withMusic,
    onToggleMusic: () => setWithMusic((v) => !v),
    onOpen: handleOpen,
  };

  return (
    <motion.div
      className={`ds-intro ${styles.overlay}`}
      role="dialog"
      aria-modal="true"
      aria-label="Wedding invitation"
      initial={{ opacity: 1 }}
      animate={{ opacity: opening ? 0 : 1 }}
      transition={opening ? { delay: reduced ? 0.2 : 1.35, duration: reduced ? 0.5 : 1.1, ease: 'easeInOut' } : { duration: 0 }}
      onAnimationComplete={() => opening && onDone?.()}
      style={{ pointerEvents: opening ? 'none' : 'auto' }}
    >
      <div className={styles.backdrop} />
      <GoldDust density={0.00009} />

      <motion.div
        className={styles.bloom}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={opening ? { opacity: 1, scale: 3.6 } : { opacity: 0, scale: 0.3 }}
        transition={{ delay: reduced ? 0 : 0.55, duration: reduced ? 0.4 : 1.7, ease: EASE }}
      />

      <motion.div
        className={styles.stage}
        animate={opening && !reduced ? { scale: 1.45 } : { scale: 1 }}
        transition={{ delay: 0.7, duration: 1.9, ease: [0.5, 0, 0.2, 1] }}
      >
        <motion.div
          className={styles.float}
          initial={{ opacity: 0, y: reduced ? 0 : 36, rotateX: reduced ? 0 : 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.15 }}
        >
          <div className={`${styles.gate} ${opening ? styles.isOpening : ''}`}>
            <motion.div
              className={`${styles.half} ${styles.left}`}
              animate={opening && !reduced ? { rotateY: -104 } : { rotateY: 0 }}
              transition={{ delay: 0.45, duration: 1.5, ease: DOOR }}
            >
              <CardFace {...faceProps} />
              <motion.div className={styles.shadeLeft} animate={{ opacity: opening ? 1 : 0 }} transition={{ delay: 0.45, duration: 1.2 }} />
            </motion.div>

            <motion.div
              className={`${styles.half} ${styles.right}`}
              aria-hidden="true"
              animate={opening && !reduced ? { rotateY: 104 } : { rotateY: 0 }}
              transition={{ delay: 0.45, duration: 1.5, ease: DOOR }}
            >
              <CardFace {...faceProps} inert />
              <motion.div className={styles.shadeRight} animate={{ opacity: opening ? 1 : 0 }} transition={{ delay: 0.45, duration: 1.2 }} />
            </motion.div>

            <motion.span
              className={styles.seam}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={opening ? { scaleY: 1, opacity: [0, 1, 1, 0] } : { scaleY: 0, opacity: 0 }}
              transition={{ duration: 1.1, ease: EASE, times: [0, 0.3, 0.6, 1] }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
