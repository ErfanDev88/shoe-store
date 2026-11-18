'use client';
import { m } from 'framer-motion';
import { Eye, Heart } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/routing';
import { useErrorText, useFmt } from '@/lib/use-fmt';
import type { Product } from '@/lib/types';
import { useAuth } from '@/stores/auth';
import { useWishlist } from '@/stores/wishlist';
import Img from './Img';
import { ImagePlaceholder, Stars } from './ui';

const QuickView = dynamic(() => import('./QuickView')); // code-split: loaded only when a quick view is opened

export default function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const router = useRouter();
  const status = useAuth((s) => s.status);
  const liked = useWishlist((s) => s.ids.includes(p._id));
  const [qv, setQv] = useState(false);
  const inStock = p.variants.some((v) => v.stock > 0);
  const colors = useMemo(() => [...new Map(p.variants.map((v) => [v.color.hex.toLowerCase(), v.color])).values()].slice(0, 5), [p.variants]);
  const title = f.text(p.title);
  const href = `/products/${p.slug}`;

  const toggle = async () => {
    if (status !== 'authed') { toast.info(t('auth.loginRequired')); router.push('/login'); return; }
    try { await useWishlist.getState().toggle(p._id); } catch (e) { toast.error(err(e)); }
  };

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block">
          {p.images[0] ? (
            <>
              <Img src={p.images[0]} alt="" priority={priority} sizes="(min-width: 1024px) 280px, (min-width: 768px) 33vw, 50vw" className="object-cover transition duration-700 ease-out group-hover:scale-105" />
              {p.images[1] && <Img src={p.images[1]} alt="" sizes="(min-width: 1024px) 280px, 33vw" className="object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
            </>
          ) : <ImagePlaceholder className="h-full w-full" />}
        </Link>
        <div className="pointer-events-none absolute start-2.5 top-2.5 flex flex-col gap-1.5">
          {p.discountPercent > 0 && <span className="rounded-full bg-danger px-2.5 py-0.5 text-xs font-bold text-white">−{f.num(p.discountPercent)}٪</span>}
          {!inStock && <span className="rounded-full bg-fg px-2.5 py-0.5 text-xs font-medium text-bg">{t('product.outOfStock')}</span>}
        </div>
        <m.button type="button" whileTap={{ scale: 0.85 }} onClick={toggle} aria-pressed={liked} aria-label={t('nav.wishlist')} className="absolute end-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 shadow backdrop-blur">
          <m.span animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}><Heart className={`h-[18px] w-[18px] ${liked ? 'fill-danger text-danger' : ''}`} /></m.span>
        </m.button>
        {inStock && (
          <button type="button" onClick={() => setQv(true)} aria-label={`${t('product.quickView')}: ${title}`}
            className="btn absolute inset-x-2.5 bottom-2.5 translate-y-3 bg-surface/95 py-2 text-fg opacity-0 shadow backdrop-blur transition duration-300 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
            <Eye className="h-4 w-4" />{t('product.quickView')}
          </button>
        )}
      </div>
      <Link href={href} className="block space-y-1.5 pt-3.5">
        <p className="text-xs text-neutral-500">{f.text(p.brand?.name)}</p>
        <h3 className="line-clamp-1 !text-base !font-semibold !tracking-normal">{title}</h3>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2"><span className="font-bold">{f.price(p.finalPrice)}</span>{p.discountPercent > 0 && <span className="text-xs text-neutral-400 line-through">{f.price(p.basePrice)}</span>}</div>
          <div className="flex -space-x-1 rtl:space-x-reverse" aria-hidden="true">{colors.map((c) => (<span key={c.hex} className="h-3.5 w-3.5 rounded-full border-2 border-bg ring-1 ring-neutral-300" style={{ background: c.hex }} />))}</div>
        </div>
        {p.ratingCount > 0 && <div className="flex items-center gap-1 text-xs text-neutral-500"><Stars value={p.ratingAvg} size={12} />({f.num(p.ratingCount)})</div>}
      </Link>
      {qv && <QuickView product={p} onClose={() => setQv(false)} />}
    </article>
  );
}
