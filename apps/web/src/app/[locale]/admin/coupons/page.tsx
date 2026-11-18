'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Field, Spinner } from '@/components/ui';
import { api, fetcher } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { useErrorText, useFmt } from '@/lib/use-fmt';

interface Coupon { _id: string; code: string; type: 'percent' | 'fixed'; value: number; minOrder: number; maxDiscount?: number; usageLimit?: number; usedCount: number; perUserLimit?: number; startsAt?: string; expiresAt?: string; isActive: boolean }
const blank = { code: '', type: 'percent', value: '', minOrder: '', maxDiscount: '', usageLimit: '', perUserLimit: '', startsAt: '', expiresAt: '' };

export default function AdminCoupons() {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const { data, mutate } = useSWR<Paged<Coupon>>('/admin/coupons?limit=100', fetcher);
  const [v, setV] = useState(blank);
  const num = (s: string) => (s ? Number(s) : undefined);
  const iso = (s: string, end = false) => (s ? new Date(`${s}T${end ? '23:59:59' : '00:00:00'}`).toISOString() : undefined);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/admin/coupons', { method: 'POST', json: { code: v.code, type: v.type, value: Number(v.value), minOrder: num(v.minOrder), maxDiscount: num(v.maxDiscount), usageLimit: num(v.usageLimit), perUserLimit: num(v.perUserLimit), startsAt: iso(v.startsAt), expiresAt: iso(v.expiresAt, true) } });
      setV(blank); await mutate();
    } catch (x) { toast.error(err(x)); }
  };
  const act = async (fn: () => Promise<unknown>) => { try { await fn(); await mutate(); } catch (x) { toast.error(err(x)); } };
  const inp = (k: keyof typeof blank, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (<Field label={label}><input className="input" dir="ltr" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} {...extra} /></Field>);

  return (
    <div className="space-y-4">
      <h2 className="sr-only">{t('admin.nav.coupons')}</h2>
      <form onSubmit={create} className="card grid gap-3 sm:grid-cols-4">
        {inp('code', t('admin.couponCode'), { required: true, maxLength: 30, onChange: (e) => setV({ ...v, code: e.target.value.toUpperCase() }) })}
        <Field label={t('admin.couponType')}><select className="input" value={v.type} onChange={(e) => setV({ ...v, type: e.target.value })}><option value="percent">{t('admin.percent')}</option><option value="fixed">{t('admin.fixed')}</option></select></Field>
        {inp('value', v.type === 'percent' ? '%' : t('common.toman'), { required: true, type: 'number', min: 1, max: v.type === 'percent' ? 100 : undefined })}
        {inp('minOrder', t('admin.minOrder'), { type: 'number', min: 0 })}
        {inp('maxDiscount', t('admin.maxDiscount'), { type: 'number', min: 1 })}
        {inp('usageLimit', t('admin.usageLimit'), { type: 'number', min: 1 })}
        {inp('perUserLimit', t('admin.perUserLimit'), { type: 'number', min: 1 })}
        <div className="grid grid-cols-2 gap-2">{inp('startsAt', t('admin.startsAt'), { type: 'date' })}{inp('expiresAt', t('admin.expiresAt'), { type: 'date' })}</div>
        <div className="sm:col-span-4"><button className="btn-primary">{t('common.add')}</button></div>
      </form>
      {!data ? <Spinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full"><thead className="border-b"><tr><th className="th">{t('admin.couponCode')}</th><th className="th">{t('admin.discount')}</th><th className="th">{t('admin.used')}</th><th className="th">{t('admin.expiresAt')}</th><th className="th" /></tr></thead>
            <tbody className="divide-y">{data.items.map((c) => (
              <tr key={c._id}>
                <td className="td font-mono font-bold">{c.code}</td>
                <td className="td">{c.type === 'percent' ? `${f.num(c.value)}٪` : f.price(c.value)}{c.minOrder > 0 && <span className="text-xs text-neutral-500"> · ≥ {f.price(c.minOrder)}</span>}</td>
                <td className="td">{f.num(c.usedCount)}{c.usageLimit ? ` / ${f.num(c.usageLimit)}` : ''}</td>
                <td className="td">{c.expiresAt ? f.date(c.expiresAt) : '—'}</td>
                <td className="td flex gap-3"><button className={c.isActive ? 'text-success' : 'text-neutral-400'} onClick={() => act(() => api(`/admin/coupons/${c._id}`, { method: 'PATCH', json: { isActive: !c.isActive } }))}>{c.isActive ? t('admin.active') : t('admin.inactive')}</button>
                  <button className="text-danger" onClick={() => confirm(t('common.confirmDelete')) && act(() => api(`/admin/coupons/${c._id}`, { method: 'DELETE' }))}>{t('common.remove')}</button></td>
              </tr>))}</tbody></table>
        </div>
      )}
    </div>
  );
}
