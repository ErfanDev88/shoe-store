'use client';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';

function Verify() {
  const t = useTranslations();
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');
  const sent = useRef(false); // the token is single-use: React StrictMode runs effects twice in dev
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    api('/auth/email/verify', { method: 'POST', json: { token } }).then(() => setState('ok')).catch(() => setState('fail'));
  }, [token]);
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {state === 'loading' ? <Spinner /> : (<><p className="mb-6 text-lg">{state === 'ok' ? t('auth.emailVerified') : t('errors.TOKEN_INVALID_OR_EXPIRED')}</p><Link href="/account" className="btn-primary">{t('nav.account')}</Link></>)}
    </div>
  );
}
export default function VerifyEmail() { return (<Suspense><Verify /></Suspense>); }
