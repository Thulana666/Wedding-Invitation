import Envelope from '@/components/envelope/Envelope';
import SectionHeading from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import styles from './LetterSection.module.css';

export default function LetterSection() {
  return (
    <section className={`section ${styles.section}`} aria-labelledby="letter-title">
      <div className="container">
        <SectionHeading kicker="With love" title="A Letter for You" id="letter-title" />
        <Reveal>
          <Envelope />
        </Reveal>
      </div>
    </section>
  );
}
