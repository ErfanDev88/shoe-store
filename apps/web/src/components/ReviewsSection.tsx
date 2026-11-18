'use client';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { api, fetcher } from '@/lib/api';
import type { Paged, Review } from '@/lib/types';
import { useErrorText, useFmt } from '@/lib/use-fmt';
import { useAuth } from '@/stores/auth';
import { Empty, Stars } from './ui';

export default function ReviewsSection({ productId }: { productId: string }) {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const status = useAuth((s) => s.status);
  const { data } = useSWR<Paged<Review>>(`/products/${productId}/reviews?limit=20`, fetcher);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/products/${productId}/reviews`, { method: 'POST', json: { rating, comment } });
      toast.success(t('product.reviewPending'));
      setComment('');
    } catch (x) { toast.error(err(x)); } finally { setBusy(false); }
  };

  return (
    <section className="mt-12 space-y-6">
      <h2>{t('product.reviews')}</h2>
      {data && data.items.length === 0 && <Empty text={t('product.noReviews')} />}
      <div className="space-y-3">
        {data?.items.map((r) => (
          <div key={r._id} className="card">
            <div className="flex items-center justify-between text-sm"><span className="font-medium">{r.userName}</span><span className="text-neutral-400">{f.date(r.createdAt)}</span></div>
            <Stars value={r.rating} size={14} />
            {r.comment && <p className="mt-2 text-sm leading-7 text-neutral-700">{r.comment}</p>}
          </div>
        ))}
      </div>
      {status === 'authed' && (
        <form onSubmit={submit} className="card space-y-3">
          <p className="font-medium">{t('product.writeReview')}</p>
          <div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => (<button type="button" key={i} onClick={() => setRating(i)} aria-label={String(i)}><Star className={`h-6 w-6 ${i <= rating ? 'fill-accent text-accent' : 'text-neutral-300'}`} /></button>))}</div>
          <textarea className="input" rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('product.commentPlaceholder')} />
          <p className="text-xs text-neutral-500">{t('product.reviewHint')}</p>
          <button className="btn-primary" disabled={busy}>{t('product.submitReview')}</button>
        </form>
      )}
    </section>
  );
}
