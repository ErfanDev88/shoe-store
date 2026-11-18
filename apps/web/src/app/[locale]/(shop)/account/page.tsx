'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import AddressForm, { AddressInput } from '@/components/AddressForm';
import { Field } from '@/components/ui';
import { useRouter } from '@/i18n/routing';
import { api } from '@/lib/api';
import type { Address, User } from '@/lib/types';
import { useErrorText } from '@/lib/use-fmt';
import { useAuth } from '@/stores/auth';

export default function AccountPage() {
  const t = useTranslations();
  const err = useErrorText();
  const router = useRouter();
  const user = useAuth((s) => s.user)!;
  const [first, setFirst] = useState(user.firstName ?? '');
  const [last, setLast] = useState(user.lastName ?? '');
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');

  const setAddresses = (addresses: Address[]) => useAuth.getState().setUser({ ...user, addresses });
  const run = async (fn: () => Promise<unknown>, ok?: string) => { try { await fn(); if (ok) toast.success(ok); } catch (e) { toast.error(err(e)); } };

  const saveProfile = (e: React.FormEvent) => { e.preventDefault(); run(async () => { const u = await api<User>('/users/me', { method: 'PATCH', json: { firstName: first || undefined, lastName: last || undefined } }); useAuth.getState().setUser(u); }, t('common.saved')); };
  const saveAddress = async (id: string | 'new', a: AddressInput) => {
    setAddresses(id === 'new' ? await api<Address[]>('/users/me/addresses', { method: 'POST', json: a }) : await api<Address[]>(`/users/me/addresses/${id}`, { method: 'PATCH', json: a }));
    setEditing(null);
  };
  const changePassword = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    const r = await api<{ accessToken: string; user: User }>('/auth/password/change', { method: 'POST', json: { currentPassword: cur, newPassword: next } });
    useAuth.getState().setSession(r.user, r.accessToken); setCur(''); setNext('');
  }, t('common.saved')); };

  return (
    <div className="space-y-8">
      <section className="card space-y-4">
        <h2 className="text-lg">{t('account.profile')}</h2>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {user.phone && <p><span className="text-neutral-500">{t('auth.phone')}: </span><span dir="ltr">{user.phone}</span></p>}
          {user.email && (<p><span className="text-neutral-500">{t('auth.email')}: </span><span dir="ltr">{user.email}</span>{' '}
            {user.isEmailVerified ? <span className="text-success">✓</span> : <button className="text-brand underline" onClick={() => run(() => api('/auth/email/resend', { method: 'POST' }), t('account.verifySent'))}>{t('account.verifyEmail')}</button>}</p>)}
        </div>
        <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-3">
          <Field label={t('auth.firstName')}><input className="input" maxLength={50} value={first} onChange={(e) => setFirst(e.target.value)} /></Field>
          <Field label={t('auth.lastName')}><input className="input" maxLength={50} value={last} onChange={(e) => setLast(e.target.value)} /></Field>
          <div className="flex items-end"><button className="btn-primary">{t('common.save')}</button></div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-lg">{t('account.addresses')}</h2>{editing === null && <button className="btn-outline" onClick={() => setEditing('new')}>{t('address.add')}</button>}</div>
        {editing === 'new' && <AddressForm onSubmit={(a) => saveAddress('new', a)} onCancel={() => setEditing(null)} />}
        {user.addresses.map((a) => editing === a.id ? (
          <AddressForm key={a.id} initial={a} onSubmit={(x) => saveAddress(a.id, x)} onCancel={() => setEditing(null)} />
        ) : (
          <div key={a.id} className="card flex items-start justify-between gap-3 text-sm">
            <p><b>{a.title}</b> {a.isDefault && <span className="rounded bg-neutral-100 px-1.5 text-xs">{t('address.default')}</span>}<br />{a.receiver} ({a.phone})<br />{a.province}، {a.city}، {a.address} — {a.postalCode}</p>
            <div className="flex shrink-0 gap-3"><button className="text-brand" onClick={() => setEditing(a.id)}>{t('common.edit')}</button>
              <button className="text-danger" onClick={() => run(async () => setAddresses(await api<Address[]>(`/users/me/addresses/${a.id}`, { method: 'DELETE' })))}>{t('common.remove')}</button></div>
          </div>
        ))}
        {user.addresses.length === 0 && editing === null && <p className="text-sm text-neutral-500">{t('account.noAddress')}</p>}
      </section>

      {user.email && (
        <section className="card space-y-3">
          <h2 className="text-lg">{t('account.changePassword')}</h2>
          <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-3">
            <Field label={t('account.currentPassword')}><input className="input" dir="ltr" type="password" required value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></Field>
            <Field label={t('auth.newPassword')}><input className="input" dir="ltr" type="password" required minLength={8} maxLength={128} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></Field>
            <div className="flex items-end"><button className="btn-primary">{t('common.save')}</button></div>
          </form>
        </section>
      )}

      <section className="card flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">{t('account.logoutAllHint')}</p>
        <button className="btn-outline" onClick={() => run(async () => { await api('/auth/logout-all', { method: 'POST' }); await useAuth.getState().logout(); router.push('/login'); })}>{t('account.logoutAll')}</button>
      </section>
    </div>
  );
}
