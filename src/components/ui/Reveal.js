'use client';

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

const EASE = [0.22, 1, 0.36, 1];

/** Fades and lifts its children into view once, as they scroll in. */
export function Reveal({ as = 'div', children, delay = 0, y = 28, className, amount = 0.25, ...rest }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 1, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

const INSETS = {
  up: (p) => `inset(${p}% 0% 0% 0%)`,
  down: (p) => `inset(0% 0% ${p}% 0%)`,
  left: (p) => `inset(0% 0% 0% ${p}%)`,
  right: (p) => `inset(0% ${p}% 0% 0%)`,
};

/**
 * Image mask reveal: the frame opens while the image settles. Visibility is
 * observed on the unclipped wrapper, and the clip is driven by a number so the
 * inset() string never has to be interpolated.
 */
export function MaskReveal({ children, className, delay = 0, direction = 'up' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduced = useReducedMotion();
  const progress = useMotionValue(100);
  const clipPath = useTransform(progress, INSETS[direction] || INSETS.up);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduced) {
      progress.set(0);
      return undefined;
    }
    const controls = animate(progress, 0, { duration: 1.4, ease: [0.77, 0, 0.18, 1], delay });
    return () => controls.stop();
  }, [inView, reduced, delay, progress]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ position: 'absolute', inset: 0, clipPath }}>
        <motion.div
          style={{ position: 'absolute', inset: 0 }}
          initial={{ scale: reduced ? 1 : 1.18 }}
          animate={inView ? { scale: 1 } : undefined}
          transition={{ duration: 2, ease: EASE, delay }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Splits text into words that rise in sequence. */
export function StaggerText({ text, className, delay = 0, stagger = 0.06, as = 'span' }) {
  const Tag = motion[as] || motion.span;
  const words = text.split(' ');
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span key={i} aria-hidden="true" style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em' }}>
          <motion.span
            style={{ display: 'inline-block' }}
            variants={{ hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 0.9, ease: EASE } } }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
