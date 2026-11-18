'use client';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Spinner } from '@/components/ui';
import { fetcher } from '@/lib/api';
import type { Order } from '@/lib/types';
import { useFmt } from '@/lib/use-fmt';

/** Printable invoice: use the browser's Print -> "Save as PDF". */
export default function InvoicePage() {
  const t = useTranslations();
  const f = useFmt();
  const { id } = useParams<{ id: string }>();
  const { data: o } = useSWR<Order>(`/orders/${id}`, fetcher);
  if (!o) return <Spinner />;
  const a = o.shippingAddress;
  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-xl border bg-surface p-8 print:border-0 print:p-0">
      <div className="no-print flex justify-end"><button className="btn-primary" onClick={() => window.print()}>{t('orders.print')}</button></div>
      <div className="flex items-start justify-between border-b pb-4">
        <div><h1>{t('site.name')}</h1><p className="text-sm text-neutral-500">{t('orders.invoice')}</p></div>
        <div className="text-sm"><p>{t('orders.number')}: <b dir="ltr">{o.orderNumber}</b></p><p>{t('orders.date')}: {f.date(o.createdAt)}</p></div>
      </div>
      <div className="text-sm leading-7"><b>{t('orders.buyer')}</b><br />{a.receiver} — {a.phone}<br />{a.province}، {a.city}، {a.address} — {a.postalCode}</div>
      <table className="w-full text-sm">
        <thead className="border-b text-neutral-500"><tr><th className="th">{t('orders.product')}</th><th className="th">{t('orders.qty')}</th><th className="th">{t('orders.unitPrice')}</th><th className="th">{t('orders.lineTotal')}</th></tr></thead>
        <tbody>{o.items.map((i) => (<tr key={i.sku} className="border-b"><td className="td">{f.text(i.title)} — {f.text(i.colorName)} / {f.num(i.size)}</td><td className="td">{f.num(i.quantity)}</td><td className="td">{f.price(i.price)}</td><td className="td">{f.price(i.price * i.quantity)}</td></tr>))}</tbody>
      </table>
      <div className="ms-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between"><span>{t('cart.subtotal')}</span><span>{f.price(o.subtotal)}</span></div>
        {o.discountAmount > 0 && <div className="flex justify-between"><span>{t('cart.discount')}</span><span>− {f.price(o.discountAmount)}</span></div>}
        <div className="flex justify-between"><span>{t('checkout.shippingCost')}</span><span>{f.price(o.shippingCost)}</span></div>
        <div className="flex justify-between border-t pt-2 text-base font-bold"><span>{t('cart.payable')}</span><span>{f.price(o.total)}</span></div>
      </div>
    </div>
  );
}
