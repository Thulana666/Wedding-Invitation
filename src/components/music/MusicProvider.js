'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { wedding } from '@/config/wedding';

/**
 * Background music. Never autoplays: playback only starts from a visitor's
 * click. Volume runs through a Web Audio gain node so fades and the volume
 * slider also work on iOS, where <audio>.volume is read-only.
 */

const MusicContext = createContext(null);
const PREF_KEY = 'ds-music';
const VOLUME_KEY = 'ds-music-volume';

const session = {
  get(key) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* storage unavailable */
    }
  },
};

export function MusicProvider({ children }) {
  const audioRef = useRef(null);
  const graphRef = useRef(null);
  const fadeRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(wedding.music.volume);
  const [unavailable, setUnavailable] = useState(false);
  const [preference, setPreference] = useState(null); // 'on' | 'off' | null

  useEffect(() => {
    const stored = Number.parseFloat(session.get(VOLUME_KEY));
    if (Number.isFinite(stored)) setVolumeState(Math.min(Math.max(stored, 0), 1));
    setPreference(session.get(PREF_KEY));
  }, []);

  const target = muted ? 0 : volume;

  const ensureGraph = useCallback(() => {
    const audio = audioRef.current;
    if (graphRef.current || !audio) return graphRef.current;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(ctx.destination);
      graphRef.current = { ctx, gain };
    } catch {
      graphRef.current = null;
    }
    return graphRef.current;
  }, []);

  const rampTo = useCallback((value, seconds) => {
    const audio = audioRef.current;
    const graph = graphRef.current;
    if (graph) {
      const now = graph.ctx.currentTime;
      graph.gain.gain.cancelScheduledValues(now);
      graph.gain.gain.setValueAtTime(graph.gain.gain.value, now);
      graph.gain.gain.linearRampToValueAtTime(value, now + seconds);
      return;
    }
    if (!audio) return;
    cancelAnimationFrame(fadeRef.current);
    const from = audio.volume;
    const start = performance.now();
    const step = (t) => {
      const k = Math.min((t - start) / (seconds * 1000), 1);
      audio.volume = from + (value - from) * k;
      if (k < 1) fadeRef.current = requestAnimationFrame(step);
    };
    fadeRef.current = requestAnimationFrame(step);
  }, []);

  /** Must be called from a click/tap handler. */
  const play = useCallback(
    async ({ fade = 2.8 } = {}) => {
      const audio = audioRef.current;
      if (!audio || unavailable) return;
      const graph = ensureGraph();
      if (graph?.ctx.state === 'suspended') graph.ctx.resume().catch(() => {});
      if (!graph) audio.volume = 0;
      try {
        await audio.play();
        setPlaying(true);
        setPreference('on');
        session.set(PREF_KEY, 'on');
        rampTo(target, fade);
      } catch {
        setPlaying(false);
      }
    },
    [ensureGraph, rampTo, target, unavailable],
  );

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setPlaying(false);
    setPreference('off');
    session.set(PREF_KEY, 'off');
    rampTo(0, 0.6);
    window.setTimeout(() => {
      if (audioRef.current && session.get(PREF_KEY) === 'off') audioRef.current.pause();
    }, 650);
  }, [rampTo]);

  const toggle = useCallback(() => (playing ? pause() : play({ fade: 1.6 })), [pause, play, playing]);

  const setVolume = useCallback(
    (value) => {
      const v = Math.min(Math.max(value, 0), 1);
      setVolumeState(v);
      session.set(VOLUME_KEY, String(v));
      if (v > 0 && muted) setMuted(false);
      if (playing) rampTo(v, 0.15);
    },
    [muted, playing, rampTo],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (playing) rampTo(next ? 0 : volume, 0.4);
      return next;
    });
  }, [playing, rampTo, volume]);

  useEffect(() => () => graphRef.current?.ctx.close().catch(() => {}), []);

  const value = useMemo(
    () => ({ playing, muted, volume, unavailable, preference, play, pause, toggle, setVolume, toggleMute, track: wedding.music }),
    [playing, muted, volume, unavailable, preference, play, pause, toggle, setVolume, toggleMute],
  );

  return (
    <MusicContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={wedding.music.src}
        loop
        preload="none"
        playsInline
        onError={() => {
          setUnavailable(true);
          setPlaying(false);
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used inside <MusicProvider>');
  return ctx;
}
