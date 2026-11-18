'use client';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { ThemeProvider } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem themes={['light', 'dark']} storageKey="sole-theme" disableTransitionOnChange>
      {/* reducedMotion="user": transform animations are skipped when the OS asks for reduced motion */}
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation}>{children}</LazyMotion>
      </MotionConfig>
    </ThemeProvider>
  );
}
