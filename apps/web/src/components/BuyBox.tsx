'use client';
import { AnimatePresence, m } from 'framer-motion';
import { Check, Heart, Minus, Plus, Ruler, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/routing';
import { useErrorText, useFmt } from '@/lib/use-fmt';
import type { CartLine, Product } from '@/lib/types';
import { useAuth } from '@/stores/auth';
import { useCart } from '@/stores/cart';
import { useUi } from '@/stores/ui';
import { useWishlist } from '@/stores/wishlist';
import SizeGuide from './SizeGuide';
import { Stars } from './ui';

/** Size / colour / quantity selection wired to real variant stock. Used on the product page and in Quick View. */
export default function BuyBox({ product: p, showHeader = true, onAdded }: { product: Product; showHeader?: boolean; onAdded?: () => void }) {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const router = useRouter();
  const status = useAuth((s) => s.status);
  const liked = useWishlist((s) => s.ids.includes(p._id));
  const colors = useMemo(() => [...new Map(p.variants.map((v) => [v.color.hex.toLowerCase(), v.color])).values()], [p.variants]);
  const sizes = useMemo(() => [...new Set(p.variants.map((v) => v.size))].sort((a, b) => a - b), [p.variants]);
  const [hex, setHex] = useState(() => (colors.find((c) => p.variants.some((v) => v.color.hex === c.hex && v.stock > 0)) ?? colors[0])?.hex);
  const [size, setSize] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [guide, setGuide] = useState(false);

  const variant = p.variants.find((v) => v.color.hex === hex && v.size === size);
  const sizeOk = (s: number) => p.variants.some((v) => v.color.hex === hex && v.size === s && v.stock > 0);
  const soldOut = !p.variants.some((v) => v.stock > 0);

  const add = async () => {
    if (!variant) { toast.warning(t('product.pickSize')); return; }
    setBusy(true);
    try {
      const line: CartLine = {
        productId: p._id, sku: variant.sku, slug: p.slug, title: p.title, image: p.images[0], size: variant.size, color: variant.color,
        unitPrice: p.finalPrice, quantity: qty, stock: variant.stock, available: true, lineTotal: p.finalPrice * qty, weightGram: p.weightGram,
      };
      await useCart.getState().add(line);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
      useUi.getState().openCart();
      onAdded?.();
    } catch (e) { toast.error(err(e)); } finally { setBusy(false); }
  };

  const like = async () => {
    if (status !== 'authed') { toast.info(t('auth.loginRequired')); router.push('/login'); return; }
    try { await useWishlist.getState().toggle(p._id); } catch (e) { toast.error(err(e)); }
  };

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="space-y-2">
          <Link href={`/products?brand=${p.brand?.slug}`} className="eyebrow">{f.text(p.brand?.name)}</Link>
          <h1 className="text-2xl md:text-3xl">{f.text(p.title)}</h1>
          {p.ratingCount > 0 && <div className="flex items-center gap-2 text-sm text-neutral-500"><Stars value={p.ratingAvg} />{f.num(p.ratingAvg)} · {f.num(p.ratingCount)} {t('product.reviews')}</div>}
        </div>
      )}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold">{f.price(p.finalPrice)}</span>
        {p.discountPercent > 0 && <><span className="text-neutral-400 line-through">{f.price(p.basePrice)}</span><span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">{f.num(p.discountPercent)}٪</span></>}
      </div>

      <fieldset>
        <legend className="label">{t('products.color')}: <span className="font-normal text-neutral-500">{f.text(colors.find((c) => c.hex === hex)?.name)}</span></legend>
        <div className="flex gap-2.5">
          {colors.map((c) => (
            <button key={c.hex} type="button" aria-label={f.text(c.name)} aria-pressed={c.hex === hex} onClick={() => { setHex(c.hex); setSize(null); setQty(1); }}
              className={`h-9 w-9 rounded-full border transition ${c.hex === hex ? 'ring-2 ring-fg ring-offset-2 ring-offset-bg' : 'hover:scale-110'}`} style={{ background: c.hex }} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <div className="mb-2 flex items-center justify-between">
          <legend className="label !mb-0">{t('products.size')}</legend>
          <button type="button" onClick={() => setGuide(true)} className="flex items-center gap-1 text-xs text-neutral-500 underline-offset-4 hover:underline"><Ruler className="h-3.5 w-3.5" />{t('product.sizeGuide')}</button>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {sizes.map((s) => (
            <button key={s} type="button" disabled={!sizeOk(s)} aria-pressed={s === size} onClick={() => { setSize(s); setQty(1); }}
              className={`rounded-lg border py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:border-dashed disabled:text-neutral-300 disabled:line-through ${s === size ? 'border-brand bg-brand text-brand-fg' : 'hover:border-fg'}`}>{f.num(s)}</button>
          ))}
        </div>
        {variant && variant.stock > 0 && variant.stock <= 5 && <p className="mt-2 text-sm text-warning" role="status">{t('product.onlyLeft', { n: f.num(variant.stock) })}</p>}
      </fieldset>

      <div className="flex items-stretch gap-3">
        <div className="flex items-center rounded-lg border">
          <button type="button" className="px-3 py-3" aria-label="-" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></button>
          <span className="w-7 text-center text-sm font-medium" aria-live="polite">{f.num(qty)}</span>
          <button type="button" className="px-3 py-3" aria-label="+" onClick={() => setQty(Math.min(variant?.stock ?? 10, 10, qty + 1))}><Plus className="h-4 w-4" /></button>
        </div>
        <button type="button" className="btn-primary flex-1 py-3" disabled={busy || soldOut || status === 'loading'} onClick={add}>
          <AnimatePresence mode="wait" initial={false}>
            <m.span key={added ? 'ok' : 'add'} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.18 }} className="inline-flex items-center gap-2">
              {added ? <><Check className="h-4 w-4" />{t('product.addedBtn')}</> : <><ShoppingBag className="h-4 w-4" />{soldOut ? t('product.outOfStock') : t('product.addToCart')}</>}
            </m.span>
          </AnimatePresence>
        </button>
        <button type="button" className="btn-outline px-3.5" onClick={like} aria-pressed={liked} aria-label={t('nav.wishlist')}>
          <m.span animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}><Heart className={`h-5 w-5 ${liked ? 'fill-danger text-danger' : ''}`} /></m.span>
        </button>
      </div>
      <SizeGuide open={guide} onClose={() => setGuide(false)} />
    </div>
  );
}
