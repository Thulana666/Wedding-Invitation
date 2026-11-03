'use client';

import { mapsDirectionsUrl, wedding } from '@/config/wedding';
import { downloadIcs } from '@/lib/calendar';
import SectionHeading from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { ArrowIcon, CalendarIcon, ClockIcon, LotusIcon, PhoneIcon, PinIcon, RingsIcon, VenueIcon } from '@/components/ui/Icons';
import styles from './WeddingDetails.module.css';

export default function WeddingDetails() {
  const { date, venue, events, contacts } = wedding;
  const ceremony = events.find((e) => e.id === 'ceremony');
  const poruwa = events.find((e) => e.id === 'poruwa');

  return (
    <section id="details" className={`section ${styles.section}`} aria-labelledby="details-title">
      <div className="container">
        <SectionHeading kicker="Join us" title="Wedding Details" id="details-title">
          Everything you need to know to celebrate with us.
        </SectionHeading>

        <div className={styles.grid}>
          <Reveal as="article" className={`${styles.card} ${styles.feature}`}>
            <RingsIcon className={styles.icon} width={40} height={40} />
            <h3 className={styles.cardKicker}>{ceremony.title}</h3>
            <p className={styles.big}>
              <time dateTime={date.start}>{date.long}</time>
            </p>
            <p className={styles.meta}>
              <ClockIcon width={18} height={18} /> {ceremony.time}
            </p>
            <button type="button" className={`btn btn-line ${styles.cal}`} onClick={downloadIcs}>
              <CalendarIcon width={18} height={18} /> Add to calendar
            </button>
          </Reveal>

          <Reveal as="article" className={styles.card} delay={0.1}>
            <LotusIcon className={styles.icon} width={40} height={40} />
            <h3 className={styles.cardKicker}>{poruwa.title}</h3>
            <p className={styles.big}>{poruwa.time}</p>
            <p className={styles.note}>{poruwa.description}</p>
          </Reveal>

          <Reveal as="article" className={`${styles.card} ${styles.venue}`} delay={0.2}>
            <VenueIcon className={styles.icon} width={40} height={40} />
            <h3 className={styles.cardKicker}>Venue</h3>
            <p className={styles.big}>{venue.hall}</p>
            <address className={styles.address}>
              {venue.hotel}
              <br />
              {venue.city}, {venue.country}.
            </address>
            <a href={mapsDirectionsUrl()} target="_blank" rel="noopener noreferrer" className={`btn btn-gold ${styles.directions}`}>
              <PinIcon width={18} height={18} /> Get Directions <ArrowIcon />
            </a>
          </Reveal>
        </div>

        <Reveal className={styles.contacts} delay={0.1}>
          <p className={styles.contactsLabel}>Questions? We are happy to help</p>
          <ul>
            {contacts.map((c) => (
              <li key={c.phone}>
                <a href={`tel:${c.tel}`} className={styles.contact}>
                  <span className={styles.contactIcon}>
                    <PhoneIcon width={18} height={18} />
                  </span>
                  <span>
                    <strong>{c.name}</strong>
                    <span>{c.phone}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
