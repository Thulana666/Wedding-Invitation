'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { wedding } from '@/config/wedding';
import { eventLabel } from '@/lib/rsvp';
import { getCountdown } from '@/lib/countdown';
import { BarList, ColumnChart, ResponseBar, TrendChart } from './Charts';
import styles from './Admin.module.css';

export const EXPORTS = [
  { list: 'all', label: 'Complete guest list' },
  { list: 'confirmed', label: 'Confirmed guests' },
  { list: 'declined', label: 'Declined guests' },
  { list: 'pending', label: 'Awaiting reply' },
  { list: 'events', label: 'Event attendance' },
];

function Kpi({ label, value, sub, accent, wide }) {
  return (
    <div className={`${styles.kpi} ${accent ? styles.kpiAccent : ''} ${wide ? styles.kpiWide : ''}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      {sub && <span className={styles.kpiSub}>{sub}</span>}
    </div>
  );
}

export default function Overview({ initialStats }) {
  const [stats, setStats] = useState(initialStats);
  const [updated, setUpdated] = useState(null);
  const [days, setDays] = useState(null);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/admin/stats', { cache: 'no-store' });
    if (res.ok) {
      setStats(await res.json());
      setUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    setUpdated(new Date());
    const c = getCountdown();
    setDays(c.state === 'before' ? c.days : 0);
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, [refresh]);

  const t = stats.totals;
  const rate = t.invitations ? Math.round((t.responses / t.invitations) * 100) : 0;
  const people = (rows, label) => rows.map((r) => ({ label: label(r.id), value: r.people, extra: [{ label: 'Parties', value: r.parties }] })).sort((a, b) => b.value - a.value);

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>{wedding.date.long}</p>
          <h1 className={styles.pageTitle}>Overview</h1>
          <p className={styles.pageSub}>
            {days === null ? '' : days > 0 ? `${days} days to go · ` : ''}
            {wedding.venue.hall}, {wedding.venue.short}
          </p>
        </div>
        <div className={styles.headActions}>
          {updated && <span className={styles.updated}>Updated {updated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={refresh}>
            Refresh
          </button>
          <Link href="/admin/guests?new=1" className={`${styles.btn} ${styles.btnPrimary}`}>
            Add guest
          </Link>
        </div>
      </header>

      <section className={styles.kpis} aria-label="Key figures">
        <Kpi label="Invited guests" value={t.invitations} sub={`${t.seats} seats allocated`} />
        <Kpi label="Confirmed responses" value={t.responses} sub={`${rate}% response rate`} />
        <Kpi label="Attending guests" value={t.attending} sub="primary guests" />
        <Kpi label="Declined" value={t.declined} />
        <Kpi label="Pending responses" value={t.pending} />
        <Kpi label="Accompanying guests" value={t.companions} />
        <Kpi label="Expected attendance" value={t.expected} sub="guests incl. companions" accent wide />
      </section>

      <div className={styles.grid2}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Confirmed vs declined</h2>
          <ResponseBar attending={t.attending} declined={t.declined} pending={t.pending} />
        </section>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Expected attendance</h2>
          <BarList
            unit="Guests"
            items={[
              { label: 'Seats allocated', value: t.seats },
              { label: 'Expected guests', value: t.expected },
            ]}
          />
        </section>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>RSVP responses over time</h2>
        <TrendChart trend={stats.trend} />
      </section>

      <div className={styles.grid2}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Party size</h2>
          <ColumnChart items={stats.sizes.map((x) => ({ label: String(x.size), value: x.parties }))} xLabel="Guests per party" yLabel="Parties" />
        </section>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Event attendance</h2>
          <BarList unit="Guests" items={people(stats.events, eventLabel)} empty="No confirmed guests yet" />
        </section>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Export lists (CSV)</h2>
        <ul className={styles.exports}>
          {EXPORTS.map((e) => (
            <li key={e.list}>
              <a href={`/api/admin/export?list=${e.list}`} download>
                <span>{e.label}</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
