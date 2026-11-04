'use client';

import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import GoldDust from '@/components/ambient/GoldDust';
import Dove from '@/components/scratch/Dove';
import { createGardenScene } from './gardenScene';
import styles from './InvitationIntro.module.css';

const EASE = [0.22, 1, 0.36, 1];

// Seconds from Open Invitation until the main page shows through, once the
// door has opened and the couple have walked in.
const SCENE_SECONDS = 5.3;
const QUICK_SECONDS = 0.4;
// Longest the Open button waits for the scene on a slow connection.
const READY_TIMEOUT_MS = 2500;

/**
 * Opening screen: the bride and groom before a closed door in a garden at
 * sunset, with leaves stirring and doves crossing the sky. On "Open Invitation"
 * the door swings open, light pours out, the couple walk in and the view
 * follows them into the main page. Without WebGL, or with reduced motion, the
 * picture simply fades through.
 */
export default function InvitationIntro({ defaultMusic = true, onOpen, onDone }) {
  const reduced = useReducedMotion();
  const [opening, setOpening] = useState(false);
  const [withMusic, setWithMusic] = useState(defaultMusic);
  const [sceneReady, setSceneReady] = useState(false);
  const [canOpen, setCanOpen] = useState(false);
  // Doves join after the page loads, so server and browser start out the same.
  const [showDoves, setShowDoves] = useState(false);

  const canvas = useRef(null);
  const scene = useRef(null);
  const time = useRef(0);
  const openedAt = useRef(null);
  const wingbeat = useMotionValue(0.7);

  useEffect(() => {
    if (reduced) {
      setCanOpen(true);
      return undefined;
    }
    setShowDoves(true);
    let cancelled = false;
    createGardenScene(canvas.current).then((created) => {
      if (cancelled) return;
      scene.current = created;
      setSceneReady(Boolean(created));
      setCanOpen(true);
    });
    const giveUp = setTimeout(() => setCanOpen(true), READY_TIMEOUT_MS);
    return () => {
      cancelled = true;
      clearTimeout(giveUp);
      scene.current?.destroy();
      scene.current = null;
    };
  }, [reduced]);

  // The real clock, so the scene stays in step with the page on a slow phone.
  useAnimationFrame((elapsed) => {
    if (!scene.current) return;
    time.current = elapsed / 1000;
    const sinceOpen = openedAt.current === null ? -1 : time.current - openedAt.current;
    scene.current.draw(time.current, sinceOpen);
  });

  const cinematic = !reduced && sceneReady;
  const seconds = cinematic ? SCENE_SECONDS : QUICK_SECONDS;

  const open = () => {
    if (opening) return;
    setOpening(true);
    openedAt.current = time.current;
    onOpen?.({ withMusic, heroDelay: seconds - 0.15 });
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
      <motion.div
        className={styles.stage}
        initial={false}
        animate={opening && cinematic ? { scale: 1.42 } : { scale: 1 }}
        transition={{ delay: 1, duration: 4.4, ease: [0.45, 0, 0.75, 0.7] }}
      >
        <motion.div
          className={styles.world}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        >
          <div className={styles.drift}>
            <img className={styles.ambient} src="/opening/garden-wide.webp" alt="" />
            <div className={styles.picture}>
              <img className={styles.plate} src="/opening/garden-closed.webp" alt="" fetchPriority="high" />
              <canvas ref={canvas} className={`${styles.plate} ${sceneReady ? styles.alive : styles.waiting}`} aria-hidden="true" />
            </div>

            {showDoves && (
              <div className={styles.flightOne} aria-hidden="true">
                <Dove effort={wingbeat} />
              </div>
            )}
            {showDoves && (
              <div className={styles.flightTwo} aria-hidden="true">
                <div className={styles.flip}>
                  <Dove effort={wingbeat} />
                </div>
              </div>
            )}

            <button type="button" className={styles.doorway} onClick={open} tabIndex={-1} aria-hidden="true" />
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.fade}
        aria-hidden="true"
        initial={false}
        animate={{ opacity: opening ? 0.4 : 1 }}
        transition={{ delay: 2.9, duration: 1.2 }}
      />
      <GoldDust density={0.00007} />

      {/* The screen fills with light; the hero then emerges from the same glow. */}
      <motion.div
        className={styles.flash}
        aria-hidden="true"
        initial={false}
        animate={{ opacity: opening && cinematic ? 1 : 0 }}
        transition={{ delay: 4.7, duration: 0.55, ease: 'easeIn' }}
      />

      <motion.div
        className={styles.controls}
        initial={{ opacity: 0, y: 16 }}
        animate={opening ? { opacity: 0, y: 10 } : canOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={opening ? { duration: 0.4 } : { duration: 1.2, ease: EASE, delay: 0.3 }}
        style={{ pointerEvents: canOpen && !opening ? 'auto' : 'none' }}
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
