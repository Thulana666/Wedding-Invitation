'use client';

import { useEffect, useRef } from 'react';
import styles from './Admin.module.css';

/** Accessible dialog: focus moves in, Escape closes, focus returns on close. */
export default function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const first = ref.current?.querySelector('input, select, textarea, button');
    first?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const items = [...ref.current.querySelectorAll('a[href], button:not([disabled]), input, select, textarea')];
        if (!items.length) return;
        const [a, b] = [items[0], items[items.length - 1]];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          b.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className={styles.modalLayer}>
      <button type="button" className={styles.modalBackdrop} onClick={onClose} aria-label="Close dialog" tabIndex={-1} />
      <div ref={ref} className={`${styles.modal} ${wide ? styles.modalWide : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className={styles.modalHead}>
          <h2>{title}</h2>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className={styles.modalBody}>{children}</div>
        {footer && <footer className={styles.modalFoot}>{footer}</footer>}
      </div>
    </div>
  );
}
