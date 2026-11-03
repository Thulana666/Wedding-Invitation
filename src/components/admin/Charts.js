'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './Charts.module.css';

/** Floating tooltip shared by the charts. */
function Tip({ tip }) {
  if (!tip) return null;
  return (
    <div className={styles.tip} style={{ left: tip.x, top: tip.y }} role="presentation">
      {tip.title && <strong>{tip.title}</strong>}
      {tip.rows.map((r) => (
        <span key={r.label}>
          {r.color && <i style={{ background: r.color }} />}
          {r.label}
          <b>{r.value}</b>
        </span>
      ))}
    </div>
  );
}

function useTip() {
  const ref = useRef(null);
  const [tip, setTip] = useState(null);
  const show = (event, title, rows) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setTip({ x: event.clientX - box.left, y: event.clientY - box.top, title, rows });
  };
  return { ref, tip, show, hide: () => setTip(null) };
}

/** Part-to-whole: attending · declined · awaiting reply (track). */
export function ResponseBar({ attending, declined, pending }) {
  const total = attending + declined + pending;
  const { ref, tip, show, hide } = useTip();
  const parts = [
    { key: 'attending', label: 'Attending', value: attending, color: 'var(--series-attending)' },
    { key: 'declined', label: 'Declined', value: declined, color: 'var(--series-declined)' },
    { key: 'pending', label: 'Awaiting reply', value: pending, color: 'var(--series-track)', track: true },
  ];
  return (
    <div ref={ref} className={styles.wrap}>
      <div className={styles.legend}>
        {parts.map((p) => (
          <span key={p.key}>
            <i style={{ background: p.color }} className={p.track ? styles.trackSwatch : ''} />
            {p.label} <b>{p.value}</b>
            <small>{total ? Math.round((p.value / total) * 100) : 0}%</small>
          </span>
        ))}
      </div>
      <div className={styles.stack} role="img" aria-label={`${attending} attending, ${declined} declined, ${pending} awaiting reply`}>
        {total === 0 && <span className={styles.stackEmpty}>No invitations yet</span>}
        {parts.map(
          (p) =>
            p.value > 0 && (
              <span
                key={p.key}
                style={{ flexGrow: p.value, background: p.color }}
                onPointerMove={(e) => show(e, p.label, [{ label: 'Invitations', value: `${p.value} (${Math.round((p.value / total) * 100)}%)` }])}
                onPointerLeave={hide}
              />
            ),
        )}
      </div>
      <Tip tip={tip} />
    </div>
  );
}

