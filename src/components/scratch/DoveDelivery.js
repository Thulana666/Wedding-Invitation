'use client';

import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createDoveRig } from './doveRig';
import styles from './DoveDelivery.module.css';

const FLIGHT_SECONDS = 3.4;
const LEAVE_DELAY = 0.25;
const LEAVE_SECONDS = 2;

// The flight is a cubic Bézier ending at the card's resting place, in vw and vh.
const PATH_X = [84, 62, 20, 0];
const PATH_Y = [-46, 6, -20, 0];

function bezier([a, b, c, d], t) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

/** The dove. Its wings beat faster with effort, and hold open when it glides. */
function Dove({ effort, flying, onPrepared }) {
  const canvas = useRef(null);
  const rig = useRef(null);
  const beat = useRef(0);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createDoveRig(canvas.current).then((created) => {
      if (cancelled) return;
      rig.current = created;
      setUnavailable(!created);
      onPrepared();
    });
    return () => {
      cancelled = true;
      rig.current?.destroy();
      rig.current = null;
    };
  }, [onPrepared]);

  useAnimationFrame((_, delta) => {
    if (!flying || !rig.current) return;
    const e = effort.get();
    beat.current += (delta / 1000) * (2.5 + 6.5 * e);
    rig.current.draw(beat.current, e);
  });

  if (unavailable) return <img className={styles.doveImage} src="/dove/whole.webp" alt="" />;
  return <canvas ref={canvas} className={styles.doveCanvas} aria-hidden="true" />;
}

/** Gold satin ribbon from the dove's beak down to the card's top corners. */
function Ribbon() {
  return (
    <svg className={styles.ribbon} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path className={styles.ribbonEdge} d="M7 100L50 0l43 100" />
      <path className={styles.ribbonSheen} d="M7 100L50 0l43 100" />
    </svg>
  );
}

function Bow() {
  return (
    <svg className={styles.bow} viewBox="0 0 64 44" aria-hidden="true">
      <defs>
        <linearGradient id="bow-satin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1e2b6" />
          <stop offset="0.5" stopColor="#d2b163" />
          <stop offset="1" stopColor="#a98438" />
        </linearGradient>
      </defs>
      <g fill="url(#bow-satin)" stroke="#94722c" strokeWidth="0.8" strokeLinejoin="round">
        <path d="M30 15 19 41l6-3 3 5 5-26z" />
        <path d="m34 15 11 26-6-3-3 5-5-26z" />
        <path d="M30 13C22 3 7 1 5 8s13 12 25 8z" />
        <path d="M34 13c8-10 23-12 25-5s-13 12-25 8z" />
        <rect x="27.5" y="10" width="9" height="9" rx="3" />
      </g>
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
  // Get the dove ready before the visitor reaches it.
  const nearby = useInView(ref, { once: true, margin: '80% 0px' });
  const [prepared, setPrepared] = useState(false);
  const onPrepared = useCallback(() => setPrepared(true), []);
  // waiting → flying → landed (dove leaving) → done
  const [phase, setPhase] = useState('waiting');

  const progress = useMotionValue(0);
  const x = useTransform(progress, (p) => `${bezier(PATH_X, p)}vw`);
  const y = useTransform(progress, (p) => `${bezier(PATH_Y, p)}vh`);
  const opacity = useTransform(progress, [0, 0.06], [0, 1]);
  // Arrives from the distance, growing as it comes.
  const scale = useTransform(progress, [0, 1], [0.8, 1]);
  // Negative tips the beak down. It flares nose-up just before setting the card down.
  const pitch = useTransform(progress, [0, 0.3, 0.65, 0.88, 1], [-22, -13, -6, 6, 0]);
  // Flaps in, glides, then beats hard to brake.
  const effort = useTransform(progress, [0, 0.45, 0.6, 0.8, 0.92, 1], [1, 1, 0.1, 0.1, 0.9, 1]);
  // The card trails behind the bird like a pendulum, settling as it lands.
  const swing = useTransform(progress, (p) => -15 * (1 - p) ** 1.4 * Math.cos(p * Math.PI * 3.2));

  useEffect(() => {
    if (reduced) {
      progress.set(1);
      setPhase('done');
      return undefined;
    }
    if (!inView) return undefined;
    if (prepared) {
      setPhase((p) => (p === 'waiting' ? 'flying' : p));
      return undefined;
    }
    // On a slow connection, don't keep the visitor waiting for the card.
    const t = setTimeout(() => setPrepared(true), 1500);
    return () => clearTimeout(t);
  }, [inView, prepared, reduced, progress]);

  useEffect(() => {
    if (phase !== 'flying') return undefined;
    const flight = animate(progress, 1, {
      duration: FLIGHT_SECONDS,
      ease: [0.3, 0.1, 0.2, 1],
      onComplete: () => setPhase('landed'),
    });
    return () => flight.stop();
  }, [phase, progress]);

  useEffect(() => {
    if (phase !== 'landed') return undefined;
    const t = setTimeout(() => setPhase('done'), (LEAVE_DELAY + LEAVE_SECONDS) * 1000);
    return () => clearTimeout(t);
  }, [phase]);

  const airborne = phase === 'flying' || phase === 'landed';
  const landed = phase === 'landed';

  return (
    <div ref={ref} className={styles.delivery}>
      <motion.div className={styles.carrier} style={{ x, y, scale, opacity }}>
        {nearby && !reduced && phase !== 'done' && (
          <motion.div
            className={styles.dove}
            initial={false}
            animate={
              landed
                ? {
                    x: ['0vw', '1vw', '-11vw', '-62vw'],
                    y: ['0vh', '1vh', '-8vh', '-72vh'],
                    rotate: [0, -3, 10, 18],
                    scale: [1, 1, 0.94, 0.68],
                    opacity: [1, 1, 1, 0],
                  }
                : undefined
            }
            transition={{
              duration: LEAVE_SECONDS,
              delay: LEAVE_DELAY,
              times: [0, 0.14, 0.45, 1],
              ease: 'easeIn',
            }}
          >
            <motion.div className={styles.pitch} style={{ rotate: pitch }}>
              <Dove effort={effort} flying={airborne} onPrepared={onPrepared} />
            </motion.div>
          </motion.div>
        )}

        <motion.div className={styles.hanging} style={{ rotate: swing }}>
          {airborne && (
            <motion.div
              className={styles.ribbonWrap}
              initial={false}
              animate={landed ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: landed ? LEAVE_DELAY + 0.1 : 0, ease: 'easeIn' }}
            >
              <Ribbon />
              <Bow />
              <span className={`${styles.knot} ${styles.knotLeft}`} />
              <span className={`${styles.knot} ${styles.knotRight}`} />
            </motion.div>
          )}
          {children(landed || phase === 'done')}
        </motion.div>
      </motion.div>
    </div>
  );
}
