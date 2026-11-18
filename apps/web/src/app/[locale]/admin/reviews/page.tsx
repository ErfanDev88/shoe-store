'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import Pager from '@/components/Pager';
import { Empty, Spinner, Stars } from '@/components/ui';
import { api, fetcher, qs } from '@/lib/api';
import type { Localized, Paged } from '@/lib/types';
import { useErrorText, useFmt } from '@/lib/use-fmt';

interface Rev { _id: string; rating: number; comment: string; userName: string; createdAt: string; isApproved: boolean; product: { title: Localized; slug: string } | null }

export default function AdminReviews() {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const [status, setStatus] = useState<'pending' | 'approved'>('pending');
  const [page, setPage] = useState(1);
  const { data, mutate } = useSWR<Paged<Rev>>(`/admin/reviews${qs({ status, page, limit: 15 })}`, fetcher);
  const act = async (fn: () => Promise<unknown>) => { try { await fn(); await mutate(); } catch (e) { toast.error(err(e)); } };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="sr-only">{t('admin.nav.reviews')}</h2>
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 text-sm">{(['pending', 'approved'] as const).map((s) => (<button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`rounded-md px-3 py-1 ${status === s ? 'bg-surface shadow' : ''}`}>{t(`admin.review_${s}`)}</button>))}</div></div>
      {!data ? <Spinner /> : data.items.length === 0 ? <Empty text={t('common.noData')} /> : data.items.map((r) => (
        <div key={r._id} className="card space-y-1 text-sm">
          <div className="flex justify-between"><span><b>{r.userName}</b> · {r.product ? f.text(r.product.title) : '—'}</span><span className="text-neutral-400">{f.date(r.createdAt)}</span></div>
          <Stars value={r.rating} size={14} />{r.comment && <p className="leading-7">{r.comment}</p>}
          <div className="flex gap-3 pt-1">{!r.isApproved && <button className="text-success" onClick={() => act(() => api(`/admin/reviews/${r._id}/approve`, { method: 'PATCH' }))}>{t('admin.approve')}</button>}
            <button className="text-danger" onClick={() => confirm(t('common.confirmDelete')) && act(() => api(`/admin/reviews/${r._id}`, { method: 'DELETE' }))}>{t('common.remove')}</button></div>
        </div>
      ))}
      {data && <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />}
    </div>
  );
}
