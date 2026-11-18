'use client';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddressForm, { AddressInput } from '@/components/AddressForm';
import Stepper from '@/components/Stepper';
import { Spinner } from '@/components/ui';
import { Link, useRouter } from '@/i18n/routing';
import { api } from '@/lib/api';
import type { Address, Order, ShippingQuote } from '@/lib/types';
import { useErrorText, useFmt } from '@/lib/use-fmt';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useAuth } from '@/stores/auth';
import { useCart } from '@/stores/cart';

export default function CheckoutPage() {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const router = useRouter();
  const user = useRequireAuth();
  const view = useCart((s) => s.view);
  const [addressId, setAddressId] = useState('');
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [method, setMethod] = useState<'pishtaz' | 'tipax' | ''>('');
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { useCart.getState().load().catch(() => undefined); }, []);
  useEffect(() => {
    if (user && !addressId && user.addresses.length) setAddressId((user.addresses.find((a) => a.isDefault) ?? user.addresses[0]).id);
  }, [user, addressId]);

  const address = user?.addresses.find((a) => a.id === addressId);
  useEffect(() => {
    if (!address || !view.lines.length) return;
    api<ShippingQuote[]>('/shipping/quote', { method: 'POST', json: { province: address.province } })
      .then((q) => { setQuotes(q); setMethod((m) => (q.some((x) => x.method === m) ? m : (q[0]?.method ?? ''))); })
      .catch(() => setQuotes([]));
  }, [address?.province, view.lines.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return <Spinner />;
  if (!view.lines.length) return (<div className="container-page text-center"><p className="py-12 text-neutral-500">{t('cart.empty')}</p><Link href="/products" className="btn-primary">{t('home.shopNow')}</Link></div>);

  const quote = quotes.find((q) => q.method === method);
  const total = view.subtotal - view.discount + (quote?.cost ?? 0);

  const addAddress = async (a: AddressInput) => {
    const addresses = await api<Address[]>('/users/me/addresses', { method: 'POST', json: a });
    useAuth.getState().setUser({ ...user, addresses });
    setAddressId(addresses[addresses.length - 1].id);
    setAdding(false);
  };

  const placeOrder = async () => {
    if (!addressId || !method) return;
    setBusy(true);
    let order: Order | undefined;
    try {
      order = await api<Order>('/orders', { method: 'POST', json: { addressId, shippingMethod: method } });
      useCart.getState().load().catch(() => undefined);
      const { paymentUrl } = await api<{ paymentUrl: string }>(`/payments/orders/${order._id}/pay`, { method: 'POST' });
      window.location.href = paymentUrl;
    } catch (e) {
      toast.error(err(e));
      if (order) router.push(`/account/orders/${order._id}`); // order exists, payment can be retried from there
      setBusy(false);
    }
  };

  return (
    <div className="container-page">
      <Stepper step={2} />
      <h1 className="mb-6">{t('checkout.title')}</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg">{t('checkout.address')}</h2>
            {user.addresses.map((a) => (
              <label key={a.id} className={`card flex cursor-pointer gap-3 text-sm ${a.id === addressId ? 'border-brand ring-1 ring-brand' : ''}`}>
                <input type="radio" name="addr" checked={a.id === addressId} onChange={() => setAddressId(a.id)} />
                <span><b>{a.title}</b> — {a.receiver} ({a.phone})<br />{a.province}، {a.city}، {a.address} — {a.postalCode}</span>
              </label>
            ))}
            {adding ? <AddressForm onSubmit={addAddress} onCancel={() => setAdding(false)} /> : <button className="btn-outline" onClick={() => setAdding(true)}>{t('address.add')}</button>}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg">{t('checkout.shipping')}</h2>
            {!address && <p className="text-sm text-neutral-500">{t('checkout.pickAddress')}</p>}
            {quotes.map((q) => (
              <label key={q.method} className={`card flex cursor-pointer items-center justify-between text-sm ${q.method === method ? 'border-brand ring-1 ring-brand' : ''}`}>
                <span className="flex items-center gap-3"><input type="radio" name="ship" checked={q.method === method} onChange={() => setMethod(q.method)} />
                  <span><b>{t(`shipping.${q.method}`)}</b><br /><span className="text-neutral-500">{t('checkout.days', { min: f.num(q.minDays), max: f.num(q.maxDays) })}</span></span></span>
                <b>{q.free ? t('checkout.free') : f.price(q.cost)}</b>
              </label>
            ))}
          </section>
        </div>
        <aside className="card h-fit space-y-2 text-sm">
          {view.lines.map((l) => (<div key={l.sku} className="flex justify-between gap-2"><span className="line-clamp-1">{f.text(l.title)} × {f.num(l.quantity)}</span><span>{f.price(l.lineTotal)}</span></div>))}
          <hr />
          <div className="flex justify-between"><span>{t('cart.subtotal')}</span><span>{f.price(view.subtotal)}</span></div>
          {view.discount > 0 && <div className="flex justify-between text-success"><span>{t('cart.discount')}</span><span>− {f.price(view.discount)}</span></div>}
          <div className="flex justify-between"><span>{t('checkout.shippingCost')}</span><span>{quote ? (quote.free ? t('checkout.free') : f.price(quote.cost)) : '—'}</span></div>
          <div className="flex justify-between border-t pt-3 text-base font-bold"><span>{t('cart.payable')}</span><span>{f.price(total)}</span></div>
          <button className="btn-primary w-full py-3" disabled={busy || !addressId || !method} onClick={placeOrder}>{busy ? t('common.loading') : t('checkout.payNow')}</button>
          <p className="text-xs text-neutral-500">{t('checkout.secureNote')}</p>
        </aside>
      </div>
    </div>
  );
}
