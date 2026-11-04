'use client';

import { useAnimationFrame } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { createDoveRig } from './doveRig';
import styles from './Dove.module.css';

/**
 * The flapping dove. Fills its positioned parent. `effort` is a motion value:
 * the wings beat faster as it rises, and hold open when it falls to 0.
 */
export default function Dove({ effort, flying = true, onPrepared }) {
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
      onPrepared?.();
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
