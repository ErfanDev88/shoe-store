'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import StatusBadge from '@/components/StatusBadge';
import { Empty, Spinner } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { fetcher } from '@/lib/api';
import type { Order, Paged } from '@/lib/types';
import { useFmt } from '@/lib/use-fmt';

export default function OrdersPage() {
  const t = useTranslations();
  const f = useFmt();
  const [page, setPage] = useState(1);
  const { data } = useSWR<Paged<Order>>(`/orders?page=${page}&limit=10`, fetcher);
  if (!data) return <Spinner />;
  return (
    <div className="space-y-3">
      <h1>{t('nav.orders')}</h1>
      {data.items.length === 0 && <Empty text={t('orders.empty')} />}
      {data.items.map((o) => (
        <Link key={o._id} href={`/account/orders/${o._id}`} className="card flex flex-wrap items-center justify-between gap-3 text-sm hover:shadow-md">
          <div><p className="font-bold" dir="ltr">{o.orderNumber}</p><p className="text-neutral-500">{f.date(o.createdAt)} · {f.num(o.items.reduce((n, i) => n + i.quantity, 0))} {t('orders.items')}</p></div>
          <StatusBadge status={o.status} />
          <b>{f.price(o.total)}</b>
        </Link>
      ))}
      {data.total > data.limit && (
        <div className="flex justify-center gap-2 pt-2">
          <button className="btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.prev')}</button>
          <button className="btn-outline" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>{t('common.next')}</button>
        </div>
      )}
    </div>
  );
}
