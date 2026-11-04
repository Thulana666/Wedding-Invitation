'use client';

import { MotionConfig } from 'framer-motion';
import { useEffect, useState } from 'react';
import InvitationIntro from '@/components/opening/InvitationIntro';
import FloatingNav from '@/components/nav/FloatingNav';
import Hero from '@/components/hero/Hero';
import ScratchSection from '@/components/sections/ScratchSection';
import LoveStory from '@/components/sections/LoveStory';
import Countdown from '@/components/sections/Countdown';
import FormalInvitation from '@/components/sections/FormalInvitation';
import WeddingDetails from '@/components/sections/WeddingDetails';
import Gallery from '@/components/gallery/Gallery';
import LetterSection from '@/components/sections/LetterSection';
import Location from '@/components/sections/Location';
import RsvpSection from '@/components/rsvp/RsvpSection';
import Footer from '@/components/sections/Footer';
import { MusicProvider, useMusic } from '@/components/music/MusicProvider';
import MusicPlayer from '@/components/music/MusicPlayer';
import styles from './WeddingExperience.module.css';

const OPENED_KEY = 'ds-opened';

function Experience({ invitation, inviteNotFound }) {
  // intro → opening (animation running) → open
  const [phase, setPhase] = useState('intro');
  // The hero starts revealing as the opening scene dissolves into light.
  const [heroDelay, setHeroDelay] = useState(0.1);
  const [toast, setToast] = useState(inviteNotFound);
  const music = useMusic();

  useEffect(() => {
    let opened = false;
    try {
      opened = sessionStorage.getItem(OPENED_KEY) === '1';
    } catch {
      /* storage unavailable */
    }
    if (opened) {
      setHeroDelay(0.1);
      setPhase('open');
    } else {
      document.body.classList.add('is-locked');
    }
    return () => document.body.classList.remove('is-locked');
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(false), 7000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleOpen = ({ withMusic, heroDelay: delay }) => {
    if (withMusic) music.play({ fade: 3.5 });
    setHeroDelay(delay);
    setPhase('opening');
    try {
      sessionStorage.setItem(OPENED_KEY, '1');
    } catch {
      /* storage unavailable */
    }
  };

  const handleDone = () => {
    setPhase('open');
    document.body.classList.remove('is-locked');
    document.documentElement.dataset.opened = '1';
  };

  const revealed = phase !== 'intro';

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {phase !== 'open' && (
        <InvitationIntro
          defaultMusic={music.preference !== 'off'}
          onOpen={handleOpen}
          onDone={handleDone}
        />
      )}

      <FloatingNav visible={phase === 'open'} />

      <main id="main" className={styles.main} aria-hidden={phase === 'intro' ? true : undefined}>
        <Hero revealed={revealed} delay={heroDelay} />
        <ScratchSection />
        <LoveStory />
        <Countdown />
        <FormalInvitation />
        <WeddingDetails />
        <Gallery />
        <LetterSection />
        <Location />
        <RsvpSection invitation={invitation} />
      </main>
      <Footer />

      <MusicPlayer visible={phase === 'open'} />

      {toast && phase === 'open' && (
        <div className={`glass glass-light ${styles.toast}`} role="status">
          We could not find that personal invitation link — you can still RSVP below.
          <button type="button" onClick={() => setToast(false)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </>
  );
}

export default function WeddingExperience(props) {
  return (
    <MusicProvider>
      <MotionConfig reducedMotion="user">
        <Experience {...props} />
      </MotionConfig>
    </MusicProvider>
  );
}
