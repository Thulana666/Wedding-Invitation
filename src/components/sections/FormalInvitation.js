import Image from 'next/image';
import { wedding } from '@/config/wedding';
import { Divider, WeddingSymbol } from '@/components/ui/Ornament';
import { MaskReveal, Reveal } from '@/components/ui/Reveal';
import styles from './FormalInvitation.module.css';

export default function FormalInvitation() {
  const { families, couple, date, venue, invitation, images } = wedding;
  return (
    <section id="invitation" className={`section ${styles.section}`} aria-labelledby="invitation-title">
      <div className={`container ${styles.layout}`}>
        <div className={styles.visual}>
          <MaskReveal className={styles.photo} direction="right">
            <Image src={images.invitation.src} alt={images.invitation.alt} fill sizes="(max-width: 900px) 90vw, 42vw" className={styles.img} />
          </MaskReveal>
          <Reveal className={styles.stamp} delay={0.4}>
            <span>{date.dotted}</span>
          </Reveal>
        </div>

        <Reveal className={styles.card}>
          <WeddingSymbol className={styles.symbol} size={70} />
          <span className="kicker" id="invitation-title">
            The Invitation
          </span>

          <div className={styles.families}>
            <div>
              <p className={styles.label}>{families.bride.label}</p>
              <p className={styles.parents}>
                <span>{families.bride.father}</span> <span className={styles.amp}>&amp;</span> <span>{families.bride.mother}</span>
              </p>
            </div>
            <span className={styles.and}>and</span>
            <div>
              <p className={styles.label}>{families.groom.label}</p>
              <p className={styles.parents}>
                <span>{families.groom.father}</span> <span className={styles.amp}>&amp;</span> <span>{families.groom.mother}</span>
              </p>
            </div>
          </div>

          <p className={styles.request}>{invitation.request}</p>

          <p className={styles.couple}>
            <span>{couple.bride.toUpperCase()}</span>
            <span className={`script ${styles.coupleAmp}`}>&amp;</span>
            <span>{couple.groom.toUpperCase()}</span>
          </p>

          <Divider className={styles.divider} />

          <p className={styles.date}>
            <time dateTime={date.start}>{date.long}</time>
          </p>
          <p className={styles.venue}>
            {venue.hall} · {venue.hotel}, {venue.city}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
