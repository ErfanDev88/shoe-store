'use client';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import ShoeArt from '@/components/ShoeArt';
import { Field } from '@/components/ui';
import { Link, useRouter } from '@/i18n/routing';
import { api } from '@/lib/api';
import { toEnDigits } from '@/lib/format';
import type { User } from '@/lib/types';
import { useErrorText } from '@/lib/use-fmt';
import { safeNext } from '@/lib/use-require-auth';
import { useAuth } from '@/stores/auth';

type Mode = 'otp' | 'password' | 'register';
type Session = { accessToken: string; user: User };

function LoginForm() {
  const t = useTranslations();
  const err = useErrorText();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const status = useAuth((s) => s.status);
  const [mode, setMode] = useState<Mode>('otp');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (status === 'authed') router.replace(next ?? '/account'); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (cooldown <= 0) return; const id = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(id); }, [cooldown]);

  const finish = (s: Session) => {
    useAuth.getState().setSession(s.user, s.accessToken);
    router.replace(next ?? (s.user.role !== 'customer' ? '/admin' : '/account'));
  };
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (e) { toast.error(err(e)); } finally { setBusy(false); } };

  const requestOtp = () => run(async () => {
    await api('/auth/otp/request', { method: 'POST', json: { phone: toEnDigits(phone) } });
    setStep('code'); setCooldown(60); toast.success(t('auth.codeSent'));
  });
  const verifyOtp = (e: React.FormEvent) => { e.preventDefault(); run(async () => finish(await api<Session>('/auth/otp/verify', { method: 'POST', json: { phone: toEnDigits(phone), code: toEnDigits(code) } }))); };
  const passwordLogin = (e: React.FormEvent) => { e.preventDefault(); run(async () => finish(await api<Session>('/auth/login', { method: 'POST', json: { email, password } }))); };
  const register = (e: React.FormEvent) => { e.preventDefault(); run(async () => finish(await api<Session>('/auth/register', { method: 'POST', json: { email, password, firstName: first || undefined, lastName: last || undefined } }))); };

  const tab = (m: Mode, label: string) => (<button type="button" onClick={() => setMode(m)} className={`flex-1 rounded-lg py-2 text-sm font-medium ${mode === m ? 'bg-surface shadow' : 'text-neutral-500'}`}>{label}</button>);

  return (
    <div className="mx-auto grid max-w-6xl gap-0 px-4 py-8 md:grid-cols-2 md:py-16">
      <aside className="relative hidden overflow-hidden rounded-s-3xl bg-brand p-10 text-brand-fg md:flex md:flex-col md:justify-between">
        <div aria-hidden="true" className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
        <Logo className="relative" />
        <ShoeArt className="relative -rotate-6 drop-shadow-2xl" title="" />
        <p className="relative display text-2xl leading-snug">{t('auth.panelText')}</p>
      </aside>
      <div className="mx-auto w-full max-w-md self-center py-6 md:px-10">
      <h1 className="mb-6 text-center">{mode === 'register' ? t('auth.register') : t('auth.login')}</h1>
      <div className="mb-5 flex gap-1 rounded-xl bg-neutral-100 p-1">{tab('otp', t('auth.withPhone'))}{tab('password', t('auth.withEmail'))}{tab('register', t('auth.register'))}</div>
      <div className="card space-y-4">
        {mode === 'otp' && (step === 'phone' ? (
          <form onSubmit={(e) => { e.preventDefault(); requestOtp(); }} className="space-y-4">
            <Field label={t('auth.phone')} hint={t('auth.phoneHint')}><input className="input" dir="ltr" inputMode="tel" autoFocus required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" /></Field>
            <button className="btn-primary w-full" disabled={busy}>{t('auth.sendCode')}</button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <Field label={t('auth.enterCode', { phone })}><input className="input text-center text-lg tracking-[0.5em]" dir="ltr" inputMode="numeric" autoComplete="one-time-code" autoFocus required maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
            <button className="btn-primary w-full" disabled={busy || toEnDigits(code).length !== 6}>{t('auth.verify')}</button>
            <div className="flex justify-between text-sm">
              <button type="button" className="text-neutral-500" onClick={() => { setStep('phone'); setCode(''); }}>{t('auth.changePhone')}</button>
              <button type="button" disabled={cooldown > 0 || busy} className="text-brand disabled:text-neutral-400" onClick={requestOtp}>{cooldown > 0 ? t('auth.resendIn', { s: cooldown }) : t('auth.resend')}</button>
            </div>
          </form>
        ))}
        {mode === 'password' && (
          <form onSubmit={passwordLogin} className="space-y-4">
            <Field label={t('auth.email')}><input className="input" dir="ltr" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
            <Field label={t('auth.password')}><input className="input" dir="ltr" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
            <button className="btn-primary w-full" disabled={busy}>{t('auth.login')}</button>
            <Link href="/forgot-password" className="block text-center text-sm text-neutral-500">{t('auth.forgot')}</Link>
          </form>
        )}
        {mode === 'register' && (
          <form onSubmit={register} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('auth.firstName')}><input className="input" maxLength={50} value={first} onChange={(e) => setFirst(e.target.value)} /></Field>
              <Field label={t('auth.lastName')}><input className="input" maxLength={50} value={last} onChange={(e) => setLast(e.target.value)} /></Field>
            </div>
            <Field label={t('auth.email')}><input className="input" dir="ltr" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
            <Field label={t('auth.password')} hint={t('auth.passwordHint')}><input className="input" dir="ltr" type="password" required minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
            <button className="btn-primary w-full" disabled={busy}>{t('auth.register')}</button>
          </form>
        )}
      </div>
    </div>
    </div>
  );
}

export default function LoginPage() { return (<Suspense><LoginForm /></Suspense>); }
