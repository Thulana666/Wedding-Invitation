'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { wedding } from '@/config/wedding';
import SectionHeading from '@/components/ui/SectionHeading';
import { MaskReveal } from '@/components/ui/Reveal';
import styles from './Gallery.module.css';

const SIZES = {
  feature: '(max-width: 760px) 100vw, 1200px',
  wide: '(max-width: 760px) 100vw, 66vw',
  tall: '(max-width: 760px) 50vw, 33vw',
  square: '(max-width: 760px) 50vw, 33vw',
};

function Lightbox({ items, index, onClose, onIndex }) {
  const [direction, setDirection] = useState(0);
  const closeRef = useRef(null);
  const item = items[index];

  const go = useCallback(
    (step) => {
      setDirection(step);
      onIndex((index + step + items.length) % items.length);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    document.body.classList.add('menu-open');
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('menu-open');
      previous?.focus?.();
    };
  }, [go, onClose]);

  return (
    <motion.div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${items.length}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button type="button" className={styles.backdrop} onClick={onClose} aria-label="Close gallery" tabIndex={-1} />

      <div className={styles.stage}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            className={styles.slide}
            custom={direction}
            initial={(d) => ({ opacity: 0, x: d * 80, scale: 0.98 })}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={(d) => ({ opacity: 0, x: d * -80, scale: 0.98 })}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 || info.velocity.x < -400) go(1);
              else if (info.offset.x > 70 || info.velocity.x > 400) go(-1);
            }}
          >
            <Image src={item.src} alt={item.alt} fill sizes="100vw" quality={85} className={styles.full} draggable={false} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.chrome}>
        <p className={styles.caption}>
          <span className={styles.count}>
            {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
          {item.caption}
        </p>
        <div className={styles.nav}>
          <button type="button" className="btn btn-glass" onClick={() => go(-1)} aria-label="Previous photo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" className="btn btn-glass" onClick={() => go(1)} aria-label="Next photo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <button ref={closeRef} type="button" className={`btn btn-glass ${styles.close}`} onClick={onClose} aria-label="Close gallery">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </motion.div>
  );
}

export default function Gallery() {
  const items = wedding.gallery;
  const [open, setOpen] = useState(null);

  return (
    <section id="gallery" className={`section ${styles.section}`} aria-labelledby="gallery-title">
      <div className="container">
        <SectionHeading kicker="Pre-wedding moments" title="The Gallery" id="gallery-title">
          A collection of moments from our pre-wedding photoshoot. Tap any photograph to view it in full.
        </SectionHeading>

        <ul className={styles.grid}>
          {items.map((item, i) => (
            <li key={item.src} className={`${styles.item} ${styles[item.layout] || ''}`}>
              <button type="button" className={styles.tile} onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1}: ${item.caption}`}>
                <MaskReveal className={styles.frame} delay={(i % 3) * 0.08}>
                  <Image src={item.src} alt={item.alt} fill sizes={SIZES[item.layout] || SIZES.square} className={styles.thumb} />
                </MaskReveal>
                <span className={styles.tileCaption}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {item.caption}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {open !== null && <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}
