import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import SectionHead from '@/components/home/SectionHead';
import ProductGrid from '@/components/ProductGrid';
import ProductPurchase from '@/components/ProductPurchase';
import ReviewsSection from '@/components/ReviewsSection';
import { serverApi } from '@/lib/api';
import { loc } from '@/lib/format';
import type { Product } from '@/lib/types';

const getProduct = (slug: string) => serverApi<Product>(`/products/${encodeURIComponent(slug)}`).catch(() => null);

export async function generateMetadata({ params }: { params: { slug: string; locale: string } }) {
  const p = await getProduct(params.slug);
  if (!p) return {};
  return { title: loc(p.title, params.locale), description: loc(p.description, params.locale).slice(0, 160), openGraph: { images: p.images.slice(0, 1) } };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await getProduct(params.slug);
  if (!p) notFound();
  const [t, locale, related] = await Promise.all([
    getTranslations(), getLocale(), serverApi<Product[]>(`/products/${encodeURIComponent(params.slug)}/related`).catch(() => [] as Product[]),
  ]);
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: loc(p.title, locale), image: p.images, description: loc(p.description, locale),
    brand: { '@type': 'Brand', name: loc(p.brand?.name, locale) },
    offers: { '@type': 'Offer', priceCurrency: 'IRR', price: p.finalPrice * 10, availability: p.variants.some((v) => v.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
    ...(p.ratingCount ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.ratingAvg, reviewCount: p.ratingCount } } : {}),
  };
  return (
    <div className="container-page">
      {/* '<' is escaped so product text can never close the script tag */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Breadcrumbs items={[{ href: '/products', label: t('nav.products') }, { href: `/products?category=${p.category?.slug}`, label: loc(p.category?.name, locale) }, { label: loc(p.title, locale) }]} />
      <ProductPurchase product={p} locale={locale} />
      <ReviewsSection productId={p._id} />
      {related.length > 0 && (<section className="mt-24"><SectionHead eyebrow={t('product.relatedEyebrow')} title={t('product.related')} /><ProductGrid items={related} /></section>)}
    </div>
  );
}
