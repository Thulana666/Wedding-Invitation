'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import HeroTitles from './HeroTitles';
import styles from './Hero.module.css';

/**
 * The last moment of the opening scene, held as a picture: the couple in the
 * bright doorway, with their names above and the date on the path. `revealed`
 * flips to true when the invitation is opened.
 */
export default function Hero({ revealed }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '14%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section id="home" ref={ref} className={styles.hero} aria-labelledby="hero-title">
      <motion.div className={styles.world} style={{ y: imageY }}>
        <img className={styles.ambient} src="/opening/garden-wide.webp" alt="" />
        <img className={styles.picture} src="/opening/garden-final.webp" alt="" />
      </motion.div>

      <div className={styles.shade} aria-hidden="true" />

      <motion.div className={styles.content} style={{ opacity: contentOpacity }}>
        <HeroTitles revealed={revealed} />
      </motion.div>

      <a href="#story" className={styles.scroll} aria-label="Scroll to our story">
        <span>Scroll</span>
        <span className={styles.scrollLine}>
          <span />
        </span>
      </a>
    </section>
  );
}
