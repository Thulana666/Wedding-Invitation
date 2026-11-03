'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { wedding } from '@/config/wedding';
import { RSVP_STEPS, validateRsvp } from '@/lib/rsvp';
import { Divider } from '@/components/ui/Ornament';
import { Reveal } from '@/components/ui/Reveal';
import RsvpConfirmation from './RsvpConfirmation';
import { Field, inputClass } from './Field';
import styles from './Rsvp.module.css';

const CODE_KEY = 'ds-invite-code';
const { rsvp, events } = wedding;

const STEP_META = {
  guest: { title: 'Your details', hint: 'Tell us who is replying.' },
  attendance: { title: 'Attendance', hint: 'Will you celebrate with us?' },
  party: { title: 'Your party', hint: 'Who will be joining you?' },
  notes: { title: 'Review', hint: 'A final note and confirmation.' },
};

function emptyForm(guest) {
  return {
    fullName: guest?.fullName || '',
    phone: guest?.phone || '',
    email: guest?.email || '',
    attending: guest?.status === 'attending' ? 'yes' : guest?.status === 'declined' ? 'no' : '',
    companions: guest?.companions || 0,
    companionNames: guest?.companionNames || [],
    events: guest?.events?.length ? guest.events : events.map((e) => e.id),
    notes: guest?.notes || '',
    website: '',
  };
}

const readCode = () => {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
};
const saveCode = (code) => {
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    /* storage unavailable */
  }
};

