'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { wedding } from '@/config/wedding';
import { getCountdown } from '@/lib/countdown';
import GoldDust from '@/components/ambient/GoldDust';
import SectionHeading from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import styles from './Countdown.module.css';

function Unit({ value, label }) {
  const text = value === null ? '––' : String(value).padStart(2, '0');
  return (
    <div className={`glass ${styles.unit}`}>
      <span className={styles.bubbles} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className={styles.value} aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            initial={{ y: '-60%', opacity: 0, filter: 'blur(4px)' }}
            animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: '60%', opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'inline-block' }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export default function Countdown() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    let timer;
    const tick = () => {
      setTime(getCountdown());
      // Align updates to the start of each second.
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);

  const { date } = wedding;
  const state = time?.state ?? 'before';
  const units = [
    { label: 'Days', value: time?.days ?? null },
    { label: 'Hours', value: time?.hours ?? null },
    { label: 'Minutes', value: time?.minutes ?? null },
    { label: 'Seconds', value: time?.seconds ?? null },
  ];

  const srText =
    state === 'before' && time
      ? `${time.days} days, ${time.hours} hours and ${time.minutes} minutes to go`
      : state === 'during'
        ? 'The wedding is happening today'
        : state === 'after'
          ? 'Dilki and Supun are now married'
          : '';

  return (
    <section className={`section ${styles.section}`} aria-labelledby="countdown-title">
      <GoldDust density={0.00005} />
      <div className={styles.glow} aria-hidden="true" />
      <div className="container">
        {state === 'before' && (
          <>
            <SectionHeading kicker="Counting every moment" title="Until We Say I Do" tone="dark" id="countdown-title" />
            <Reveal className={styles.grid} delay={0.2}>
              {units.map((u) => (
                <Unit key={u.label} {...u} />
              ))}
            </Reveal>
            <p className="sr-only" aria-live="off">
              {srText}
            </p>
          </>
        )}

        {state === 'during' && (
          <SectionHeading kicker={date.long} title="Today Is the Day" tone="dark" id="countdown-title">
            Dilki &amp; Supun are celebrating their wedding right now at {wedding.venue.short}.
          </SectionHeading>
        )}

        {state === 'after' && (
          <SectionHeading kicker={date.long} title="Just Married" tone="dark" id="countdown-title">
            Thank you for being part of our story. With love, Dilki &amp; Supun.
          </SectionHeading>
        )}

        <Reveal className={styles.when} delay={0.3}>
          <time dateTime={date.start}>{date.long}</time>
          <span aria-hidden="true">·</span>
          <span>{date.startTime}, Sri Lanka time</span>
        </Reveal>
      </div>
    </section>
  );
}
