'use client';
import { m, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import Img from '@/components/Img';
import { HeroWords } from '@/components/motion/Reveal';
import ShoeArt from '@/components/ShoeArt';
import { Link } from '@/i18n/routing';

const HERO_IMAGE = process.env.NEXT_PUBLIC_HERO_IMAGE; // optional real photo, e.g. /hero.webp in /public

export default function Hero() {
  const t = useTranslations();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)'); // parallax only on larger screens
    setWide(mq.matches);
    const on = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const parallax = wide && !reduce;

  return (
    <section ref={ref} className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 end-[-10%] -z-10 h-[34rem] w-[34rem] rounded-full bg-accent/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[-8rem] start-[-10%] -z-10 h-[26rem] w-[26rem] rounded-full bg-brand/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:px-6 md:pb-28 md:pt-20">
        <m.div style={parallax ? { y: textY } : undefined}>
          <m.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="eyebrow">{t('home.eyebrow')}</m.p>
          <h1 className="mt-5 text-[2.6rem] leading-[1.1] sm:text-6xl md:text-7xl"><HeroWords text={t('home.heroTitle')} delay={0.15} /></h1>
          <m.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }} className="mt-6 max-w-md text-base leading-8 text-neutral-600">{t('home.heroText')}</m.p>
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.85 }} className="mt-9 flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary px-7 py-3.5 text-base">{t('home.shopNow')}</Link>
            <Link href="/products?onSale=true" className="btn-outline px-7 py-3.5 text-base">{t('home.onSale')}</Link>
          </m.div>
        </m.div>

        <m.div style={parallax ? { y } : undefined} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }} className="relative mx-auto w-full max-w-xl">
          <div aria-hidden="true" className="absolute inset-[6%] rounded-full bg-gradient-to-br from-accent/30 to-brand/20" />
          {HERO_IMAGE ? (
            <div className="relative aspect-[4/3]"><Img src={HERO_IMAGE} alt={t('site.name')} sizes="(min-width: 768px) 560px, 100vw" priority className="object-contain" /></div>
          ) : (
            <ShoeArt className="float-slow relative w-full drop-shadow-2xl" title={t('site.name')} />
          )}
          <m.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1, duration: 0.6 }} className="absolute bottom-[8%] start-0 hidden rounded-xl border bg-surface/80 px-4 py-3 shadow-lg backdrop-blur sm:block">
            <p className="text-xs text-neutral-500">{t('home.chipLabel')}</p><p className="display text-lg">{t('home.chipText')}</p>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}
