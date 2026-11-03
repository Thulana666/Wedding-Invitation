'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WeddingSymbol } from '@/components/ui/Ornament';
import styles from './Admin.module.css';

export default function LoginForm({ next, configured }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not sign in.');
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`admin-root ${styles.loginPage}`}>
      <form className={styles.loginCard} onSubmit={submit}>
        <WeddingSymbol className={styles.loginSymbol} size={64} />
        <p className={styles.eyebrow}>Dilki &amp; Supun</p>
        <h1 className={styles.loginTitle}>Event dashboard</h1>
        {!configured && (
          <p className={styles.notice} role="alert">
            Admin login is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) and AUTH_SECRET in the
            environment.
          </p>
        )}
        <label className={styles.field}>
          <span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`} disabled={busy || !configured}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
