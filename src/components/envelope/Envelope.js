'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { wedding } from '@/config/wedding';
import { Monogram } from '@/components/ui/Ornament';
import styles from './Envelope.module.css';

const EASE = [0.22, 1, 0.36, 1];
const STAGES = ['closed', 'opening', 'risen', 'out'];

function Floaters() {
  return (
    <div className={styles.floaters} aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className={i % 3 === 0 ? styles.heart : styles.sparkle}
          style={{ '--x': `${(i - 5.5) * 9}%`, '--delay': `${(i % 6) * 0.12}s`, '--dur': `${2.2 + (i % 4) * 0.4}s` }}
        />
      ))}
    </div>
  );
}

/** Click the wax seal: the flap lifts, the letter rises and the envelope falls away. */
export default function Envelope() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState('closed');
  const timers = useRef([]);
  const { letter, couple } = wedding;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const open = () => {
    if (stage !== 'closed') return;
    if (reduced) {
      setStage('out');
      return;
    }
    setStage('opening');
    timers.current.push(setTimeout(() => setStage('risen'), 750));
    timers.current.push(setTimeout(() => setStage('out'), 1900));
  };

  const at = (s) => STAGES.indexOf(stage) >= STAGES.indexOf(s);
  const fallAway = {
    animate: at('out') ? { y: 60, opacity: 0, scale: 0.96 } : { y: 0, opacity: 1, scale: 1 },
    transition: { duration: 1, ease: EASE },
  };

  return (
    <div className={`${styles.scene} ${styles[stage]}`}>
      <div className={styles.envelope}>
        {/* Separate layers so the letter can sit between the back and the pocket. */}
        <motion.div className={`${styles.layer} ${styles.backLayer}`} {...fallAway}>
          <div className={styles.back} />
        </motion.div>
        <motion.div className={`${styles.layer} ${styles.flapLayer}`} {...fallAway}>
          <div className={styles.flap} />
        </motion.div>

        <motion.article
          layout
          className={`${styles.letter} ${at('risen') ? styles.letterRisen : ''} ${at('out') ? styles.letterOut : ''}`}
          transition={{ layout: { duration: 1, ease: EASE } }}
          aria-hidden={!at('out')}
        >
          <motion.div layout="position" className={styles.letterInner}>
            <Monogram className={styles.letterMono} left={couple.monogram.left} right={couple.monogram.right} />
            <p className={styles.greeting}>{letter.greeting}</p>
            <p className={styles.bodyText}>{letter.body}</p>
            <p className={styles.signOff}>{letter.signOff}</p>
            <p className={`script ${styles.signature}`}>{couple.names}</p>
          </motion.div>
        </motion.article>

        <motion.div className={`${styles.layer} ${styles.pocketLayer}`} {...fallAway}>
          <div className={styles.pocket} />
        </motion.div>

        <motion.button
          type="button"
          className={styles.seal}
          onClick={open}
          disabled={stage !== 'closed'}
          aria-label="Break the seal to open the letter"
          animate={stage === 'closed' ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 1.35, opacity: 0, rotate: -12 }}
          transition={{ duration: 0.6, ease: EASE }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
        >
          <span className={styles.sealRing} />
          <Monogram className={styles.sealMono} left={couple.monogram.left} right={couple.monogram.right} />
        </motion.button>

        {stage === 'risen' && <Floaters />}
      </div>

      <p className={styles.hint} aria-live="polite">
        {stage === 'closed' ? 'Tap the wax seal to open' : at('out') ? '' : 'Opening…'}
      </p>
    </div>
  );
}
