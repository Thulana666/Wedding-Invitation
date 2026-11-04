'use client';

import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import GoldDust from '@/components/ambient/GoldDust';
import HeroTitles from '@/components/hero/HeroTitles';
import Dove from '@/components/scratch/Dove';
import { createEnvelopeScene } from './envelopeScene';
import { createGardenScene } from './gardenScene';
import styles from './InvitationIntro.module.css';

const EASE = [0.22, 1, 0.36, 1];

// The sequence, in seconds from the tap: the envelope opens and fills with light,
// the garden fades in at dusk, its doors open, the couple walk in, the names appear.
const GARDEN_AT = 4.3;
const TITLES_AT = 7.5;
const SCENE_SECONDS = 9.7;
const QUICK_SECONDS = 0.4;
// Longest the Open button waits for the scene on a slow connection.
const READY_TIMEOUT_MS = 3000;

/**
 * Opening screen: a sealed envelope. On "Open Invitation" (or a tap on the seal)
 * its flap lifts, light pours out and butterflies rise. The view then fades to a
 * garden at dusk, where a door opens and the couple walk into the light, and the
 * scene dissolves into the hero, which shows the same picture and titles. Without
 * WebGL, or with reduced motion, the envelope simply fades through.
 */
export default function InvitationIntro({ defaultMusic = true, onOpen, onDone }) {
  const reduced = useReducedMotion();
  const [opening, setOpening] = useState(false);
  const [withMusic, setWithMusic] = useState(defaultMusic);
  const [ready, setReady] = useState(false);
  const [canOpen, setCanOpen] = useState(false);
  const [inGarden, setInGarden] = useState(false);

  const envelopeCanvas = useRef(null);
  const gardenCanvas = useRef(null);
  const envelope = useRef(null);
  const garden = useRef(null);
  const time = useRef(0);
  const openedAt = useRef(null);
  const wingbeat = useMotionValue(0.7);

  useEffect(() => {
    if (reduced) {
      setCanOpen(true);
      return undefined;
    }
    let cancelled = false;
    Promise.all([createEnvelopeScene(envelopeCanvas.current), createGardenScene(gardenCanvas.current)]).then(([e, g]) => {
      if (cancelled) return;
      envelope.current = e;
      garden.current = g;
      setReady(Boolean(e && g));
      setCanOpen(true);
    });
    const giveUp = setTimeout(() => setCanOpen(true), READY_TIMEOUT_MS);
    return () => {
      cancelled = true;
      clearTimeout(giveUp);
      envelope.current?.destroy();
      garden.current?.destroy();
      envelope.current = null;
      garden.current = null;
    };
  }, [reduced]);

  // The real clock, so the scene stays in step with the page on a slow phone.
  useAnimationFrame((elapsed) => {
    time.current = elapsed / 1000;
    const since = openedAt.current === null ? -1 : time.current - openedAt.current;
    if (envelope.current && since < GARDEN_AT + 0.9) envelope.current.draw(time.current, since);
    if (garden.current && since > GARDEN_AT - 0.5) garden.current.draw(time.current, since - GARDEN_AT);
  });

  useEffect(() => {
    if (!opening || !ready) return undefined;
    const t = setTimeout(() => setInGarden(true), (GARDEN_AT - 0.1) * 1000);
    return () => clearTimeout(t);
  }, [opening, ready]);

  const cinematic = !reduced && ready;
  const seconds = cinematic ? SCENE_SECONDS : QUICK_SECONDS;

  const open = () => {
    if (opening) return;
    setOpening(true);
    openedAt.current = time.current;
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
      transition={opening ? { delay: seconds, duration: cinematic ? 0.7 : 0.5, ease: 'easeInOut' } : { duration: 0 }}
      onAnimationComplete={() => opening && onDone?.()}
      style={{ pointerEvents: opening ? 'none' : 'auto' }}
    >
      <div className={styles.world}>
        <motion.img
          className={styles.ambient}
          src="/opening/garden-wide.webp"
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: opening && cinematic ? 1 : 0 }}
          transition={{ delay: GARDEN_AT + 0.6, duration: 2.6 }}
        />
        <div className={styles.picture}>
          <canvas ref={gardenCanvas} className={styles.layer} aria-hidden="true" />
        </div>

        {inGarden && (
          <>
            <div className={styles.flightOne} aria-hidden="true">
              <Dove effort={wingbeat} />
            </div>
            <div className={styles.flightTwo} aria-hidden="true">
              <div className={styles.flip}>
                <Dove effort={wingbeat} />
              </div>
            </div>
          </>
        )}

        <motion.div
          className={styles.envelope}
          initial={false}
          animate={{ opacity: opening && cinematic ? 0 : 1 }}
          transition={{ delay: GARDEN_AT, duration: 0.8, ease: 'easeInOut' }}
        >
          <img className={styles.layer} src="/opening/envelope-closed.webp" alt="" fetchPriority="high" />
          <canvas ref={envelopeCanvas} className={`${styles.layer} ${ready ? styles.alive : styles.waiting}`} aria-hidden="true" />
          <button type="button" className={styles.seal} onClick={open} tabIndex={-1} aria-hidden="true" />
        </motion.div>
      </div>

      <motion.div
        className={styles.shade}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: opening && cinematic ? 1 : 0 }}
        transition={{ delay: TITLES_AT - 1, duration: 1.4 }}
      />

      {inGarden && <GoldDust density={0.00005} />}

      {cinematic && <HeroTitles revealed={opening} delay={TITLES_AT} decorative />}

      <motion.div
        className={styles.controls}
        initial={{ opacity: 0, y: 16 }}
        animate={opening ? { opacity: 0, y: 10 } : canOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={opening ? { duration: 0.4 } : { duration: 1.2, ease: EASE, delay: 0.3 }}
        style={{ pointerEvents: canOpen && !opening ? 'auto' : 'none' }}
      >
        <button type="button" className={`btn btn-gold ${styles.open}`} onClick={open} disabled={opening}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 7h18v12H3zM3 7l9 7 9-7" strokeLinejoin="round" />
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
