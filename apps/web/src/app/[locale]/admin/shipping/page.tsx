'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Field, Spinner } from '@/components/ui';
import { api, fetcher } from '@/lib/api';
import { PROVINCES } from '@/lib/format';
import { useErrorText } from '@/lib/use-fmt';

interface Rule { _id: string; province: string; method: 'pishtaz' | 'tipax'; baseCost: number; perKgCost: number; freeShippingThreshold?: number; minDays: number; maxDays: number; isActive: boolean }

function Row({ rule, onDone }: { rule: Rule; onDone: () => void }) {
  const t = useTranslations();
  const err = useErrorText();
  const [v, setV] = useState({ baseCost: String(rule.baseCost), perKgCost: String(rule.perKgCost), free: String(rule.freeShippingThreshold ?? ''), minDays: String(rule.minDays), maxDays: String(rule.maxDays), isActive: rule.isActive });
  const save = async () => {
    try { await api(`/admin/shipping-rules/${rule._id}`, { method: 'PATCH', json: { baseCost: Number(v.baseCost), perKgCost: Number(v.perKgCost), freeShippingThreshold: v.free ? Number(v.free) : undefined, minDays: Number(v.minDays), maxDays: Number(v.maxDays), isActive: v.isActive } }); toast.success(t('common.saved')); onDone(); } catch (e) { toast.error(err(e)); }
  };
  const remove = async () => { if (!confirm(t('common.confirmDelete'))) return; try { await api(`/admin/shipping-rules/${rule._id}`, { method: 'DELETE' }); onDone(); } catch (e) { toast.error(err(e)); } };
  const n = (k: 'baseCost' | 'perKgCost' | 'free' | 'minDays' | 'maxDays', w = 'w-24') => (<input className={`input ${w}`} type="number" min={0} dir="ltr" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />);
  return (
    <tr>
      <td className="td font-medium">{rule.province === '*' ? t('admin.allProvinces') : rule.province}</td><td className="td">{t(`shipping.${rule.method}`)}</td>
      <td className="td">{n('baseCost')}</td><td className="td">{n('perKgCost')}</td><td className="td">{n('free', 'w-28')}</td><td className="td">{n('minDays', 'w-16')}–{n('maxDays', 'w-16')}</td>
      <td className="td"><input type="checkbox" checked={v.isActive} onChange={(e) => setV({ ...v, isActive: e.target.checked })} /></td>
      <td className="td whitespace-nowrap"><button className="text-brand" onClick={save}>{t('common.save')}</button> <button className="ms-2 text-danger" onClick={remove}>{t('common.remove')}</button></td>
    </tr>
  );
}

export default function AdminShipping() {
  const t = useTranslations();
  const err = useErrorText();
  const { data, mutate } = useSWR<Rule[]>('/admin/shipping-rules', fetcher);
  const [v, setV] = useState({ province: '*', method: 'pishtaz', baseCost: '', perKgCost: '', free: '' });
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api('/admin/shipping-rules', { method: 'POST', json: { province: v.province, method: v.method, baseCost: Number(v.baseCost), perKgCost: Number(v.perKgCost), freeShippingThreshold: v.free ? Number(v.free) : undefined } }); setV({ ...v, baseCost: '', perKgCost: '', free: '' }); await mutate(); } catch (x) { toast.error(err(x)); }
  };
  return (
    <div className="space-y-4">
      <h2 className="sr-only">{t('admin.nav.shipping')}</h2>
      <p className="text-sm text-neutral-600">{t('admin.shippingHint')}</p>
      <form onSubmit={add} className="card grid gap-3 sm:grid-cols-6">
        <Field label={t('address.province')}><select className="input" value={v.province} onChange={(e) => setV({ ...v, province: e.target.value })}><option value="*">{t('admin.allProvinces')}</option>{PROVINCES.map((p) => (<option key={p}>{p}</option>))}</select></Field>
        <Field label={t('checkout.shipping')}><select className="input" value={v.method} onChange={(e) => setV({ ...v, method: e.target.value })}><option value="pishtaz">{t('shipping.pishtaz')}</option><option value="tipax">{t('shipping.tipax')}</option></select></Field>
        <Field label={t('admin.baseCost')}><input className="input" type="number" min={0} required dir="ltr" value={v.baseCost} onChange={(e) => setV({ ...v, baseCost: e.target.value })} /></Field>
        <Field label={t('admin.perKg')}><input className="input" type="number" min={0} required dir="ltr" value={v.perKgCost} onChange={(e) => setV({ ...v, perKgCost: e.target.value })} /></Field>
        <Field label={t('admin.freeOver')}><input className="input" type="number" min={0} dir="ltr" value={v.free} onChange={(e) => setV({ ...v, free: e.target.value })} /></Field>
        <div className="flex items-end"><button className="btn-primary">{t('common.add')}</button></div>
      </form>
      {!data ? <Spinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full"><thead className="border-b"><tr><th className="th">{t('address.province')}</th><th className="th">{t('checkout.shipping')}</th><th className="th">{t('admin.baseCost')}</th><th className="th">{t('admin.perKg')}</th><th className="th">{t('admin.freeOver')}</th><th className="th">{t('admin.days')}</th><th className="th">{t('admin.active')}</th><th className="th" /></tr></thead>
            <tbody className="divide-y">{data.map((r) => (<Row key={r._id + r.baseCost + r.perKgCost + r.minDays + r.maxDays + String(r.isActive)} rule={r} onDone={() => mutate()} />))}</tbody></table>
        </div>
      )}
    </div>
  );
}
