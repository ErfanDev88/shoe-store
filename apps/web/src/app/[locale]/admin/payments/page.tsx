'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import Pager from '@/components/Pager';
import { Spinner } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { fetcher, qs } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { useFmt } from '@/lib/use-fmt';

interface Pay { _id: string; authority: string; amount: number; status: string; refId?: string; createdAt: string; order: { _id: string; orderNumber: string } | null }

export default function AdminPayments() {
  const t = useTranslations();
  const f = useFmt();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data } = useSWR<Paged<Pay>>(`/admin/payments${qs({ page, limit: 20, status })}`, fetcher);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="sr-only">{t('admin.nav.payments')}</h2>
        <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">{t('common.all')}</option>{['pending', 'success', 'failed', 'needs_refund'].map((s) => (<option key={s} value={s}>{t(`payment.st_${s}`)}</option>))}</select></div>
      {!data ? <Spinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full"><thead className="border-b"><tr><th className="th">{t('orders.number')}</th><th className="th">{t('cart.payable')}</th><th className="th">{t('admin.status')}</th><th className="th">Ref</th><th className="th">{t('orders.date')}</th></tr></thead>
            <tbody className="divide-y">{data.items.map((p) => (
              <tr key={p._id} className={p.status === 'needs_refund' ? 'bg-danger/10' : ''}>
                <td className="td">{p.order ? <Link href={`/admin/orders/${p.order._id}`} className="text-brand" dir="ltr">{p.order.orderNumber}</Link> : '—'}</td>
                <td className="td">{f.price(p.amount)}</td><td className="td">{t(`payment.st_${p.status}`)}</td><td className="td" dir="ltr">{p.refId ?? '—'}</td><td className="td">{f.dateTime(p.createdAt)}</td>
              </tr>))}</tbody></table>
          <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
