import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-5xl">404</h1>
      <p className="mt-3 text-neutral-600">{t('common.notFound')}</p>
      <Link href="/" className="btn-primary mt-6">{t('common.backHome')}</Link>
    </div>
  );
}
