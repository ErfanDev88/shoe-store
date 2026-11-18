'use client';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import StatusBadge from '@/components/StatusBadge';
import { Spinner } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { api, fetcher } from '@/lib/api';
import type { Order } from '@/lib/types';
import { useErrorText, useFmt } from '@/lib/use-fmt';

export default function OrderPage() {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const { id } = useParams<{ id: string }>();
  const { data: o, mutate, error } = useSWR<Order>(`/orders/${id}`, fetcher);
  const [busy, setBusy] = useState(false);
  if (error) return <p className="py-12 text-center text-neutral-500">{t('common.notFound')}</p>;
  if (!o) return <Spinner />;

  const pay = async () => { setBusy(true); try { const r = await api<{ paymentUrl: string }>(`/payments/orders/${o._id}/pay`, { method: 'POST' }); window.location.href = r.paymentUrl; } catch (e) { toast.error(err(e)); setBusy(false); } };
  const cancel = async () => { if (!confirm(t('orders.confirmCancel'))) return; setBusy(true); try { await api(`/orders/${o._id}/cancel`, { method: 'POST' }); await mutate(); } catch (e) { toast.error(err(e)); } finally { setBusy(false); } };
  const a = o.shippingAddress;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 dir="ltr">{o.orderNumber}</h1>
        <div className="flex items-center gap-2"><StatusBadge status={o.status} />
          {o.status === 'pending_payment' && (<><button className="btn-primary" disabled={busy} onClick={pay}>{t('orders.payNow')}</button><button className="btn-outline" disabled={busy} onClick={cancel}>{t('orders.cancel')}</button></>)}
          {['paid', 'processing', 'shipped', 'delivered'].includes(o.status) && <Link href={`/account/orders/${o._id}/invoice`} className="btn-outline">{t('orders.invoice')}</Link>}
        </div>
      </div>
      {o.trackingCode && <p className="card text-sm">{t('orders.tracking')}: <b dir="ltr">{o.trackingCode}</b></p>}
      <div className="card divide-y">
        {o.items.map((i) => (
          <div key={i.sku} className="flex items-center gap-3 py-3 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {i.image && <img src={i.image} alt="" className="h-14 w-14 rounded-lg object-cover" />}
            <div className="flex-1"><p className="font-medium">{f.text(i.title)}</p><p className="text-neutral-500">{f.text(i.colorName)} · {t('products.size')} {f.num(i.size)} · × {f.num(i.quantity)}</p></div>
            <b>{f.price(i.price * i.quantity)}</b>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card text-sm leading-7"><p className="mb-1 font-bold">{t('checkout.address')}</p>{a.receiver} ({a.phone})<br />{a.province}، {a.city}، {a.address}<br />{a.postalCode}<p className="mt-2 text-neutral-500">{t(`shipping.${o.shippingMethod}`)}</p></div>
        <div className="card space-y-1 text-sm">
          <div className="flex justify-between"><span>{t('cart.subtotal')}</span><span>{f.price(o.subtotal)}</span></div>
          {o.discountAmount > 0 && <div className="flex justify-between text-success"><span>{t('cart.discount')}</span><span>− {f.price(o.discountAmount)}</span></div>}
          <div className="flex justify-between"><span>{t('checkout.shippingCost')}</span><span>{o.shippingCost ? f.price(o.shippingCost) : t('checkout.free')}</span></div>
          <div className="flex justify-between border-t pt-2 text-base font-bold"><span>{t('cart.payable')}</span><span>{f.price(o.total)}</span></div>
        </div>
      </div>
      {o.statusHistory && (
        <ol className="card space-y-2 text-sm">{o.statusHistory.map((h, i) => (<li key={i} className="flex justify-between"><span>{t(`status.${h.status}`)}</span><span className="text-neutral-500">{f.dateTime(h.at)}</span></li>))}</ol>
      )}
    </div>
  );
}
