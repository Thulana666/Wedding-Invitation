'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { wedding } from '@/config/wedding';
import styles from './Hero.module.css';

const EASE = [0.22, 1, 0.36, 1];

function Letters({ text, delay, revealed }) {
  return (
    <span className={styles.word} aria-hidden="true">
      {[...text].map((ch, i) => (
        <motion.span
          key={i}
          className={styles.letter}
          initial={{ opacity: 0, y: '0.5em', filter: 'blur(8px)' }}
          animate={revealed ? { opacity: 1, y: '0em', filter: 'blur(0px)' } : {}}
          transition={{ duration: 1.3, ease: EASE, delay: delay + i * 0.07 }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * `revealed` flips to true when the invitation is opened; `delay` lets the
 * hero wait for the opening animation to clear.
 */
export default function Hero({ revealed, delay = 0 }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '18%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '-22%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const { couple, images } = wedding;
  const d = delay;
  const fade = (extra, y = 18) => ({
    initial: { opacity: 0, y },
    animate: revealed ? { opacity: 1, y: 0 } : {},
    transition: { duration: 1.2, ease: EASE, delay: d + extra },
  });

  return (
    <section id="home" ref={ref} className={styles.hero} aria-labelledby="hero-title">
      <motion.div className={styles.media} style={{ y: imageY }}>
        <motion.div
          className={styles.mediaInner}
          initial={{ scale: 1.22, opacity: 0.4 }}
          animate={revealed ? { scale: 1.04, opacity: 1 } : {}}
          transition={{ duration: 3.2, ease: EASE, delay: d }}
        >
          <Image src={images.hero.src} alt={images.hero.alt} fill preload sizes="100vw" quality={85} className={styles.image} />
        </motion.div>
      </motion.div>

      <div className={styles.overlay} aria-hidden="true" />
      <motion.div
        className={styles.flash}
        aria-hidden="true"
        initial={{ opacity: 1 }}
        animate={revealed ? { opacity: 0 } : {}}
        transition={{ duration: 2.2, ease: 'easeOut', delay: d }}
      />

      <motion.div className={styles.content} style={{ y: contentY, opacity: contentOpacity }}>
        <motion.p className={styles.together} {...fade(0.5)}>
          Together with their families
        </motion.p>

        <h1 id="hero-title" className={styles.names}>
          <span className="sr-only">
            {couple.bride} &amp; {couple.groom} are getting married
          </span>
          <Letters text={couple.bride.toUpperCase()} delay={d + 0.8} revealed={revealed} />
          <motion.span
            className={`script ${styles.amp}`}
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={revealed ? { opacity: 1, scale: 1, rotate: 0 } : {}}
            transition={{ duration: 1.6, ease: EASE, delay: d + 1.25 }}
          >
            &amp;
          </motion.span>
          <Letters text={couple.groom.toUpperCase()} delay={d + 1.4} revealed={revealed} />
        </h1>

        <motion.p className={styles.married} {...fade(2.1)} aria-hidden="true">
          Are getting married
        </motion.p>
      </motion.div>

      <motion.a href="#story" className={styles.scroll} {...fade(3, 0)} aria-label="Scroll to our story">
        <span>Scroll</span>
        <span className={styles.scrollLine}>
          <span />
        </span>
      </motion.a>
    </section>
  );
}
