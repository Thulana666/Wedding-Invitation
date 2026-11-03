import { Divider } from './Ornament';
import { Reveal, StaggerText } from './Reveal';
import styles from './SectionHeading.module.css';

export default function SectionHeading({ kicker, title, children, align = 'center', tone = 'light', id }) {
  return (
    <header className={`${styles.heading} ${styles[align]} ${styles[tone]}`}>
      {kicker && (
        <Reveal y={12}>
          <span className="kicker">{kicker}</span>
        </Reveal>
      )}
      <h2 className={`display ${styles.title}`} id={id}>
        <StaggerText text={title} />
      </h2>
      <Reveal y={10} delay={0.25}>
        <Divider className={styles.divider} />
      </Reveal>
      {children && (
        <Reveal y={16} delay={0.35}>
          <div className={styles.body}>{children}</div>
        </Reveal>
      )}
    </header>
  );
}
