'use client';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import StatusBadge from '@/components/StatusBadge';
import { Field, Spinner } from '@/components/ui';
import { api, fetcher } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types';
import { useErrorText, useFmt } from '@/lib/use-fmt';
import { useAuth } from '@/stores/auth';

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'], paid: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'], delivered: ['returned'], cancelled: [], returned: [],
};

export default function AdminOrder() {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const role = useAuth((s) => s.user?.role);
  const { id } = useParams<{ id: string }>();
  const { data: o, mutate } = useSWR<Order>(`/admin/orders/${id}`, fetcher);
  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (!o) return <Spinner />;

  const run = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); await mutate(); setStatus(''); setNote(''); toast.success(t('common.saved')); } catch (e) { toast.error(err(e)); } finally { setBusy(false); } };
  const update = (e: React.FormEvent) => { e.preventDefault(); run(() => api(`/admin/orders/${o._id}/status`, { method: 'PATCH', json: { status, trackingCode: status === 'shipped' ? tracking : undefined, note: note || undefined } })); };
  const a = o.shippingAddress;
  const u = typeof o.user === 'object' ? o.user : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3"><h2 dir="ltr" className="text-2xl">{o.orderNumber}</h2><StatusBadge status={o.status} /><span className="rounded bg-neutral-100 px-2 py-0.5 text-xs">{t(`payment.${o.paymentStatus}`)}</span></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-1 text-sm leading-7">
          <p className="font-bold">{t('admin.customer')}</p>
          {u && <p>{[u.firstName, u.lastName].filter(Boolean).join(' ')} <span dir="ltr">{u.phone ?? u.email}</span></p>}
          <p>{a.receiver} ({a.phone})</p><p>{a.province}، {a.city}، {a.address}</p><p>{a.postalCode} · {t(`shipping.${o.shippingMethod}`)}</p>
          <p className="text-neutral-500">{f.dateTime(o.createdAt)}{o.paidAt && ` · ${t('status.paid')}: ${f.dateTime(o.paidAt)}`}</p>
          {o.trackingCode && <p>{t('orders.tracking')}: <b dir="ltr">{o.trackingCode}</b></p>}
        </div>
        <div className="card space-y-1 text-sm">
          <div className="flex justify-between"><span>{t('cart.subtotal')}</span><span>{f.price(o.subtotal)}</span></div>
          {o.discountAmount > 0 && <div className="flex justify-between text-success"><span>{t('cart.discount')} {o.couponCode && `(${o.couponCode})`}</span><span>− {f.price(o.discountAmount)}</span></div>}
          <div className="flex justify-between"><span>{t('checkout.shippingCost')}</span><span>{f.price(o.shippingCost)}</span></div>
          <div className="flex justify-between border-t pt-2 text-base font-bold"><span>{t('cart.payable')}</span><span>{f.price(o.total)}</span></div>
        </div>
      </div>
      <div className="card divide-y">
        {o.items.map((i) => (<div key={i.sku} className="flex justify-between py-2 text-sm"><span>{f.text(i.title)} — {f.text(i.colorName)} / {f.num(i.size)} × {f.num(i.quantity)} <span className="text-xs text-neutral-400" dir="ltr">{i.sku}</span></span><b>{f.price(i.price * i.quantity)}</b></div>))}
      </div>
      {NEXT[o.status].length > 0 && (
        <form onSubmit={update} className="card grid gap-3 sm:grid-cols-4">
          <Field label={t('admin.changeStatus')}><select className="input" required value={status} onChange={(e) => setStatus(e.target.value)}><option value="" />{NEXT[o.status].map((s) => (<option key={s} value={s}>{t(`status.${s}`)}</option>))}</select></Field>
          {status === 'shipped' && <Field label={t('orders.tracking')}><input className="input" dir="ltr" required pattern="[A-Za-z0-9\-]{3,40}" value={tracking} onChange={(e) => setTracking(e.target.value)} /></Field>}
          <Field label={t('admin.note')}><input className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <div className="flex items-end"><button className="btn-primary" disabled={busy || !status}>{t('common.save')}</button></div>
        </form>
      )}
      {role === 'admin' && ['cancelled', 'returned'].includes(o.status) && o.paymentStatus === 'paid' && (
        <div className="card flex items-center justify-between gap-3 text-sm"><p>{t('admin.refundHint')}</p><button className="btn-outline" disabled={busy} onClick={() => run(() => api(`/admin/orders/${o._id}/refunded`, { method: 'PATCH' }))}>{t('admin.markRefunded')}</button></div>
      )}
      {o.statusHistory && <ol className="card space-y-1 text-sm">{o.statusHistory.map((h, i) => (<li key={i} className="flex justify-between"><span>{t(`status.${h.status}`)}{h.note && <span className="text-neutral-500"> — {h.note}</span>}</span><span className="text-neutral-500">{f.dateTime(h.at)}</span></li>))}</ol>}
    </div>
  );
}
