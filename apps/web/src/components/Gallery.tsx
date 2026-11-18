'use client';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import Img from './Img';
import Modal from './Modal';
import { ImagePlaceholder } from './ui';

/** Desktop: hover zoom + lightbox. Mobile: native scroll-snap carousel (smooth, no JS animation cost). */
export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const t = useTranslations();
  const [i, setI] = useState(0);
  const [box, setBox] = useState(false);
  const [dot, setDot] = useState(0);
  const zoomRef = useRef<HTMLDivElement>(null);
  const go = (d: number) => setI((x) => (x + d + images.length) % images.length);

  useEffect(() => {
    if (!box) return;
    const on = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [box]); // eslint-disable-line react-hooks/exhaustive-deps

  if (images.length === 0) return <ImagePlaceholder className="aspect-square w-full rounded-2xl" />;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = zoomRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div>
      {/* mobile carousel */}
      <div className="md:hidden">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl" onScroll={(e) => { const el = e.currentTarget; setDot(Math.round(Math.abs(el.scrollLeft) / el.clientWidth)); }}>
          {images.map((src, k) => (<div key={src} className="relative aspect-square w-full shrink-0 snap-center"><Img src={src} alt={`${alt} ${k + 1}`} sizes="100vw" priority={k === 0} className="object-cover" /></div>))}
        </div>
        {images.length > 1 && <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">{images.map((s, k) => (<span key={s} className={`h-1.5 rounded-full transition-all ${k === dot ? 'w-5 bg-fg' : 'w-1.5 bg-neutral-300'}`} />))}</div>}
      </div>

      {/* desktop: thumbs + zoom */}
      <div className="hidden gap-4 md:flex">
        {images.length > 1 && (
          <div className="flex w-20 shrink-0 flex-col gap-3">
            {images.map((src, k) => (
              <button key={src} type="button" onClick={() => setI(k)} aria-label={`${alt} ${k + 1}`} aria-current={k === i} className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${k === i ? 'border-fg' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                <Img src={src} alt="" sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <div ref={zoomRef} onMouseMove={onMove} onClick={() => setBox(true)} className="group relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-neutral-100" style={{ ['--zx' as string]: '50%', ['--zy' as string]: '50%' }}>
          <div className="absolute inset-0 origin-[var(--zx)_var(--zy)] transition-transform duration-200 ease-out group-hover:scale-[1.9]">
            <Img src={images[i]} alt={alt} sizes="(min-width: 1024px) 560px, 50vw" priority className="object-cover" />
          </div>
          <span className="pointer-events-none absolute bottom-3 end-3 flex items-center gap-1 rounded-full bg-surface/80 px-3 py-1 text-xs backdrop-blur"><ZoomIn className="h-3.5 w-3.5" />{t('product.zoom')}</span>
        </div>
      </div>

      <Modal open={box} onClose={() => setBox(false)} side="full" label={alt}>
        <div className="relative flex h-dvh items-center justify-center p-4">
          <div className="relative h-full w-full max-w-5xl"><Img src={images[i]} alt={alt} sizes="100vw" className="object-contain" /></div>
          {images.length > 1 && (<>
            <button type="button" onClick={() => go(-1)} aria-label={t('common.prev')} className="icon-btn absolute start-3 top-1/2 -translate-y-1/2 bg-surface/80"><ChevronLeft className="h-5 w-5 rtl:rotate-180" /></button>
            <button type="button" onClick={() => go(1)} aria-label={t('common.next')} className="icon-btn absolute end-3 top-1/2 -translate-y-1/2 bg-surface/80"><ChevronRight className="h-5 w-5 rtl:rotate-180" /></button>
          </>)}
        </div>
      </Modal>
    </div>
  );
}
