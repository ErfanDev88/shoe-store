'use client';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { useErrorText, useFmt } from '@/lib/use-fmt';
import { useCart } from '@/stores/cart';
import { useUi } from '@/stores/ui';
import Modal from './Modal';
import { ImagePlaceholder } from './ui';

/** Mini cart that slides in after "add to cart". */
export default function CartDrawer() {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const { cartOpen, closeCart } = useUi();
  const { view, setQty, remove } = useCart();
  const run = async (fn: () => Promise<unknown>) => { try { await fn(); } catch (e) { toast.error(err(e)); } };

  return (
    <Modal open={cartOpen} onClose={closeCart} side="end" label={t('cart.title')}>
      <div className="flex h-dvh flex-col">
        <div className="border-b px-6 py-5"><h2 className="text-lg">{t('cart.title')} <span className="text-sm font-normal text-neutral-500">({f.num(view.itemCount)})</span></h2></div>
        <div className="flex-1 overflow-auto px-6">
          {view.lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-neutral-500"><ShoppingBag className="h-10 w-10" /><p>{t('cart.empty')}</p>
              <Link href="/products" onClick={closeCart} className="btn-primary">{t('home.shopNow')}</Link></div>
          ) : view.lines.map((l) => (
            <div key={l.sku} className="flex gap-3 border-b py-4 last:border-0">
              <Link href={`/products/${l.slug}`} onClick={closeCart} className="h-24 w-20 shrink-0 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : <ImagePlaceholder className="h-full w-full !p-1" />}
              </Link>
              <div className="flex flex-1 flex-col justify-between text-sm">
                <div><p className="font-semibold leading-snug">{f.text(l.title)}</p>
                  <p className="mt-1 flex items-center gap-2 text-neutral-500"><span className="h-3 w-3 rounded-full border" style={{ background: l.color.hex }} />{f.text(l.color.name)} · {f.num(l.size)}</p>
                  {!l.available && <p className="mt-1 text-danger">{l.stock === 0 ? t('product.outOfStock') : t('cart.onlyLeft', { n: f.num(l.stock) })}</p>}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border">
                    <button className="p-1.5" aria-label="-" disabled={l.quantity <= 1} onClick={() => run(() => setQty(l.sku, l.quantity - 1))}><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-6 text-center text-xs">{f.num(l.quantity)}</span>
                    <button className="p-1.5" aria-label="+" disabled={l.quantity >= Math.min(10, l.stock)} onClick={() => run(() => setQty(l.sku, l.quantity + 1))}><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <b>{f.price(l.lineTotal)}</b>
                  <button aria-label={t('common.remove')} onClick={() => run(() => remove(l.sku))}><Trash2 className="h-4 w-4 text-neutral-400 hover:text-danger" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {view.lines.length > 0 && (
          <div className="space-y-3 border-t px-6 py-5">
            <div className="flex justify-between font-semibold"><span>{t('cart.subtotal')}</span><span>{f.price(view.subtotal)}</span></div>
            <p className="text-xs text-neutral-500">{t('cart.shippingNote')}</p>
            <Link href="/checkout" onClick={closeCart} className="btn-primary w-full py-3">{t('cart.checkout')}</Link>
            <Link href="/cart" onClick={closeCart} className="btn-outline w-full">{t('cart.viewCart')}</Link>
          </div>
        )}
      </div>
    </Modal>
  );
}
