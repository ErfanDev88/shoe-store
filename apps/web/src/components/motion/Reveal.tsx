'use client';
import { m } from 'framer-motion';

/** Fades/slides content in once when it enters the viewport (transform + opacity only). */
export function Reveal({ children, delay = 0, y = 24, className }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <m.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -8% 0px' }} transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </m.div>
  );
}

/** Word-by-word headline reveal. Splits on spaces only, never on letters, so Persian letter joining is never broken. */
export function HeroWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <m.span className="inline-block" initial={{ y: '115%' }} animate={{ y: 0 }} transition={{ duration: 0.7, delay: delay + i * 0.07, ease: [0.2, 0.8, 0.2, 1] }}>{w}</m.span>
          {'\u00A0'}
        </span>
      ))}
    </span>
  );
}
