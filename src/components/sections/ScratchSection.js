import { wedding } from '@/config/wedding';
import ScratchCard from '@/components/scratch/ScratchCard';
import { Reveal } from '@/components/ui/Reveal';
import styles from './ScratchSection.module.css';

export default function ScratchSection() {
  const { scratch, date } = wedding;
  return (
    <section className={`section ${styles.section}`} aria-labelledby="surprise-title">
      <div className="container">
        <Reveal className={styles.head}>
          <span className="kicker">A little surprise</span>
          <h2 id="surprise-title" className={`display ${styles.title}`}>
            For your eyes <em>only</em>
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <ScratchCard teaser={scratch.teaser}>
            <div className={styles.message}>
              <span className="kicker">Save the date</span>
              <p className={`display ${styles.reveal}`}>{scratch.reveal}</p>
              <p className={styles.date}>{date.dotted}</p>
              <p className={styles.place}>{date.weekday} · {wedding.venue.short}</p>
            </div>
          </ScratchCard>
        </Reveal>
      </div>
    </section>
  );
}
