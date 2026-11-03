'use client';

import { useState } from 'react';
import { mapsDirectionsUrl, mapsEmbedUrl, mapsSearchUrl, wedding } from '@/config/wedding';
import SectionHeading from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { ArrowIcon, PhoneIcon, PinIcon } from '@/components/ui/Icons';
import styles from './Location.module.css';

export default function Location() {
  const { venue, contacts } = wedding;
  // The map only loads on request, keeping the page fast and free of third-party cookies until needed.
  const [showMap, setShowMap] = useState(false);

  return (
    <section id="location" className={`section ${styles.section}`} aria-labelledby="location-title">
      <div className="container">
        <SectionHeading kicker="Location & contact" title="Finding Your Way" id="location-title" />

        <div className={styles.layout}>
          <Reveal className={styles.mapWrap}>
            {showMap ? (
              <iframe
                className={styles.map}
                src={mapsEmbedUrl()}
                title={`Map showing ${venue.hotel}, ${venue.city}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <button type="button" className={styles.mapPlaceholder} onClick={() => setShowMap(true)}>
                <span className={styles.mapLines} aria-hidden="true" />
                <span className={`glass ${styles.mapPin}`}>
                  <PinIcon width={26} height={26} />
                </span>
                <span className={styles.mapCta}>Load interactive map</span>
                <span className={styles.mapNote}>Google Maps</span>
              </button>
            )}

            <div className={`glass glass-light ${styles.venueCard}`}>
              <span className="kicker">The venue</span>
              <h3 className={styles.hotel}>{venue.hotel}</h3>
              <p className={styles.hall}>{venue.hall}</p>
              <address className={styles.address}>
                {venue.city}, {venue.country}.
              </address>
              <div className={styles.actions}>
                <a href={mapsDirectionsUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                  Get Directions <ArrowIcon />
                </a>
                <a href={mapsSearchUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-line">
                  Open in Maps
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal className={styles.contacts} delay={0.15}>
            <h3 className={styles.contactsTitle}>Need help on the day?</h3>
            <p className={styles.contactsText}>Call either of our family contacts for directions or any questions.</p>
            {contacts.map((c) => (
              <a key={c.phone} href={`tel:${c.tel}`} className={styles.contact}>
                <span className={styles.contactIcon}>
                  <PhoneIcon width={20} height={20} />
                </span>
                <span className={styles.contactBody}>
                  <span className={styles.contactName}>Contact {c.name}</span>
                  <span className={styles.contactPhone}>{c.phone}</span>
                </span>
                <ArrowIcon className={styles.contactArrow} />
              </a>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
