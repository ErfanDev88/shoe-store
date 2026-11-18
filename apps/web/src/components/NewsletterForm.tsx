'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useErrorText } from '@/lib/use-fmt';

export default function NewsletterForm() {
  const t = useTranslations();
  const err = useErrorText();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await api('/newsletter', { method: 'POST', json: { email } }); setDone(true); setEmail(''); } catch (x) { toast.error(err(x)); } finally { setBusy(false); }
  };

  if (done) return <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">{t('footer.subscribed')}</p>;
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input type="email" required dir="ltr" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('footer.emailPlaceholder')} aria-label={t('auth.email')} className="input" autoComplete="email" />
      <button className="btn-primary" disabled={busy}>{t('footer.subscribe')}</button>
    </form>
  );
}
