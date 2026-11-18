'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { PROVINCES, toEnDigits } from '@/lib/format';
import { useErrorText } from '@/lib/use-fmt';
import type { Address } from '@/lib/types';
import { Field } from './ui';

export type AddressInput = Omit<Address, 'id'>;

export default function AddressForm({ initial, onSubmit, onCancel }: { initial?: Partial<Address>; onSubmit: (a: AddressInput) => Promise<void>; onCancel?: () => void }) {
  const t = useTranslations();
  const err = useErrorText();
  const [v, setV] = useState<AddressInput>({ title: '', receiver: '', phone: '', province: 'تهران', city: '', address: '', postalCode: '', isDefault: false, ...initial });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof AddressInput>(k: K, val: AddressInput[K]) => setV((p) => ({ ...p, [k]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await onSubmit({ ...v, phone: toEnDigits(v.phone), postalCode: toEnDigits(v.postalCode) }); } catch (x) { toast.error(err(x)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card grid gap-3 sm:grid-cols-2">
      <Field label={t('address.title')}><input className="input" required maxLength={60} value={v.title} onChange={(e) => set('title', e.target.value)} placeholder={t('address.titlePlaceholder')} /></Field>
      <Field label={t('address.receiver')}><input className="input" required maxLength={100} value={v.receiver} onChange={(e) => set('receiver', e.target.value)} /></Field>
      <Field label={t('address.phone')}><input className="input" required dir="ltr" inputMode="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09xxxxxxxxx" /></Field>
      <Field label={t('address.postalCode')}><input className="input" required dir="ltr" inputMode="numeric" maxLength={10} value={v.postalCode} onChange={(e) => set('postalCode', e.target.value)} /></Field>
      <Field label={t('address.province')}>
        <select className="input" value={v.province} onChange={(e) => set('province', e.target.value)}>{PROVINCES.map((p) => (<option key={p}>{p}</option>))}</select>
      </Field>
      <Field label={t('address.city')}><input className="input" required maxLength={60} value={v.city} onChange={(e) => set('city', e.target.value)} /></Field>
      <div className="sm:col-span-2"><Field label={t('address.address')}><textarea className="input" required rows={2} minLength={5} maxLength={500} value={v.address} onChange={(e) => set('address', e.target.value)} /></Field></div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={v.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />{t('address.makeDefault')}</label>
      <div className="flex gap-2 sm:col-span-2">
        <button className="btn-primary" disabled={busy}>{t('common.save')}</button>
        {onCancel && <button type="button" className="btn-outline" onClick={onCancel}>{t('common.cancel')}</button>}
      </div>
    </form>
  );
}