/** Horizontal bars with direct value labels — doubles as the table view. */
export function BarList({ items, unit = '', empty = 'No data yet' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const { ref, tip, show, hide } = useTip();
  if (!items.length || items.every((i) => i.value === 0)) return <p className={styles.empty}>{empty}</p>;
  return (
    <div ref={ref} className={styles.wrap}>
      <ul className={styles.barList}>
        {items.map((item) => (
          <li
            key={item.label}
            onPointerMove={(e) => show(e, item.label, [{ label: unit || 'Total', value: item.value }, ...(item.extra || [])])}
            onPointerLeave={hide}
          >
            <span className={styles.barLabel}>{item.label}</span>
            <span className={styles.barTrack}>
              <span className={styles.bar} style={{ width: `${(item.value / max) * 100}%` }} />
            </span>
            <span className={styles.barValue}>{item.value}</span>
          </li>
        ))}
      </ul>
      <Tip tip={tip} />
    </div>
  );
}

/** Vertical columns — party-size distribution. */
export function ColumnChart({ items, xLabel, yLabel }) {
  const { ref, tip, show, hide } = useTip();
  const max = Math.max(1, ...items.map((i) => i.value));
  const ticks = useMemo(() => {
    const step = Math.max(1, Math.ceil(max / 4));
    return Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  }, [max]);
  const top = ticks[ticks.length - 1] || 1;
  if (!items.length) return <p className={styles.empty}>No confirmed parties yet</p>;
  return (
    <div ref={ref} className={styles.wrap}>
      <div className={styles.columns} role="img" aria-label={items.map((i) => `${i.label}: ${i.value}`).join(', ')}>
        <div className={styles.yAxis} aria-hidden="true">
          {[...ticks].reverse().map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className={styles.plot}>
          {ticks.map((t) => (
            <span key={t} className={styles.grid} style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          {items.map((item) => (
            <div
              key={item.label}
              className={styles.colSlot}
              onPointerMove={(e) => show(e, `${xLabel}: ${item.label}`, [{ label: yLabel, value: item.value }])}
              onPointerLeave={hide}
            >
              <span className={styles.col} style={{ height: `${(item.value / top) * 100}%` }} />
              <span className={styles.colLabel}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className={styles.axisNote}>
        {xLabel} · {yLabel}
      </p>
      <Tip tip={tip} />
    </div>
  );
}

const fmtDay = (d) => new Date(`${d}T12:00:00+05:30`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Cumulative responses over time, two series with a crosshair tooltip. */
export function TrendChart({ trend }) {
  const { ref, tip, show, hide } = useTip();
  const [hover, setHover] = useState(null);
  const [W, setW] = useState(640);
  const H = 240;

  // Draw at the container's real width so text and marks keep their pixel size.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, trend.length]);
  const pad = { l: 34, r: 16, t: 14, b: 28 };

  const points = useMemo(() => {
    let a = 0;
    let d = 0;
    return trend.map((row) => {
      a += row.attending;
      d += row.declined;
      return { day: row.day, attending: a, declined: d };
    });
  }, [trend]);

  if (!points.length) return <p className={styles.empty}>Responses will appear here as guests reply.</p>;

  const max = Math.max(1, ...points.map((p) => Math.max(p.attending, p.declined)));
  const step = Math.max(1, Math.ceil(max / 4));
  const top = Math.ceil(max / step) * step;
  const x = (i) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (W - pad.l - pad.r));
  const y = (v) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const path = (key) => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  const series = [
    { key: 'attending', label: 'Attending', color: 'var(--series-attending)' },
    { key: 'declined', label: 'Declined', color: 'var(--series-declined)' },
  ];
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  const onMove = (event) => {
    const svg = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - svg.left) / svg.width) * W;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    setHover(best);
    const p = points[best];
    show(event, fmtDay(p.day), series.map((s) => ({ label: s.label, value: p[s.key], color: s.color })));
  };

  const last = points[points.length - 1];

  return (
    <div ref={ref} className={styles.wrap}>
      <div className={styles.legend}>
        {series.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} />
            {s.label} <b>{last[s.key]}</b>
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className={styles.svg}
        role="img"
        aria-label={`Cumulative responses: ${last.attending} attending and ${last.declined} declined by ${fmtDay(last.day)}`}
        onPointerMove={onMove}
        onPointerLeave={() => {
          setHover(null);
          hide();
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className={styles.gridLine} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className={styles.tick}>
              {t}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text key={p.day} x={x(i)} y={H - 8} textAnchor="middle" className={styles.tick}>
              {fmtDay(p.day)}
            </text>
          ) : null,
        )}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} className={styles.crosshair} />}
        {series.map((s) => (
          <g key={s.key}>
            <path d={path(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {(points.length <= 12 || hover !== null) &&
              points.map((p, i) =>
                points.length <= 12 || i === hover ? (
                  <circle key={p.day} cx={x(i)} cy={y(p[s.key])} r="4" fill={s.color} stroke="var(--a-surface)" strokeWidth="2" />
                ) : null,
              )}
          </g>
        ))}
      </svg>
      <table className="sr-only">
        <caption>Cumulative responses by day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Attending</th>
            <th>Declined</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <td>{p.day}</td>
              <td>{p.attending}</td>
              <td>{p.declined}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Tip tip={tip} />
    </div>
  );
}
