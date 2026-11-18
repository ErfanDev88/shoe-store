'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Field } from '@/components/ui';
import { api } from '@/lib/api';
import { useErrorText } from '@/lib/use-fmt';

export default function ForgotPassword() {
  const t = useTranslations();
  const err = useErrorText();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await api('/auth/password/forgot', { method: 'POST', json: { email } }); setSent(true); } catch (x) { toast.error(err(x)); } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-center">{t('auth.forgot')}</h1>
      <div className="card">
        {sent ? <p className="text-center text-sm leading-7">{t('auth.resetSent')}</p> : (
          <form onSubmit={submit} className="space-y-4">
            <Field label={t('auth.email')}><input className="input" dir="ltr" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <button className="btn-primary w-full" disabled={busy}>{t('auth.sendResetLink')}</button>
          </form>
        )}
      </div>
    </div>
  );
}
