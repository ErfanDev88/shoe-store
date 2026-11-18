import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/Breadcrumbs';
import Filters, { Facets } from '@/components/Filters';
import ProductGrid from '@/components/ProductGrid';
import ProductsToolbar from '@/components/ProductsToolbar';
import ShoeArt from '@/components/ShoeArt';
import { Link } from '@/i18n/routing';
import { qs, serverApi } from '@/lib/api';
import type { Named, Paged, Product } from '@/lib/types';

const KEYS = ['q', 'brand', 'category', 'gender', 'minPrice', 'maxPrice', 'size', 'color', 'onSale', 'inStock', 'sort', 'page'] as const;

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('nav.products') };
}

export default async function ProductsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const t = await getTranslations();
  const query = Object.fromEntries(KEYS.map((k) => [k, searchParams[k]]).filter(([, v]) => v));
  let failed = false;
  const [res, brands, categories, facets] = await Promise.all([
    serverApi<Paged<Product>>(`/products${qs({ ...query, limit: 12 })}`).catch(() => { failed = true; return { items: [], total: 0, page: 1, limit: 12, pages: 0 } as Paged<Product>; }),
    serverApi<Named[]>('/brands').catch(() => [] as Named[]),
    serverApi<Named[]>('/categories').catch(() => [] as Named[]),
    serverApi<Facets>('/products/facets').catch(() => ({ sizes: [], colors: [], priceRange: { min: 0, max: 0 } }) as Facets),
  ]);
  const page = res.page;
  const pages = res.pages ?? 0;
  const href = (p: number) => `/products${qs({ ...query, page: p > 1 ? p : undefined })}`;
  const window = [...new Set([1, page - 1, page, page + 1, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);

  return (
    <div className="container-page">
      <Breadcrumbs items={[{ label: t('nav.products') }]} />
      <div className="mb-8"><p className="eyebrow mb-2">SOLE STORE</p><h1 className="text-4xl md:text-5xl">{searchParams.q ? `${t('products.searchFor')} «${searchParams.q}»` : t('nav.products')}</h1></div>
      <div className="grid gap-10 md:grid-cols-[250px_1fr]">
        <aside className="hidden md:block"><div className="sticky top-32"><Filters brands={brands} categories={categories} facets={facets} /></div></aside>
        <div>
          <ProductsToolbar brands={brands} categories={categories} facets={facets} total={res.total} />
          {failed ? (
            <div className="rounded-2xl border border-dashed p-12 text-center" role="alert">
              <p className="text-lg font-semibold">{t('products.errorTitle')}</p><p className="mt-2 text-sm text-neutral-500">{t('products.errorText')}</p>
              <Link href={href(page)} className="btn-primary mt-6"><RefreshCw className="h-4 w-4" />{t('products.retry')}</Link>
            </div>
          ) : res.items.length ? (
            <ProductGrid items={res.items} cols={3} />
          ) : (
            <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
              <ShoeArt className="mx-auto w-56 opacity-25" title="" /><p className="mt-4 text-lg font-semibold">{t('products.empty')}</p><p className="mt-1 text-sm text-neutral-500">{t('products.emptyText')}</p>
              <Link href="/products" className="btn-outline mt-6">{t('products.clear')}</Link>
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="pagination">
              {page > 1 && <Link href={href(page - 1)} className="icon-btn border" aria-label={t('common.prev')}><ChevronRight className="h-4 w-4 ltr:rotate-180" /></Link>}
              {window.map((p, i) => (
                <span key={p} className="flex items-center gap-1.5">
                  {i > 0 && p - window[i - 1] > 1 && <span className="px-1 text-neutral-400">…</span>}
                  <Link href={href(p)} aria-current={p === page ? 'page' : undefined} className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm transition ${p === page ? 'bg-brand text-brand-fg' : 'hover:bg-neutral-100'}`}>{p.toLocaleString(t('common.numLocale'))}</Link>
                </span>
              ))}
              {page < pages && <Link href={href(page + 1)} className="icon-btn border" aria-label={t('common.next')}><ChevronLeft className="h-4 w-4 ltr:rotate-180" /></Link>}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
