'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { navItems, wedding } from '@/config/wedding';
import { Monogram } from '@/components/ui/Ornament';
import styles from './FloatingNav.module.css';

export default function FloatingNav({ visible }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // The section crossing the upper-middle band of the viewport is "active".
    const sections = navItems.map((item) => document.getElementById(item.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    if (!menuOpen) return undefined;
    const esc = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [menuOpen]);

  const { monogram } = wedding.couple;

  return (
    <>
      <motion.header
        className={`${styles.bar} ${scrolled ? styles.scrolled : ''}`}
        initial={{ y: -90, opacity: 0 }}
        animate={visible ? { y: 0, opacity: 1 } : { y: -90, opacity: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: visible ? 0.4 : 0 }}
      >
        <nav className={`${styles.inner} ${scrolled ? 'glass' : ''}`} aria-label="Main">
          <a href="#home" className={styles.brand} aria-label="Dilki and Supun — back to top">
            <Monogram left={monogram.left} right={monogram.right} />
          </a>

          <ul className={styles.links}>
            {navItems
              .filter((item) => item.id !== 'rsvp')
              .map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className={active === item.id ? styles.active : ''} aria-current={active === item.id ? 'true' : undefined}>
                    {item.label}
                    {active === item.id && <motion.span layoutId="nav-dot" className={styles.dot} />}
                  </a>
                </li>
              ))}
          </ul>

          <div className={styles.actions}>
            <a href="#rsvp" className={`btn btn-gold ${styles.rsvp}`}>
              RSVP
            </a>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <span />
              <span />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <button type="button" className={styles.close} onClick={() => setMenuOpen(false)} aria-label="Close menu" autoFocus>
              <span />
              <span />
            </button>
            <motion.ul
              className={styles.sheetLinks}
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
            >
              {navItems.map((item, i) => (
                <motion.li
                  key={item.id}
                  variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }}
                >
                  <a href={`#${item.id}`} onClick={() => setMenuOpen(false)} className={active === item.id ? styles.sheetActive : ''}>
                    <span className={styles.num}>0{i + 1}</span>
                    {item.label}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
            <p className={styles.sheetFoot}>
              {wedding.couple.names} · {wedding.date.dotted}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
