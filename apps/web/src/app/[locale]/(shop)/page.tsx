import { ArrowUpRight, CreditCard, Headset, ShieldCheck, Truck } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import Hero from '@/components/home/Hero';
import Marquee from '@/components/home/Marquee';
import SectionHead from '@/components/home/SectionHead';
import { Reveal } from '@/components/motion/Reveal';
import ProductGrid from '@/components/ProductGrid';
import ShoeArt from '@/components/ShoeArt';
import { Link } from '@/i18n/routing';
import { qs, serverApi } from '@/lib/api';
import { loc } from '@/lib/format';
import type { Named, Paged, Product } from '@/lib/types';

const safe = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback);
const empty: Paged<Product> = { items: [], total: 0, page: 1, limit: 0 };

export default async function Home() {
  const t = await getTranslations();
  const locale = await getLocale();
  const [newest, best, sale, cats, brands] = await Promise.all([
    safe(serverApi<Paged<Product>>(`/products${qs({ sort: 'newest', limit: 8 })}`), empty),
    safe(serverApi<Paged<Product>>(`/products${qs({ sort: 'best', limit: 4 })}`), empty),
    safe(serverApi<Paged<Product>>(`/products${qs({ onSale: true, limit: 4 })}`), empty),
    safe(serverApi<Named[]>('/categories'), []),
    safe(serverApi<Named[]>('/brands'), []),
  ]);
  const roots = cats.filter((c) => !c.parent).slice(0, 4);
  const benefits = [
    { icon: ShieldCheck, k: 'authentic' }, { icon: Truck, k: 'delivery' }, { icon: CreditCard, k: 'secure' }, { icon: Headset, k: 'support' },
  ] as const;

  return (
    <>
      <Hero />
      <Marquee words={brands.map((b) => loc(b.name, locale))} />

      {roots.length > 0 && (
        <section className="container-page pt-20">
          <SectionHead eyebrow={t('home.collections')} title={t('home.shopByCategory')} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {roots.map((c, i) => (
              <Reveal key={c._id} delay={i * 0.07}>
                <Link href={`/products?category=${c.slug}`} className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl border bg-neutral-100 p-5 transition duration-500 hover:bg-brand hover:text-brand-fg">
                  <span className="display text-5xl opacity-20 transition group-hover:opacity-60" dir="ltr">{String(i + 1).padStart(2, '0')}</span>
                  <ShoeArt className="absolute -bottom-2 end-[-30%] w-[120%] opacity-10 transition duration-700 group-hover:scale-110 group-hover:opacity-30" title="" />
                  <span className="relative flex items-end justify-between gap-2"><span className="display text-xl md:text-2xl">{loc(c.name, locale)}</span><ArrowUpRight className="h-6 w-6 shrink-0 transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {newest.items.length > 0 ? (
        <section className="container-page pt-20">
          <SectionHead eyebrow={t('home.eyebrowNew')} title={t('home.newest')} href="/products?sort=newest" cta={t('common.viewAll')} />
          <ProductGrid items={newest.items} />
        </section>
      ) : (
        <p className="py-24 text-center text-neutral-500">{t('products.empty')}</p>
      )}

      <section className="container-page pt-24">
        <Reveal>
          <div className="relative isolate grid items-center overflow-hidden rounded-3xl bg-brand p-8 text-brand-fg md:grid-cols-2 md:p-14">
            <div aria-hidden="true" className="absolute -end-20 -top-20 -z-10 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">{t('home.editorialEyebrow')}</p>
              <h2 className="text-3xl leading-tight md:text-5xl">{t('home.editorialTitle')}</h2>
              <p className="max-w-md leading-8 opacity-80">{t('home.editorialText')}</p>
              <Link href="/products?onSale=true" className="btn mt-2 bg-brand-fg px-7 py-3.5 text-brand hover:opacity-90">{t('home.editorialCta')}</Link>
            </div>
            <ShoeArt className="mt-8 w-full -rotate-6 drop-shadow-2xl md:mt-0" title="" />
          </div>
        </Reveal>
      </section>

      {sale.items.length > 0 && (
        <section className="container-page pt-20">
          <SectionHead eyebrow={t('home.eyebrowSale')} title={t('home.onSale')} href="/products?onSale=true" cta={t('common.viewAll')} />
          <ProductGrid items={sale.items} />
        </section>
      )}

      {best.items.length > 0 && (
        <section className="container-page pt-20">
          <SectionHead eyebrow={t('home.eyebrowBest')} title={t('home.bestSellers')} href="/products?sort=best" cta={t('common.viewAll')} />
          <ProductGrid items={best.items} />
        </section>
      )}

      <section className="container-page pt-24">
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, k }, i) => (
            <Reveal key={k} delay={i * 0.06} y={14} className="bg-surface p-7">
              <Icon className="h-7 w-7 text-accent" strokeWidth={1.5} />
              <h3 className="mt-4 !text-base !font-semibold !tracking-normal">{t(`home.benefit_${k}`)}</h3>
              <p className="mt-1.5 text-sm leading-7 text-neutral-500">{t(`home.benefit_${k}_text`)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {brands.length > 0 && (
        <section className="container-page pt-20">
          <SectionHead eyebrow={t('home.brandsEyebrow')} title={t('home.featuredBrands')} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {brands.slice(0, 6).map((b) => (
              <Link key={b._id} href={`/products?brand=${b.slug}`} className="display flex h-24 items-center justify-center rounded-xl border text-lg text-neutral-500 transition hover:border-fg hover:bg-neutral-100 hover:text-fg">{loc(b.name, locale)}</Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
