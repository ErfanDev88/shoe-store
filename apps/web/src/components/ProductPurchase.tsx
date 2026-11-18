import { getTranslations } from 'next-intl/server';
import { loc } from '@/lib/format';
import type { Product } from '@/lib/types';
import BuyBox from './BuyBox';
import Gallery from './Gallery';

export default async function ProductPurchase({ product: p, locale }: { product: Product; locale: string }) {
  const t = await getTranslations();
  const desc = loc(p.description, locale);
  const specs: [string, string | undefined][] = [
    [t('products.brand'), loc(p.brand?.name, locale)], [t('products.category'), loc(p.category?.name, locale)], [t('products.gender'), t(`gender.${p.gender}`)],
    [t('product.material'), p.material], [t('product.sole'), p.sole], [t('product.closure'), p.closureType], [t('product.season'), p.season],
  ];
  const acc = 'group border-b py-4 [&_summary::-webkit-details-marker]:hidden';
  const sum = 'flex cursor-pointer list-none items-center justify-between text-sm font-semibold';
  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      <Gallery images={p.images} alt={loc(p.title, locale)} />
      <div className="lg:sticky lg:top-28 lg:self-start">
        <BuyBox product={p} />
        <div className="mt-8 border-t">
          {desc && (<details open className={acc}><summary className={sum}>{t('product.description')}<span className="transition group-open:rotate-45">+</span></summary><p className="mt-3 whitespace-pre-line text-sm leading-8 text-neutral-600">{desc}</p></details>)}
          <details className={acc}><summary className={sum}>{t('product.specs')}<span className="transition group-open:rotate-45">+</span></summary>
            <dl className="mt-3 divide-y text-sm">{specs.filter(([, v]) => v).map(([k, v]) => (<div key={k} className="flex justify-between py-2"><dt className="text-neutral-500">{k}</dt><dd>{v}</dd></div>))}</dl></details>
          <details className={acc}><summary className={sum}>{t('product.shippingInfo')}<span className="transition group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-8 text-neutral-600">{t('product.shippingText')}</p></details>
        </div>
      </div>
    </div>
  );
}
