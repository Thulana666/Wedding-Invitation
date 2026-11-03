'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ScratchCard.module.css';

const REVEAL_AT = 0.45;
const BRUSH = 46;

function cssFont(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Paints a champagne-gold foil with grain, brushed lines and an embossed teaser. */
function paintFoil(ctx, w, h, teaser) {
  ctx.globalCompositeOperation = 'source-over';
  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, '#a88a43');
  base.addColorStop(0.22, '#d9bf7f');
  base.addColorStop(0.42, '#f1e2b6');
  base.addColorStop(0.58, '#c9a85e');
  base.addColorStop(0.8, '#e3cc92');
  base.addColorStop(1, '#a4843f');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // brushed metal
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
    ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = `rgba(90,64,20,${Math.random() * 0.05})`;
    ctx.fillRect(0, y + 1, w, 1);
  }
  // foil grain
  for (let i = 0; i < (w * h) / 60; i += 1) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,250,230,0.35)' : 'rgba(120,88,30,0.22)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  // diagonal sheen
  const sheen = ctx.createLinearGradient(0, h, w, 0);
  sheen.addColorStop(0.3, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.45, 'rgba(255,255,255,0.35)');
  sheen.addColorStop(0.52, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.7, 'rgba(255,255,255,0.16)');
  sheen.addColorStop(0.76, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // embossed frame
  const inset = Math.max(10, w * 0.03);
  ctx.strokeStyle = 'rgba(255,248,225,0.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(inset + 0.5, inset + 0.5, w - inset * 2, h - inset * 2);
  ctx.strokeStyle = 'rgba(110,80,28,0.35)';
  ctx.strokeRect(inset + 4.5, inset + 4.5, w - inset * 2 - 8, h - inset * 2 - 8);

  // teaser text, embossed
  const serif = cssFont('--font-serif', 'Georgia, serif');
  const sans = cssFont('--font-sans', 'system-ui, sans-serif');
  const size = Math.max(19, Math.min(34, w / 15));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `italic 500 ${size}px ${serif}`;
  const lines = w < 420 ? splitTeaser(teaser) : [teaser];
  lines.forEach((line, i) => {
    const y = h / 2 - ((lines.length - 1) * size * 0.62) + i * size * 1.24 - size * 0.35;
    ctx.fillStyle = 'rgba(255,250,232,0.85)';
    ctx.fillText(line, w / 2, y + 1);
    ctx.fillStyle = 'rgba(92,66,24,0.78)';
    ctx.fillText(line, w / 2, y);
  });

  ctx.font = `700 ${Math.max(9.5, size * 0.36)}px ${sans}`;
  const hint = 'S C R A T C H   H E R E';
  const hy = h / 2 + size * (lines.length > 1 ? 1.35 : 1.05);
  ctx.fillStyle = 'rgba(255,250,232,0.8)';
  ctx.fillText(`✦   ${hint}   ✦`, w / 2, hy + 1);
  ctx.fillStyle = 'rgba(92,66,24,0.7)';
  ctx.fillText(`✦   ${hint}   ✦`, w / 2, hy);
}

function splitTeaser(text) {
  const words = text.split(' ');
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

export default function ScratchCard({ teaser, children, onReveal }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const last = useRef(null);
  const moves = useRef(0);
  const sparkAt = useRef(0);
  const [revealed, setRevealed] = useState(false);
  const [started, setStarted] = useState(false);

  const reveal = useCallback(() => {
    setRevealed((was) => {
      if (!was) onReveal?.();
      return true;
    });
  }, [onReveal]);

  useEffect(() => {
    if (revealed) return undefined;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    let cancelled = false;

    const setup = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintFoil(ctx, rect.width, rect.height, teaser);
      ctxRef.current = ctx;
    };

    (document.fonts?.ready || Promise.resolve()).then(() => !cancelled && setup());
    let width = wrap.clientWidth;
    const ro = new ResizeObserver(() => {
      if (Math.abs(wrap.clientWidth - width) > 4) {
        width = wrap.clientWidth;
        setup();
      }
    });
    ro.observe(wrap);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [revealed, teaser]);

  const spark = (x, y) => {
    const now = performance.now();
    if (now - sparkAt.current < 45 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    sparkAt.current = now;
    const el = document.createElement('span');
    el.className = styles.spark;
    el.style.left = `${x + (Math.random() - 0.5) * 30}px`;
    el.style.top = `${y + (Math.random() - 0.5) * 30}px`;
    el.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
    el.style.setProperty('--dy', `${-20 - Math.random() * 40}px`);
    el.addEventListener('animationend', () => el.remove());
    wrapRef.current?.appendChild(el);
  };

  const measure = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 24) {
      total += 1;
      if (data[i] < 40) clear += 1;
    }
    if (total && clear / total >= REVEAL_AT) reveal();
  };

  const scratchTo = (x, y) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000'; // must be opaque: destination-out erases by source alpha
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = BRUSH;
    ctx.beginPath();
    const from = last.current || { x: x - 0.1, y };
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
    spark(x, y);
    moves.current += 1;
    if (moves.current % 10 === 0) measure();
  };

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e) => {
    if (revealed) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setStarted(true);
    last.current = null;
    const { x, y } = point(e);
    scratchTo(x, y);
  };
  const onPointerMove = (e) => {
    if (revealed || !last.current) return;
    if (e.pointerType === 'mouse' && e.buttons !== 1) return;
    const { x, y } = point(e);
    scratchTo(x, y);
  };
  const onPointerUp = () => {
    last.current = null;
    measure();
  };

  return (
    <div className={styles.root}>
      <div ref={wrapRef} className={`${styles.card} ${revealed ? styles.isRevealed : ''}`}>
        <div className={styles.under} aria-hidden={!revealed}>
          {children}
        </div>

        <AnimatePresence>
          {!revealed && (
            <motion.canvas
              key="foil"
              ref={canvasRef}
              className={styles.foil}
              aria-hidden="true"
              exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerLeave={(e) => e.pointerType === 'mouse' && onPointerUp()}
            />
          )}
        </AnimatePresence>

        {!revealed && !started && (
          <span className={styles.hand} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-.6a5.4 5.4 0 0 1-4.3-2.2L4.5 14.6a1.5 1.5 0 0 1 2.3-1.9L9 15" />
            </svg>
          </span>
        )}

        {revealed && (
          <div className={styles.burst} aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ '--a': `${(i / 14) * 360}deg`, '--d': `${70 + (i % 3) * 26}px`, animationDelay: `${(i % 4) * 0.04}s` }} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <p className={styles.instruction} aria-live="polite">
          {revealed ? 'Revealed — scroll on for more' : 'Scratch the gold foil with your finger or mouse'}
        </p>
        {!revealed && (
          <button type="button" className="btn btn-line" onClick={reveal}>
            Reveal without scratching
          </button>
        )}
      </div>
    </div>
  );
}
