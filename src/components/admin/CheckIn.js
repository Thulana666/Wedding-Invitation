'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { wedding } from '@/config/wedding';
import { dietaryLabel, eventLabel } from '@/lib/rsvp';
import styles from './Admin.module.css';

const time = (iso) =>
  iso ? new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', dateStyle: 'medium', timeZone: wedding.date.timezone }).format(new Date(iso)) : '';

const STATE_META = {
  ready: { tone: 'good', title: 'Invitation verified' },
  checked_in: { tone: 'good', title: 'Checked in' },
  already: { tone: 'warning', title: 'Already checked in' },
  not_attending: { tone: 'critical', title: 'Not a confirmed guest' },
  not_found: { tone: 'critical', title: 'Invitation not found' },
  error: { tone: 'critical', title: 'Could not verify' },
};

export default function CheckIn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const busyRef = useRef(false);
  const lastCode = useRef({ value: '', at: 0 });
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manual, setManual] = useState('');
  const [result, setResult] = useState(null);
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState([]);
  const [totals, setTotals] = useState(null);

  const loadTotals = useCallback(async () => {
    const res = await fetch('/api/admin/stats', { cache: 'no-store' });
    if (res.ok) setTotals((await res.json()).totals);
  }, []);

  useEffect(() => {
    loadTotals();
  }, [loadTotals]);

  const post = async (body) => {
    const res = await fetch('/api/admin/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok && !data.guest) return { state: data.state || 'error', message: data.error || 'Something went wrong.' };
    return data;
  };

  const lookup = useCallback(async (code) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const data = await post({ action: 'lookup', code });
      setResult(data);
      if (data.guest) setCount(1 + (data.guest.companions || 0));
      navigator.vibrate?.(data.state === 'ready' ? 60 : [40, 60, 40]);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => stop, [stop]);

  const start = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not available in this browser. Use the code field instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setScanning(true);
    } catch {
      setCameraError('Camera permission was denied. Allow camera access, or type the invitation code below.');
    }
  };

  // Attach the stream and decode frames a few times per second.
  useEffect(() => {
    if (!scanning) return undefined;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return undefined;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let timer;
    const scan = () => {
      if (video.readyState >= 2 && !busyRef.current) {
        const w = 480;
        const h = Math.round((video.videoHeight / video.videoWidth) * w) || 360;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
        const now = Date.now();
        if (found?.data && !(found.data === lastCode.current.value && now - lastCode.current.at < 4000)) {
          lastCode.current = { value: found.data, at: now };
          lookup(found.data);
        }
      }
      timer = setTimeout(scan, 220);
    };
    scan();
    return () => clearTimeout(timer);
  }, [scanning, lookup]);

  const checkIn = async () => {
    if (!result?.guest) return;
    setBusy(true);
    const data = await post({ action: 'checkin', code: result.guest.code, count });
    setResult(data);
    setBusy(false);
    if (data.state === 'checked_in') {
      setRecent((r) => [{ name: data.guest.fullName, count: data.guest.checkedInCount, at: data.guest.checkedInAt }, ...r].slice(0, 8));
      loadTotals();
    }
  };

  const undo = async () => {
    if (!result?.guest) return;
    setBusy(true);
    const data = await post({ action: 'undo', id: result.guest.id });
    setResult(data);
    setBusy(false);
    loadTotals();
  };

  const meta = result ? STATE_META[result.state] || STATE_META.error : null;
  const g = result?.guest;

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>On the day</p>
          <h1 className={styles.pageTitle}>Guest check-in</h1>
          <p className={styles.pageSub}>Scan the QR entry pass on a guest’s phone, or type their invitation code.</p>
        </div>
        {totals && (
          <div className={styles.checkTotals}>
            <strong>{totals.checked_in_people}</strong>
            <span>of {totals.expected} expected guests have arrived</span>
          </div>
        )}
      </header>

      <div className={styles.checkGrid}>
        <section className={styles.card}>
          <div className={styles.scanner}>
            {scanning ? (
              <>
                <video ref={videoRef} playsInline muted className={styles.video} />
                <span className={styles.scanFrame} aria-hidden="true" />
              </>
            ) : (
              <div className={styles.scanIdle}>
                <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                  <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" />
                </svg>
                <p>Camera is off</p>
              </div>
            )}
            <canvas ref={canvasRef} hidden />
          </div>
          <div className={styles.inline}>
            {scanning ? (
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={stop}>
                Stop camera
              </button>
            ) : (
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={start}>
                Start scanning
              </button>
            )}
          </div>
          {cameraError && <p className={styles.formError}>{cameraError}</p>}

          <form
            className={styles.manual}
            onSubmit={(e) => {
              e.preventDefault();
              if (manual.trim()) lookup(manual.trim());
            }}
          >
            <label className={styles.field}>
              <span>Invitation code or link</span>
              <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. VQAVJ9KZ6R" autoCapitalize="characters" autoComplete="off" />
            </label>
            <button className={`${styles.btn} ${styles.btnGhost}`} disabled={busy}>
              Verify
            </button>
          </form>
        </section>

        <section className={`${styles.card} ${styles.resultCard}`} aria-live="polite">
          {!result && <p className={styles.muted}>Scan a pass to see the guest’s details here.</p>}
          {result && (
            <>
              <div className={`${styles.verdict} ${styles[`tone_${meta.tone}`]}`}>
                <span aria-hidden="true">{meta.tone === 'good' ? '✓' : meta.tone === 'warning' ? '!' : '×'}</span>
                <div>
                  <strong>{meta.title}</strong>
                  <p>{result.message}</p>
                </div>
              </div>

              {g && (
                <>
                  <h2 className={styles.guestName}>{g.fullName}</h2>
                  <dl className={styles.details}>
                    <div>
                      <dt>Allocated</dt>
                      <dd>{g.maxGuests} {g.maxGuests === 1 ? 'seat' : 'seats'}</dd>
                    </div>
                    <div>
                      <dt>RSVP party</dt>
                      <dd>{g.status === 'attending' ? 1 + g.companions : '—'}</dd>
                    </div>
                    {g.companionNames.length > 0 && (
                      <div className={styles.span2}>
                        <dt>Accompanying</dt>
                        <dd>{g.companionNames.join(', ')}</dd>
                      </div>
                    )}
                    {g.events.length > 0 && (
                      <div className={styles.span2}>
                        <dt>Events</dt>
                        <dd>{g.events.map(eventLabel).join(', ')}</dd>
                      </div>
                    )}
                    {g.dietary && (
                      <div>
                        <dt>Meal</dt>
                        <dd>{dietaryLabel(g.dietary)}</dd>
                      </div>
                    )}
                    {g.allergies && (
                      <div>
                        <dt>Allergies</dt>
                        <dd className={styles.allergy}>⚠ {g.allergies}</dd>
                      </div>
                    )}
                    {g.checkedInAt && (
                      <div className={styles.span2}>
                        <dt>Arrived</dt>
                        <dd>
                          {time(g.checkedInAt)} · {g.checkedInCount} {g.checkedInCount === 1 ? 'guest' : 'guests'}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {result.state === 'ready' && (
                    <div className={styles.checkAction}>
                      <label className={styles.field}>
                        <span>Guests arriving now</span>
                        <div className={styles.counter}>
                          <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="Fewer">
                            −
                          </button>
                          <output>{count}</output>
                          <button type="button" onClick={() => setCount((c) => Math.min(g.maxGuests, c + 1))} aria-label="More">
                            +
                          </button>
                        </div>
                      </label>
                      <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`} onClick={checkIn} disabled={busy}>
                        {busy ? 'Checking in…' : `Check in ${count} ${count === 1 ? 'guest' : 'guests'}`}
                      </button>
                    </div>
                  )}
                  {(result.state === 'checked_in' || result.state === 'already') && (
                    <button type="button" className={styles.linkBtn} onClick={undo} disabled={busy}>
                      Undo this check-in
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {recent.length > 0 && (
            <div className={styles.recent}>
              <p className={styles.fieldLabel}>Checked in on this device</p>
              <ul>
                {recent.map((r) => (
                  <li key={`${r.name}-${r.at}`}>
                    <span>{r.name}</span>
                    <span>
                      {r.count} · {new Date(r.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
