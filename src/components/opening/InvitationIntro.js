'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import GoldDust from '@/components/ambient/GoldDust';
import { WeddingSymbol } from '@/components/ui/Ornament';
import styles from './InvitationIntro.module.css';

const EASE = [0.22, 1, 0.36, 1];
const DOOR = [0.6, 0, 0.25, 1];

/** Bride and groom seen from behind, holding hands. */
function Couple() {
  return (
    <svg viewBox="0 0 240 320" className={styles.coupleSvg} aria-hidden="true">
      <ellipse cx="128" cy="312" rx="96" ry="7" className={styles.shadow} />
      <g className={styles.silhouette}>
        {/* groom */}
        <ellipse cx="88" cy="38" rx="14" ry="16" />
        <path d="M81 50h14l1 11H80z" />
        <path d="M60 68c2-8 10-10 20-10h16c10 0 18 2 20 10l-4 82c-1 10-4 18-6 26H70c-2-8-5-16-6-26z" />
        <path d="M60 68c-6 6-8 22-8 40 0 20 2 38 5 52h7c-1-14-1-32 0-50z" />
        <path d="M116 68c6 8 8 28 8 46 1 14 3 26 7 36l-5 3c-6-11-9-25-10-41z" />
        <path d="M70 174l-2 126c0 5 4 8 12 8h6l1-134z" />
        <path d="M90 174l1 134h7c6 0 10-3 10-8l-2-126z" />
        {/* clasped hands */}
        <circle cx="130" cy="151" r="5.5" />
        {/* bride */}
        <ellipse cx="165" cy="44" rx="12" ry="14" />
        <circle cx="165" cy="38" r="8.5" />
        <path d="M160 56h10l1 9h-12z" />
        <path d="M150 68c2-6 8-7 15-7s13 1 15 7l-4 50c-3 8-6 12-11 13-5-1-8-5-11-13z" />
        <path d="M150 68c-6 10-9 30-10 48-1 14-4 26-7 34l-5-2c4-10 6-22 7-36 1-16 7-36 15-44z" />
        <path d="M180 68c6 12 8 32 7 52-1 14-3 26-5 36l-5-1c1-11 2-23 2-35 0-18-3-36 1-52z" />
        <path d="M154 118c-4 32-14 82-26 132-8 30-16 50-20 62h114c-8-16-16-36-22-62-10-50-20-100-24-132-4 8-16 10-22 0z" />
      </g>
      {/* veil */}
      <path
        className={styles.veil}
        d="M159 34c-10 24-14 74-10 134 4 60 22 110 64 138h12c-20-36-30-86-34-146-4-50-8-100-20-126z"
      />
    </svg>
  );
}

function Door({ side, opening, reduced }) {
  const angle = side === 'left' ? 80 : -80;
  return (
    <motion.div
      className={`${styles.door} ${styles[side]}`}
      initial={false}
      animate={opening ? (reduced ? { opacity: 0 } : { rotateY: angle }) : { rotateY: 0, opacity: 1 }}
      transition={{ delay: 0.25, duration: reduced ? 0.4 : 1.6, ease: DOOR }}
    >
      <span className={styles.doorArch} />
      <span className={styles.doorPanel} />
      <span className={styles.handle} />
      <motion.span
        className={styles.doorShade}
        initial={false}
        animate={{ opacity: opening ? 1 : 0 }}
        transition={{ delay: 0.25, duration: 1.4 }}
      />
    </motion.div>
  );
}

/**
 * Opening screen: palace doors in a softly lit hall. On "Open Invitation" the
 * doors swing open, light floods out, the couple walk in through the doorway
 * and the view follows them into the main page.
 */
