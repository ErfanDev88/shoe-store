'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import Pager from '@/components/Pager';
import { Spinner } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { api, fetcher, qs } from '@/lib/api';
import type { Paged, Product } from '@/lib/types';
import { useErrorText, useFmt } from '@/lib/use-fmt';

export default function AdminProducts() {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const { data, mutate } = useSWR<Paged<Product>>(`/admin/products${qs({ page, limit: 15, q })}`, fetcher);

  const toggle = async (p: Product) => {
    try { await api(`/admin/products/${p._id}`, { method: 'PATCH', json: { isActive: !p.isActive } }); await mutate(); } catch (e) { toast.error(err(e)); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="sr-only">{t('admin.nav.products')}</h2>
        <div className="flex gap-2"><input className="input" placeholder={t('nav.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /><Link href="/admin/products/new" className="btn-primary whitespace-nowrap">{t('admin.newProduct')}</Link></div>
      </div>
      {!data ? <Spinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="border-b"><tr><th className="th" /><th className="th">{t('admin.titleFa')}</th><th className="th">{t('products.price')}</th><th className="th">{t('admin.stock')}</th><th className="th">{t('admin.active')}</th><th className="th" /></tr></thead>
            <tbody className="divide-y">
              {data.items.map((p) => (
                <tr key={p._id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <td className="td w-14">{p.images[0] ? <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-neutral-100" />}</td>
                  <td className="td"><b>{f.text(p.title)}</b><br /><span className="text-xs text-neutral-500">{f.text(p.brand?.name)} · {p.slug}</span></td>
                  <td className="td">{f.price(p.finalPrice)}{p.discountPercent > 0 && <span className="text-xs text-danger"> −{f.num(p.discountPercent)}٪</span>}</td>
                  <td className="td">{f.num(p.variants.reduce((n, v) => n + v.stock, 0))}</td>
                  <td className="td"><button onClick={() => toggle(p)} className={`rounded-full px-2 py-0.5 text-xs ${p.isActive ? 'bg-success/15 text-success' : 'bg-neutral-200 text-neutral-600'}`}>{p.isActive ? t('admin.active') : t('admin.inactive')}</button></td>
                  <td className="td"><Link href={`/admin/products/${p._id}`} className="text-brand">{t('common.edit')}</Link></td>
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
