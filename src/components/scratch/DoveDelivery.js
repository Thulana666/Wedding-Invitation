'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import styles from './DoveDelivery.module.css';

/** A white dove in flight, facing left, with flapping wings. */
function Dove() {
  return (
    <svg viewBox="0 0 200 140" className={styles.doveSvg} aria-hidden="true">
      <defs>
        <linearGradient id="dove-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9e2d6" />
        </linearGradient>
        <linearGradient id="dove-wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#efe9df" />
        </linearGradient>
      </defs>
      <path className={styles.wingFar} d="M92 70c6-20 20-34 36-40-4 12-6 22-10 32z" fill="#e6dfd2" />
      <path
        d="M46 72c0-10 8-18 18-18s18 6 24 14c16 6 40 6 62 0l34-12c2 6 0 10-4 14l14 4c-4 6-10 8-16 8l12 10c-14 4-30 2-44-2-20 6-42 8-60 4-16-2-30-8-36-14-3-2-4-5-4-8z"
        fill="url(#dove-body)"
        stroke="#d6cdbf"
        strokeWidth="1"
      />
      <path d="M47 69l-11 3 11 3z" fill="#d9a066" />
      <circle cx="56" cy="66" r="2" fill="#2b2222" />
      <path
        className={styles.wingNear}
        d="M90 70c2-24 18-48 46-64-2 10-4 16-8 22 12-6 24-8 36-8-10 8-18 16-24 24 10-2 20 0 28 4-14 6-28 10-42 14s-26 8-36 8z"
        fill="url(#dove-wing)"
        stroke="#d6cdbf"
        strokeWidth="1"
      />
    </svg>
  );
}

/** Gold ribbon from the dove's beak down to the card's top corners, with a bow. */
function Ribbon() {
  return (
    <svg className={styles.ribbon} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M50 0L7 100M50 0l43 100" fill="none" stroke="#c5a45a" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * Wraps the scratch card: when it scrolls into view, a dove flies in holding
 * the card by a ribbon, sets it down, lets go and flies away. `children` is a
 * render function receiving `ready` (true once the card has landed).
 */
export default function DoveDelivery({ children }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.35 });
  // waiting → flying → landed (dove leaving) → done
  const [phase, setPhase] = useState('waiting');

  useEffect(() => {
    if (reduced) setPhase('done');
    else if (inView) setPhase((p) => (p === 'waiting' ? 'flying' : p));
  }, [inView, reduced]);

  useEffect(() => {
    if (phase !== 'landed') return undefined;
    const t = setTimeout(() => setPhase('done'), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  const ready = phase === 'landed' || phase === 'done';
  const start = { x: '78vw', y: '-42vh', opacity: 0 };

  return (
    <div ref={ref} className={styles.delivery}>
      <motion.div
        className={styles.carrier}
        initial={reduced ? false : start}
        animate={
          phase === 'waiting'
            ? start
            : phase === 'flying'
              ? { x: ['78vw', '36vw', '8vw', '0vw'], y: ['-42vh', '-4vh', '-12vh', '0vh'], opacity: [0, 1, 1, 1] }
              : { x: '0vw', y: '0vh', opacity: phase === 'waiting' ? 0 : 1 }
        }
        transition={phase === 'flying' ? { duration: 2.6, times: [0, 0.45, 0.78, 1], ease: 'easeOut' } : { duration: 0 }}
        onAnimationComplete={() => phase === 'flying' && setPhase('landed')}
      >
        {phase !== 'done' && (
          <motion.div
            className={styles.dove}
            initial={false}
            animate={
              phase === 'landed'
                ? { x: [0, -30, -620], y: [0, -26, -520], rotate: [0, -6, -14], scale: [1, 1, 0.7], opacity: [1, 1, 0] }
                : { x: 0, y: 0, rotate: 0, scale: 1 }
            }
            transition={phase === 'landed' ? { duration: 1.5, delay: 0.1, times: [0, 0.12, 1], ease: [0.45, 0, 0.75, 0.6] } : { duration: 0 }}
          >
            <Dove />
          </motion.div>
        )}

        <motion.div
          className={styles.hanging}
          initial={false}
          animate={phase === 'flying' ? { rotate: [-12, 8, -6, 4, -2, 0] } : { rotate: 0 }}
          transition={phase === 'flying' ? { duration: 3.1, ease: 'easeInOut' } : { duration: 0.6, ease: 'easeOut' }}
        >
          {phase !== 'done' && (
            <motion.div
              className={styles.ribbonWrap}
              initial={false}
              animate={{ opacity: phase === 'landed' ? 0 : 1 }}
              transition={{ duration: 0.5, delay: phase === 'landed' ? 0.2 : 0 }}
            >
              <Ribbon />
              <span className={`${styles.knot} ${styles.knotLeft}`} />
              <span className={`${styles.knot} ${styles.knotRight}`} />
            </motion.div>
          )}
          {children(ready)}
        </motion.div>
      </motion.div>
    </div>
  );
}
