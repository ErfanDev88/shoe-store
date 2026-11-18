import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import Logo from './Logo';
import NewsletterForm from './NewsletterForm';

export default async function Footer() {
  const t = await getTranslations();
  const col = (title: string, links: [string, string][]) => (
    <nav aria-label={title}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-500">{title}</h2>
      <ul className="space-y-2.5 text-sm">{links.map(([href, label]) => (<li key={href}><Link href={href} className="link-u">{label}</Link></li>))}</ul>
    </nav>
  );
  return (
    <footer className="mt-24 border-t bg-neutral-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.4fr] md:px-6">
        <div className="space-y-4"><Logo /><p className="max-w-xs text-sm leading-7 text-neutral-600">{t('site.tagline')}</p></div>
        {col(t('footer.shop'), [['/products', t('nav.products')], ['/products?gender=men', t('gender.men')], ['/products?gender=women', t('gender.women')], ['/products?onSale=true', t('nav.sale')]])}
        {col(t('footer.account'), [['/account', t('nav.account')], ['/account/orders', t('nav.orders')], ['/account/wishlist', t('nav.wishlist')], ['/cart', t('nav.cart')]])}
        <div className="space-y-3"><h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">{t('footer.newsletterTitle')}</h2><p className="text-sm text-neutral-600">{t('footer.newsletterText')}</p><NewsletterForm /></div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-neutral-500 md:flex-row md:px-6">
          <p>© {new Date().getFullYear()} SOLE STORE. {t('footer.rights')}</p><p>{t('footer.note')}</p>
        </div>
      </div>
    </footer>
  );
}
