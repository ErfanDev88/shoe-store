'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import Pager from '@/components/Pager';
import { Spinner } from '@/components/ui';
import { fetcher } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { useFmt } from '@/lib/use-fmt';

export default function AdminNewsletter() {
  const t = useTranslations();
  const f = useFmt();
  const [page, setPage] = useState(1);
  const { data } = useSWR<Paged<{ _id: string; email: string; createdAt: string }>>(`/admin/newsletter?page=${page}&limit=30`, fetcher);
  if (!data) return <Spinner />;
  return (
    <div className="card overflow-x-auto p-0">
      <p className="border-b px-4 py-3 text-sm text-neutral-500">{f.num(data.total)} {t('admin.subscribers')}</p>
      <table className="w-full"><thead className="border-b"><tr><th className="th">{t('auth.email')}</th><th className="th">{t('orders.date')}</th></tr></thead>
        <tbody className="divide-y">{data.items.map((s) => (<tr key={s._id}><td className="td" dir="ltr">{s.email}</td><td className="td">{f.dateTime(s.createdAt)}</td></tr>))}</tbody></table>
      <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />
    </div>
  );
}
