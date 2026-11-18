'use client';
import { m } from 'framer-motion';

/** Re-mounts on every navigation: a soft fade/slide-in between pages (opacity + transform only, no layout shift). */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </m.div>
  );
}
