'use client';
import { useTranslations } from 'next-intl';

export default function Pager({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const t = useTranslations();
  if (total <= limit) return null;
  return (
    <div className="flex items-center justify-center gap-3 py-3 text-sm">
      <button className="btn-outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>{t('common.prev')}</button>
      <span>{page} / {Math.ceil(total / limit)}</span>
      <button className="btn-outline" disabled={page * limit >= total} onClick={() => onPage(page + 1)}>{t('common.next')}</button>
    </div>
  );
}
