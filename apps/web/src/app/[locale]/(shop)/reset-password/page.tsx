'use client';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { Field } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';
import { useErrorText } from '@/lib/use-fmt';

function Form() {
  const t = useTranslations();
  const err = useErrorText();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await api('/auth/password/reset', { method: 'POST', json: { token, password } }); setDone(true); } catch (x) { toast.error(err(x)); } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-center">{t('auth.newPassword')}</h1>
      <div className="card">
        {done ? (<div className="space-y-4 text-center"><p>{t('auth.passwordUpdated')}</p><Link href="/login" className="btn-primary">{t('auth.login')}</Link></div>) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label={t('auth.newPassword')} hint={t('auth.passwordHint')}><input className="input" dir="ltr" type="password" required minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
            <button className="btn-primary w-full" disabled={busy || !token}>{t('common.save')}</button>
          </form>
        )}
      </div>
    </div>
  );
}
export default function ResetPassword() { return (<Suspense><Form /></Suspense>); }
