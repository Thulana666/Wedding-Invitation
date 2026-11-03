'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Monogram } from '@/components/ui/Ornament';
import { wedding } from '@/config/wedding';
import styles from './Admin.module.css';

const NAV = [
  { href: '/admin', label: 'Overview', icon: 'M4 13h6V4H4zm0 7h6v-5H4zm10 0h6v-9h-6zm0-16v5h6V4z' },
  { href: '/admin/guests', label: 'Guests', icon: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 20a5 5 0 0 0-4-4.9' },
];

export default function AdminShell({ username, children }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  };

  return (
    <div className={`admin-root ${styles.shell}`}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          <Monogram left={wedding.couple.monogram.left} right={wedding.couple.monogram.right} />
          <span>
            <strong>{wedding.couple.names}</strong>
            <small>{wedding.date.hero}</small>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Dashboard">
          {NAV.map((item) => {
            const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? styles.navActive : ''} aria-current={active ? 'page' : undefined}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sideFoot}>
          <a href="/" target="_blank" rel="noopener noreferrer">
            View website ↗
          </a>
          <span className={styles.user}>Signed in as {username}</span>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
