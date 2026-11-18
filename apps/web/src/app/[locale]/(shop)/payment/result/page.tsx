'use client';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import Stepper from '@/components/Stepper';
import { Link } from '@/i18n/routing';
import { useCart } from '@/stores/cart';

function Result() {
  const t = useTranslations();
  const sp = useSearchParams();
  const ok = sp.get('status') === 'success';
  const order = sp.get('order');
  useEffect(() => { useCart.getState().load().catch(() => undefined); }, []);
  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center">
      <Stepper step={3} />
      {ok ? <CheckCircle2 className="mx-auto h-16 w-16 text-success" /> : <XCircle className="mx-auto h-16 w-16 text-danger" />}
      <h1 className="mt-4">{ok ? t('payment.success') : t('payment.failed')}</h1>
      <p className="mt-2 text-neutral-600">{ok ? t('payment.successText') : t('payment.failedText')}</p>
      <div className="mt-6 flex justify-center gap-3">
        {order && /^[a-f\d]{24}$/i.test(order) && <Link href={`/account/orders/${order}`} className="btn-primary">{ok ? t('payment.viewOrder') : t('payment.retry')}</Link>}
        <Link href="/products" className="btn-outline">{t('home.shopNow')}</Link>
      </div>
    </div>
  );
}
export default function PaymentResult() { return (<Suspense><Result /></Suspense>); }
