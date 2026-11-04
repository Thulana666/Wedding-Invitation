'use client';

import { motion } from 'framer-motion';
import { wedding } from '@/config/wedding';
import styles from './HeroTitles.module.css';

const EASE = [0.22, 1, 0.36, 1];

function Letters({ text, delay, revealed }) {
  return (
    <span className={styles.word} aria-hidden="true">
      {[...text].map((ch, i) => (
        <motion.span
          key={i}
          className={styles.letter}
          initial={{ opacity: 0, y: '0.4em', filter: 'blur(6px)' }}
          animate={revealed ? { opacity: 1, y: '0em', filter: 'blur(0px)' } : {}}
          transition={{ duration: 1.1, ease: EASE, delay: delay + i * 0.06 }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * The couple's names above the arch, and the date on the path below it. The
 * opening scene and the hero both show these in the same place, so one dissolves
 * into the other. Only the hero's copy is announced to screen readers.
 */
export default function HeroTitles({ revealed, delay = 0, decorative = false }) {
  const { couple, date } = wedding;
  const Heading = decorative ? 'div' : 'h1';
  const fade = (extra) => ({
    initial: { opacity: 0, y: 12 },
    animate: revealed ? { opacity: 1, y: 0 } : {},
    transition: { duration: 1.2, ease: EASE, delay: delay + extra },
  });

  return (
    <div className={styles.titles} aria-hidden={decorative ? true : undefined}>
      <Heading id={decorative ? undefined : 'hero-title'} className={styles.names}>
        {!decorative && (
          <span className="sr-only">
            {couple.bride} &amp; {couple.groom} are getting married
          </span>
        )}
        <Letters text={couple.bride.toUpperCase()} delay={delay} revealed={revealed} />
        <motion.span className={`script ${styles.amp}`} aria-hidden="true" {...fade(0.35)}>
          &amp;
        </motion.span>
        <Letters text={couple.groom.toUpperCase()} delay={delay + 0.4} revealed={revealed} />
      </Heading>

      <div className={styles.foot}>
        <motion.p className={styles.married} aria-hidden="true" {...fade(0.8)}>
          We are getting married
        </motion.p>
        <motion.p className={styles.date} {...fade(1.05)}>
          {date.hero}
        </motion.p>
      </div>
    </div>
  );
}