export default function InvitationIntro({ defaultMusic = true, onOpen, onDone }) {
  const reduced = useReducedMotion();
  const [opening, setOpening] = useState(false);
  const [withMusic, setWithMusic] = useState(defaultMusic);

  const open = () => {
    if (opening) return;
    setOpening(true);
    onOpen?.({ withMusic });
  };

  return (
    <motion.div
      className={`ds-intro ${styles.overlay}`}
      role="dialog"
      aria-modal="true"
      aria-label="Wedding invitation"
      initial={{ opacity: 1 }}
      animate={{ opacity: opening ? 0 : 1 }}
      transition={opening ? { delay: reduced ? 0.4 : 3.35, duration: reduced ? 0.5 : 0.75, ease: 'easeInOut' } : { duration: 0 }}
      onAnimationComplete={() => opening && onDone?.()}
      style={{ pointerEvents: opening ? 'none' : 'auto' }}
    >
      <div className={styles.backdrop} />
      <GoldDust density={0.00007} />

      <motion.div
        className={styles.stage}
        initial={false}
        animate={opening && !reduced ? { scale: 5 } : { scale: 1 }}
        transition={{ delay: 2.25, duration: 1.3, ease: [0.6, 0, 0.8, 0.25] }}
      >
        <motion.div
          className={styles.scene}
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.1 }}
        >
          <div className={styles.portalWrap}>
            <motion.div
              className={styles.glow}
              aria-hidden="true"
              initial={false}
              animate={opening ? { opacity: 1, scale: 1.25 } : { opacity: 0.18, scale: 1 }}
              transition={{ delay: 0.35, duration: 1.8, ease: EASE }}
            />
            <span className={styles.frame} aria-hidden="true" />
            <WeddingSymbol className={styles.keystone} size={54} />

            <button type="button" className={styles.portal} onClick={open} tabIndex={-1} aria-hidden="true">
              <motion.span
                className={styles.light}
                initial={false}
                animate={{ opacity: opening ? 1 : 0.35 }}
                transition={{ delay: 0.3, duration: 1.3 }}
              />
              <span className={styles.rays} />
              <Door side="left" opening={opening} reduced={reduced} />
              <Door side="right" opening={opening} reduced={reduced} />
            </button>

            <motion.div
              className={styles.couple}
              initial={false}
              animate={
                opening && !reduced
                  ? { scale: [1, 1, 0.34], y: ['0%', '0%', '-58%'], opacity: [1, 1, 1, 0] }
                  : opening
                    ? { opacity: 0 }
                    : { scale: 1, y: '0%', opacity: 1 }
              }
              transition={
                opening && !reduced
                  ? {
                      duration: 2.5,
                      delay: 0.8,
                      ease: [0.45, 0, 0.55, 1],
                      times: [0, 0.12, 1],
                      opacity: { duration: 2.5, delay: 0.8, times: [0, 0.6, 0.85, 1] },
                    }
                  : { duration: 0.4 }
              }
            >
              <div className={`${styles.walker} ${opening && !reduced ? styles.walking : ''}`}>
                <Couple />
              </div>
            </motion.div>
          </div>

          <div className={styles.floor} aria-hidden="true">
            <span className={styles.runner} />
            <motion.span
              className={styles.spill}
              initial={false}
              animate={{ opacity: opening ? 1 : 0 }}
              transition={{ delay: 0.4, duration: 1.4 }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* The screen fills with light; the hero then emerges from the same glow. */}
      <motion.div
        className={styles.flash}
        aria-hidden="true"
        initial={false}
        animate={{ opacity: opening && !reduced ? 1 : 0 }}
        transition={{ delay: 2.65, duration: 0.75, ease: 'easeIn' }}
      />

      <motion.div
        className={styles.controls}
        initial={{ opacity: 0, y: 16 }}
        animate={opening ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
        transition={opening ? { duration: 0.4 } : { duration: 1.2, ease: EASE, delay: 0.6 }}
      >
        <button type="button" className={`btn btn-gold ${styles.open}`} onClick={open} disabled={opening}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M5 21V10a7 7 0 0 1 14 0v11M5 21h14M12 3v18" />
            <circle cx="10" cy="14" r="0.8" fill="currentColor" />
            <circle cx="14" cy="14" r="0.8" fill="currentColor" />
          </svg>
          Open Invitation
        </button>
        <button type="button" className={styles.musicToggle} onClick={() => setWithMusic((v) => !v)} aria-pressed={withMusic} disabled={opening}>
          <span className={`${styles.switch} ${withMusic ? styles.switchOn : ''}`} aria-hidden="true" />
          {withMusic ? 'Open with music' : 'Open without music'}
        </button>
      </motion.div>
    </motion.div>
  );
}
