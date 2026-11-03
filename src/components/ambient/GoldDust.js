'use client';

import { useEffect, useRef } from 'react';

/**
 * Lightweight floating gold particles on a canvas. Pauses when off-screen or
 * when the tab is hidden; draws a single still frame for reduced motion.
 */
export default function GoldDust({ density = 0.00006, className, style, hue = 'gold' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const palette = hue === 'ivory' ? ['255,250,240', '240,226,190'] : ['230,205,140', '255,238,196', '197,164,90'];

    let width = 0;
    let height = 0;
    let particles = [];
    let frame = 0;
    let visible = true;
    let last = performance.now();

    const seed = () => {
      const count = Math.min(90, Math.max(14, Math.round(width * height * density)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() < 0.15 ? 1.6 + Math.random() * 1.8 : 0.4 + Math.random() * 1.1,
        vy: -(4 + Math.random() * 12),
        drift: Math.random() * Math.PI * 2,
        twinkle: Math.random() * Math.PI * 2,
        color: palette[Math.floor(Math.random() * palette.length)],
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw(0);
    };

    const draw = (dt) => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (dt) {
          p.y += p.vy * dt;
          p.drift += dt * 0.6;
          p.twinkle += dt * 1.6;
          p.x += Math.sin(p.drift) * 6 * dt;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
        }
        const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(p.twinkle));
        if (p.r > 1.5) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, `rgba(${p.color},${alpha * 0.9})`);
          g.addColorStop(1, `rgba(${p.color},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${p.color},${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      draw(dt);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (reduced || frame || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [density, hue]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
    />
  );
}
