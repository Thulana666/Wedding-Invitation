'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useMusic } from './MusicProvider';
import styles from './MusicPlayer.module.css';

function Bars({ active }) {
  return (
    <span className={`${styles.bars} ${active ? styles.barsActive : ''}`} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{ animationDelay: `${i * -0.22}s` }} />
      ))}
    </span>
  );
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
  </svg>
);
const SpeakerIcon = ({ muted }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
    {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />}
  </svg>
);

export default function MusicPlayer({ visible }) {
  const { playing, muted, volume, unavailable, preference, play, toggle, setVolume, toggleMute, track } = useMusic();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Resume on the first interaction after a reload if the visitor had music on.
  useEffect(() => {
    if (!visible || playing || preference !== 'on' || unavailable) return undefined;
    const resume = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      play({ fade: 2.5 });
    };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
  }, [visible, playing, preference, unavailable, play]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const esc = (event) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={rootRef}
          className={styles.root}
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                id="music-panel"
                className={`glass ${styles.panel}`}
                role="group"
                aria-label="Music controls"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={styles.track}>
                  <Bars active={playing && !muted} />
                  <div>
                    <p className={styles.title}>{track.title}</p>
                    <p className={styles.artist}>{unavailable ? 'Music file not found' : track.artist}</p>
                  </div>
                </div>
                <div className={styles.controls}>
                  <button type="button" className={styles.iconBtn} onClick={toggle} disabled={unavailable} aria-label={playing ? 'Pause music' : 'Play music'}>
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <button type="button" className={styles.iconBtn} onClick={toggleMute} disabled={unavailable} aria-label={muted ? 'Unmute music' : 'Mute music'} aria-pressed={muted}>
                    <SpeakerIcon muted={muted || volume === 0} />
                  </button>
                  <label className={styles.volume}>
                    <span className="sr-only">Volume</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={muted ? 0 : volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      style={{ '--fill': `${(muted ? 0 : volume) * 100}%` }}
                      disabled={unavailable}
                    />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`glass ${styles.pill}`}>
            <button
              type="button"
              className={styles.main}
              onClick={toggle}
              disabled={unavailable}
              aria-label={unavailable ? 'Music unavailable' : playing ? 'Pause music' : 'Play music'}
            >
              {playing ? <Bars active={!muted} /> : <PlayIcon />}
              <span className={styles.label}>{playing ? (muted ? 'Muted' : 'Now playing') : 'Play music'}</span>
            </button>
            <button
              type="button"
              className={styles.more}
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="music-panel"
              aria-label="Music settings"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }}>
                <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
