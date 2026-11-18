'use client';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import Stepper from '@/components/Stepper';
import { Empty, ImagePlaceholder } from '@/components/ui';
import { Link, useRouter } from '@/i18n/routing';
import { useErrorText, useFmt } from '@/lib/use-fmt';
import { useAuth } from '@/stores/auth';
import { useCart } from '@/stores/cart';

export default function CartPage() {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const router = useRouter();
  const status = useAuth((s) => s.status);
  const { view, setQty, remove, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const run = async (fn: () => Promise<unknown>) => { try { await fn(); } catch (e) { toast.error(err(e)); } };

  if (view.lines.length === 0) return (<div className="container-page"><Stepper step={1} /><h1>{t('cart.title')}</h1><Empty text={t('cart.empty')} /><div className="text-center"><Link href="/products" className="btn-primary">{t('home.shopNow')}</Link></div></div>);
  const blocked = view.lines.some((l) => !l.available);

  return (
    <div className="container-page">
      <Stepper step={1} />
      <h1 className="mb-6">{t('cart.title')}</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {view.lines.map((l) => (
            <div key={l.sku} className="card flex gap-3">
              <Link href={`/products/${l.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : <ImagePlaceholder className="h-full w-full" />}
              </Link>
              <div className="flex-1 space-y-1 text-sm">
                <Link href={`/products/${l.slug}`} className="font-semibold">{f.text(l.title)}</Link>
                <p className="flex items-center gap-2 text-neutral-500"><span className="h-3 w-3 rounded-full border" style={{ background: l.color.hex }} />{f.text(l.color.name)} · {t('products.size')} {f.num(l.size)}</p>
                {!l.available && <p className="text-danger">{l.stock === 0 ? t('product.outOfStock') : t('cart.onlyLeft', { n: f.num(l.stock) })}</p>}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center rounded-lg border">
                    <button className="p-1.5" aria-label="-" disabled={l.quantity <= 1} onClick={() => run(() => setQty(l.sku, l.quantity - 1))}><Minus className="h-4 w-4" /></button>
                    <span className="w-7 text-center">{f.num(l.quantity)}</span>
                    <button className="p-1.5" aria-label="+" disabled={l.quantity >= Math.min(10, l.stock)} onClick={() => run(() => setQty(l.sku, l.quantity + 1))}><Plus className="h-4 w-4" /></button>
                  </div>
                  <span className="font-bold">{f.price(l.lineTotal)}</span>
                  <button aria-label={t('common.remove')} onClick={() => run(() => remove(l.sku))}><Trash2 className="h-4 w-4 text-neutral-400 hover:text-danger" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="card h-fit space-y-3 text-sm">
          {status === 'authed' && (
            <div>
              <p className="label">{t('cart.coupon')}</p>
              {view.couponCode ? (
                <div className="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2"><span className="font-mono">{view.couponCode}</span><button className="text-danger" onClick={() => run(removeCoupon)}>{t('common.remove')}</button></div>
              ) : (
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) run(async () => { await applyCoupon(code.trim().toUpperCase()); setCode(''); }); }}>
                  <input className="input" value={code} onChange={(e) => setCode(e.target.value)} maxLength={30} dir="ltr" />
                  <button className="btn-outline">{t('cart.apply')}</button>
                </form>
              )}
              {view.couponError && <p className="mt-1 text-danger">{t(`errors.${view.couponError}`)}</p>}
            </div>
          )}
          <div className="flex justify-between"><span>{t('cart.subtotal')}</span><span>{f.price(view.subtotal)}</span></div>
          {view.discount > 0 && <div className="flex justify-between text-success"><span>{t('cart.discount')}</span><span>− {f.price(view.discount)}</span></div>}
          <div className="flex justify-between border-t pt-3 text-base font-bold"><span>{t('cart.payable')}</span><span>{f.price(view.subtotal - view.discount)}</span></div>
          <p className="text-xs text-neutral-500">{t('cart.shippingNote')}</p>
          <button className="btn-primary w-full py-3" disabled={blocked || status === 'loading'} onClick={() => router.push(status === 'authed' ? '/checkout' : '/login?next=/checkout')}>{t('cart.checkout')}</button>
          {blocked && <p className="text-xs text-danger">{t('cart.fixItems')}</p>}
        </aside>
      </div>
    </div>
  );
}
