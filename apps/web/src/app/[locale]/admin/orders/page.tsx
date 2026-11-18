'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import Pager from '@/components/Pager';
import StatusBadge from '@/components/StatusBadge';
import { Spinner } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { fetcher, qs } from '@/lib/api';
import type { Order, Paged } from '@/lib/types';
import { useFmt } from '@/lib/use-fmt';

const STATUSES = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

export default function AdminOrders() {
  const t = useTranslations();
  const f = useFmt();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const { data } = useSWR<Paged<Order>>(`/admin/orders${qs({ page, limit: 20, status, q })}`, fetcher);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="sr-only">{t('admin.nav.orders')}</h2>
        <div className="flex gap-2">
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">{t('common.all')}</option>{STATUSES.map((s) => (<option key={s} value={s}>{t(`status.${s}`)}</option>))}</select>
          <input className="input" placeholder={t('admin.orderSearch')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
      </div>
      {!data ? <Spinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="border-b"><tr><th className="th">{t('orders.number')}</th><th className="th">{t('admin.customer')}</th><th className="th">{t('orders.date')}</th><th className="th">{t('cart.payable')}</th><th className="th">{t('admin.status')}</th></tr></thead>
            <tbody className="divide-y">
              {data.items.map((o) => (
                <tr key={o._id} className="hover:bg-neutral-50">
                  <td className="td"><Link href={`/admin/orders/${o._id}`} className="font-bold text-brand" dir="ltr">{o.orderNumber}</Link></td>
                  <td className="td">{o.shippingAddress.receiver}<br /><span className="text-xs text-neutral-500" dir="ltr">{o.shippingAddress.phone}</span></td>
                  <td className="td">{f.dateTime(o.createdAt)}</td><td className="td">{f.price(o.total)}</td><td className="td"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
