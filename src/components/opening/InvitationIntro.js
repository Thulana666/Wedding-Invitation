'use client';

import { animate, motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import GoldDust from '@/components/ambient/GoldDust';
import Dove from '@/components/scratch/Dove';
import { createGardenScene } from './gardenScene';
import styles from './InvitationIntro.module.css';

const EASE = [0.22, 1, 0.36, 1];

/**
 * Opening screen: the bride and groom at a vine-covered archway in a garden at
 * sunset. Leaves stir, doves cross the sky and light pours from the doorway. On
 * "Open Invitation" the couple walk into the light and the view follows them
 * into the main page.
 */
export default function InvitationIntro({ defaultMusic = true, onOpen, onDone }) {
  const reduced = useReducedMotion();
  const [opening, setOpening] = useState(false);
  const [withMusic, setWithMusic] = useState(defaultMusic);
  const [sceneReady, setSceneReady] = useState(false);
  // Doves join after the page loads, so server and browser start out the same.
  const [showDoves, setShowDoves] = useState(false);

  const canvas = useRef(null);
  const scene = useRef(null);
  const time = useRef(0);
  const light = useMotionValue(0);
  const wingbeat = useMotionValue(0.7);

  useEffect(() => {
    if (reduced) return undefined;
    setShowDoves(true);
    let cancelled = false;
    createGardenScene(canvas.current).then((created) => {
      if (cancelled) return;
      scene.current = created;
      setSceneReady(Boolean(created));
    });
    return () => {
      cancelled = true;
      scene.current?.destroy();
      scene.current = null;
    };
  }, [reduced]);

  useAnimationFrame((_, delta) => {
    if (!scene.current) return;
    time.current += delta / 1000;
    scene.current.draw(time.current, light.get());
  });

  const open = () => {
    if (opening) return;
    setOpening(true);
    onOpen?.({ withMusic });
    animate(light, 1, { duration: 2.7, delay: 0.2, ease: [0.45, 0, 0.7, 1] });
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
      <motion.div
        className={styles.stage}
        initial={false}
        animate={opening && !reduced ? { scale: 4 } : { scale: 1 }}
        transition={{ delay: 2.25, duration: 1.3, ease: [0.6, 0, 0.8, 0.25] }}
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
              <img className={styles.plate} src="/opening/garden.webp" alt="" fetchPriority="high" />
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

            <motion.div
              className={styles.couple}
              initial={false}
              animate={
                opening && !reduced
                  ? { scale: [1, 0.5, 0.3], x: ['0%', '18%', '20%'], y: ['0%', '-38%', '-47%'], opacity: [1, 1, 0] }
                  : opening
                    ? { opacity: 0 }
                    : { scale: 1, x: '0%', y: '0%', opacity: 1 }
              }
              transition={
                opening && !reduced
                  ? { duration: 2.6, delay: 0.5, ease: 'easeInOut', times: [0, 0.74, 1] }
                  : { duration: 0.4 }
              }
            >
              <div className={`${styles.walker} ${opening && !reduced ? styles.walking : styles.resting}`}>
                <img className={styles.coupleImage} src="/opening/couple.webp" alt="" fetchPriority="high" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <div className={styles.fade} aria-hidden="true" />
      <GoldDust density={0.00007} />

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
