'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { wedding } from '@/config/wedding';
import SectionHeading from '@/components/ui/SectionHeading';
import { MaskReveal, Reveal } from '@/components/ui/Reveal';
import styles from './LoveStory.module.css';

function Person({ who, image, name, parents, relation, delay }) {
  return (
    <article className={styles.person}>
      <MaskReveal className={styles.arch} delay={delay}>
        <Image src={image.src} alt={image.alt} fill sizes="(max-width: 760px) 80vw, 34vw" className={styles.img} />
      </MaskReveal>
      <Reveal delay={delay + 0.2} className={styles.personText}>
        <span className="kicker">{who.role}</span>
        <h3 className={`script ${styles.personName}`}>{name}</h3>
        <p className={styles.parents}>
          {relation} {parents.father} &amp; {parents.mother}
        </p>
        <p className={styles.bio}>{who.bio}</p>
      </Reveal>
    </article>
  );
}

export default function LoveStory() {
  const { story, couple, images, families } = wedding;
  const togetherRef = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: togetherRef, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['-12%', '12%']);

  return (
    <section id="story" className={`section ${styles.section}`} aria-labelledby="story-title">
      <div className="container">
        <SectionHeading kicker="Two hearts, one story" title="Our Love Story" id="story-title">
          {story.intro}
        </SectionHeading>

        <div className={styles.couple}>
          <Person who={story.bride} image={images.bride} name={couple.bride} parents={families.bride} relation="Daughter of" delay={0} />
          <div className={styles.ampWrap} aria-hidden="true">
            <span className={`script ${styles.amp}`}>&amp;</span>
          </div>
          <Person who={story.groom} image={images.groom} name={couple.groom} parents={families.groom} relation="Son of" delay={0.15} />
        </div>
      </div>

      <div ref={togetherRef} className={styles.together}>
        <motion.div className={styles.togetherMedia} style={{ y }}>
          <Image src={images.together.src} alt={images.together.alt} fill sizes="100vw" className={styles.img} />
        </motion.div>
        <div className={styles.togetherShade} />
        <Reveal className={`container ${styles.togetherText}`}>
          <span className="kicker">{story.together.title}</span>
          <p className={styles.quote}>{story.together.text}</p>
        </Reveal>
      </div>

      <div className="container">
        <ol className={styles.timeline}>
          {story.timeline.map((item, i) => (
            <Reveal as="li" key={item.label} className={`${styles.moment} ${item.final ? styles.final : ''}`} delay={i * 0.05}>
              <span className={styles.node} aria-hidden="true" />
              <p className={styles.momentDate}>{item.date}</p>
              <h3 className={styles.momentTitle}>{item.label}</h3>
              <p className={styles.momentText}>{item.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