export default function RsvpSection({ invitation }) {
  const [guest, setGuest] = useState(invitation || null);
  const [form, setForm] = useState(() => emptyForm(invitation));
  const [view, setView] = useState(invitation && invitation.status !== 'pending' ? 'done' : 'form');
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef(null);

  // A returning guest on the main link: load their saved response.
  useEffect(() => {
    if (invitation) {
      saveCode(invitation.code);
      return;
    }
    const code = readCode();
    if (!code) return;
    fetch(`/api/rsvp/${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.guest) return;
        setGuest(data.guest);
        setForm(emptyForm(data.guest));
        if (data.guest.status !== 'pending') setView('done');
      })
      .catch(() => {});
  }, [invitation]);

  const maxGuests = guest?.maxGuests || rsvp.defaultMaxGuests;
  const maxCompanions = Math.max(0, maxGuests - 1);
  const steps = useMemo(
    () => (form.attending === 'no' ? ['guest', 'attendance', 'notes'] : ['guest', 'attendance', 'party', 'notes']),
    [form.attending],
  );
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex >= steps.length - 1;

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  };

  const setCompanions = (n) => {
    const count = Math.min(Math.max(n, 0), maxCompanions);
    setForm((f) => {
      const names = [...f.companionNames];
      names.length = count;
      return { ...f, companions: count, companionNames: Array.from(names, (v) => v || '') };
    });
    setErrors((e) => ({ ...e, companions: undefined, companionNames: undefined }));
  };

  const scrollToPanel = () => {
    const top = panelRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 60) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const validateStep = (name) => {
    const { errors: found } = validateRsvp(form, { maxGuests, fields: RSVP_STEPS[name] });
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    scrollToPanel();
  };

  const back = () => {
    setDirection(-1);
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
    scrollToPanel();
  };

  const submit = async () => {
    const result = validateRsvp(form, { maxGuests });
    if (!result.ok) {
      setErrors(result.errors);
      const firstBad = steps.findIndex((s) => RSVP_STEPS[s].some((f) => result.errors[f]));
      if (firstBad >= 0) setStepIndex(firstBad);
      return;
    }
    setSubmitting(true);
    setServerError('');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, code: guest?.code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          const firstBad = steps.findIndex((s) => RSVP_STEPS[s].some((f) => data.errors[f]));
          if (firstBad >= 0) setStepIndex(firstBad);
        }
        setServerError(data.error || 'We could not save your response. Please try again.');
        return;
      }
      if (data.guest) {
        setGuest(data.guest);
        saveCode(data.guest.code);
      }
      setView('done');
      scrollToPanel();
    } catch {
      setServerError('You appear to be offline. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const edit = () => {
    setForm(emptyForm(guest));
    setStepIndex(0);
    setDirection(1);
    setErrors({});
    setView('form');
    scrollToPanel();
  };

  const deadline = rsvp.deadline
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: wedding.date.timezone }).format(new Date(`${rsvp.deadline}T12:00:00+05:30`))
    : '';

  return (
    <section id="rsvp" className={`section ${styles.section}`} aria-labelledby="rsvp-title">
      <div className={styles.bg} aria-hidden="true">
        <Image src={wedding.images.together.src} alt="" fill sizes="100vw" className={styles.bgImg} />
      </div>
      <div className={`container ${styles.inner}`}>
        <Reveal className={styles.head}>
          <span className="kicker">Kindly reply</span>
          <h2 id="rsvp-title" className={`display ${styles.title}`}>
            {rsvp.headline}
          </h2>
          <Divider className={styles.divider} />
          {deadline && <p className={styles.deadline}>Please respond by {deadline}</p>}
          {guest?.fullName && view === 'form' && (
            <p className={styles.personal}>
              This invitation is for <strong>{guest.fullName}</strong>
              {maxGuests > 1 ? ` — up to ${maxGuests} guests in total` : ''}.
            </p>
          )}
        </Reveal>

        <Reveal delay={0.15}>
          <div ref={panelRef} className={`glass glass-light ${styles.panel}`}>
            <AnimatePresence mode="wait" initial={false}>
              {view === 'done' && guest ? (
                <RsvpConfirmation key="done" guest={guest} onEdit={edit} />
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ol className={styles.progress} aria-label="RSVP progress">
                    {steps.map((s, i) => (
                      <li key={s} className={`${i === stepIndex ? styles.current : ''} ${i < stepIndex ? styles.complete : ''}`} aria-current={i === stepIndex ? 'step' : undefined}>
                        <span className={styles.dot}>{i < stepIndex ? '✓' : i + 1}</span>
                        <span className={styles.stepLabel}>{STEP_META[s].title}</span>
                      </li>
                    ))}
                  </ol>
                  <div className={styles.bar} aria-hidden="true">
                    <motion.span animate={{ width: `${(stepIndex / Math.max(steps.length - 1, 1)) * 100}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
                  </div>

                  <form
                    className={styles.form}
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (isLast) submit();
                      else next();
                    }}
                  >
                    {/* Honeypot: hidden from people, tempting to bots. */}
                    <input className={styles.honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} aria-hidden="true" />

                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                      <motion.fieldset
                        key={step}
                        className={styles.step}
                        custom={direction}
                        initial={(d) => ({ opacity: 0, x: d * 40 })}
                        animate={{ opacity: 1, x: 0 }}
                        exit={(d) => ({ opacity: 0, x: d * -40 })}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <legend className={styles.legend}>
                          <span className={styles.stepCount}>
                            Step {stepIndex + 1} of {steps.length}
                          </span>
                          <span className={styles.stepTitle}>{STEP_META[step].title}</span>
                          <span className={styles.stepHint}>{STEP_META[step].hint}</span>
                        </legend>

                        {step === 'guest' && (
                          <div className={styles.fields}>
                            <Field label="Full name" error={errors.fullName} required>
                              {(p) => <input {...p} className={inputClass} autoComplete="name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Your full name" />}
                            </Field>
                            <Field label="Contact number" error={errors.phone} required>
                              {(p) => <input {...p} className={inputClass} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="07X XXX XXXX" />}
                            </Field>
                            <Field label="Email address" error={errors.email} optional>
                              {(p) => <input {...p} className={inputClass} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" />}
                            </Field>
                          </div>
                        )}

                        {step === 'attendance' && (
                          <div className={styles.choices} role="radiogroup" aria-label="Attendance" aria-describedby={errors.attending ? 'attending-error' : undefined}>
                            {[
                              { id: 'yes', title: 'Joyfully Accepts', text: 'I will be there to celebrate', icon: '♥' },
                              { id: 'no', title: 'Regretfully Declines', text: 'I am unable to attend', icon: '✉' },
                            ].map((c) => (
                              <label key={c.id} className={`${styles.choice} ${form.attending === c.id ? styles.selected : ''}`}>
                                <input type="radio" name="attending" value={c.id} checked={form.attending === c.id} onChange={() => set('attending', c.id)} />
                                <span className={styles.choiceIcon} aria-hidden="true">
                                  {c.icon}
                                </span>
                                <span className={styles.choiceTitle}>{c.title}</span>
                                <span className={styles.choiceText}>{c.text}</span>
                              </label>
                            ))}
                            {errors.attending && (
                              <p id="attending-error" className={styles.error} role="alert">
                                {errors.attending}
                              </p>
                            )}
                          </div>
                        )}

                        {step === 'party' && (
                          <div className={styles.fields}>
                            <div className={styles.group}>
                              <p className={styles.groupLabel} id="companions-label">
                                Accompanying guests
                              </p>
                              {maxCompanions === 0 ? (
                                <p className={styles.muted}>This invitation is for you only.</p>
                              ) : (
                                <div className={styles.stepper} role="group" aria-labelledby="companions-label">
                                  <button type="button" onClick={() => setCompanions(form.companions - 1)} disabled={form.companions <= 0} aria-label="Fewer guests">
                                    −
                                  </button>
                                  <output aria-live="polite">
                                    <strong>{form.companions}</strong>
                                    <span>of {maxCompanions} allowed</span>
                                  </output>
                                  <button type="button" onClick={() => setCompanions(form.companions + 1)} disabled={form.companions >= maxCompanions} aria-label="More guests">
                                    +
                                  </button>
                                </div>
                              )}
                              {errors.companions && <p className={styles.error}>{errors.companions}</p>}
                            </div>

                            <AnimatePresence initial={false}>
                              {Array.from({ length: form.companions }, (_, i) => (
                                <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                  <Field label={`Guest ${i + 2} — full name`} error={errors.companionNames && !form.companionNames[i]?.trim() ? errors.companionNames : ''} required>
                                    {(p) => (
                                      <input
                                        {...p}
                                        className={inputClass}
                                        value={form.companionNames[i] || ''}
                                        onChange={(e) => {
                                          const names = [...form.companionNames];
                                          names[i] = e.target.value;
                                          set('companionNames', names);
                                        }}
                                        placeholder="Name of accompanying guest"
                                      />
                                    )}
                                  </Field>
                                </motion.div>
                              ))}
                            </AnimatePresence>

                            <div className={styles.group}>
                              <p className={styles.groupLabel}>Which events will you attend?</p>
                              <div className={styles.checks}>
                                {events.map((ev) => {
                                  const on = form.events.includes(ev.id);
                                  return (
                                    <label key={ev.id} className={`${styles.check} ${on ? styles.selected : ''}`}>
                                      <input
                                        type="checkbox"
                                        checked={on}
                                        onChange={() => set('events', on ? form.events.filter((x) => x !== ev.id) : [...form.events, ev.id])}
                                      />
                                      <span className={styles.box} aria-hidden="true" />
                                      <span>
                                        <strong>{ev.title}</strong>
                                        <small>{ev.time}</small>
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                              {errors.events && <p className={styles.error}>{errors.events}</p>}
                            </div>
                          </div>
                        )}

                        {step === 'notes' && (
                          <div className={styles.fields}>
                            <Field label={form.attending === 'no' ? 'A message for the couple' : 'Additional notes'} optional>
                              {(p) => <textarea {...p} className={inputClass} rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Your wishes or anything else we should know…" />}
                            </Field>
                            <dl className={styles.review}>
                              <div>
                                <dt>Guest</dt>
                                <dd>{form.fullName}</dd>
                              </div>
                              <div>
                                <dt>Reply</dt>
                                <dd>{form.attending === 'yes' ? 'Joyfully accepts' : 'Regretfully declines'}</dd>
                              </div>
                              {form.attending === 'yes' && (
                                <>
                                  <div>
                                    <dt>Party</dt>
                                    <dd>
                                      {1 + form.companions} {form.companions ? 'guests' : 'guest'}
                                      {form.companions > 0 && ` — with ${form.companionNames.filter(Boolean).join(', ')}`}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt>Events</dt>
                                    <dd>{events.filter((e) => form.events.includes(e.id)).map((e) => e.title).join(', ')}</dd>
                                  </div>
                                </>
                              )}
                            </dl>
                          </div>
                        )}
                      </motion.fieldset>
                    </AnimatePresence>

                    {serverError && (
                      <p className={styles.serverError} role="alert">
                        {serverError}
                      </p>
                    )}

                    <div className={styles.navRow}>
                      {stepIndex > 0 ? (
                        <button type="button" className="btn btn-line" onClick={back} disabled={submitting}>
                          Back
                        </button>
                      ) : (
                        <span />
                      )}
                      <button type="submit" className={`btn ${isLast ? 'btn-gold' : 'btn-dark'}`} disabled={submitting}>
                        {submitting ? (
                          <>
                            <span className={styles.spinner} aria-hidden="true" /> Sending…
                          </>
                        ) : isLast ? (
                          guest && guest.status !== 'pending' ? 'Update RSVP' : 'Send RSVP'
                        ) : (
                          'Continue'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
