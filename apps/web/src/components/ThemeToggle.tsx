'use client';
import { AnimatePresence, m } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export default function ThemeToggle() {
  const t = useTranslations();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = resolvedTheme === 'dark';

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = dark ? 'light' : 'dark';
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setTheme(next); return; }
    const r = e.currentTarget.getBoundingClientRect();
    document.documentElement.style.setProperty('--vt-x', `${r.left + r.width / 2}px`);
    document.documentElement.style.setProperty('--vt-y', `${r.top + r.height / 2}px`);
    doc.startViewTransition(() => flushSync(() => setTheme(next))); // circular reveal where supported
  };

  return (
    <button type="button" onClick={toggle} className="icon-btn" aria-label={dark ? t('theme.toLight') : t('theme.toDark')}>
      {mounted && (
        <AnimatePresence mode="wait" initial={false}>
          <m.span key={dark ? 'moon' : 'sun'} initial={{ rotate: -90, scale: 0.4, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: 90, scale: 0.4, opacity: 0 }} transition={{ duration: 0.2 }}>
            {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </m.span>
        </AnimatePresence>
      )}
    </button>
  );
}
