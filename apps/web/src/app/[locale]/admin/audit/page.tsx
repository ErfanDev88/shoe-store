'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import Pager from '@/components/Pager';
import { Spinner } from '@/components/ui';
import { fetcher } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { useFmt } from '@/lib/use-fmt';

interface Log { _id: string; actor: string; role: string; method: string; path: string; status: number; ip?: string; createdAt: string }

export default function AdminAudit() {
  const t = useTranslations();
  const f = useFmt();
  const [page, setPage] = useState(1);
  const { data } = useSWR<Paged<Log>>(`/admin/audit-logs?page=${page}&limit=30`, fetcher);
  return (
    <div className="space-y-4">
      <h2 className="sr-only">{t('admin.nav.audit')}</h2>
      {!data ? <Spinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-xs"><thead className="border-b"><tr><th className="th">{t('orders.date')}</th><th className="th">{t('admin.role')}</th><th className="th">Request</th><th className="th">Status</th><th className="th">IP</th></tr></thead>
            <tbody className="divide-y">{data.items.map((l) => (
              <tr key={l._id}><td className="td">{f.dateTime(l.createdAt)}</td><td className="td">{l.role}</td><td className="td font-mono" dir="ltr">{l.method} {l.path}</td><td className={`td ${l.status >= 400 ? 'text-danger' : ''}`}>{l.status}</td><td className="td" dir="ltr">{l.ip}</td></tr>))}</tbody></table>
          <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
