'use client';
import { SlidersHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { useFmt } from '@/lib/use-fmt';
import type { Named } from '@/lib/types';
import Filters, { Facets } from './Filters';
import Modal from './Modal';

export default function ProductsToolbar({ brands, categories, facets, total }: { brands: Named[]; categories: Named[]; facets: Facets; total: number }) {
  const t = useTranslations();
  const f = useFmt();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const set = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) { if (v) p.set(k, v); else p.delete(k); }
    p.delete('page');
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  };

  const chips: { key: string[]; label: string }[] = [];
  const add = (keys: string[], label?: string) => { if (label) chips.push({ key: keys, label }); };
  add(['q'], sp.get('q') ? `“${sp.get('q')}”` : undefined);
  add(['category'], sp.get('category') ? f.text(categories.find((c) => c.slug === sp.get('category'))?.name) || sp.get('category')! : undefined);
  add(['brand'], sp.get('brand') ? f.text(brands.find((b) => b.slug === sp.get('brand'))?.name) || sp.get('brand')! : undefined);
  add(['gender'], sp.get('gender') ? t(`gender.${sp.get('gender')}`) : undefined);
  add(['size'], sp.get('size') ? `${t('products.size')} ${f.num(Number(sp.get('size')))}` : undefined);
  add(['color'], sp.get('color') ? `${t('products.color')} #${sp.get('color')}` : undefined);
  add(['minPrice', 'maxPrice'], sp.get('minPrice') || sp.get('maxPrice') ? `${f.num(Number(sp.get('minPrice') ?? 0))} – ${sp.get('maxPrice') ? f.num(Number(sp.get('maxPrice'))) : '∞'}` : undefined);
  add(['onSale'], sp.get('onSale') === 'true' ? t('products.onSale') : undefined);
  add(['inStock'], sp.get('inStock') === 'true' ? t('products.inStock') : undefined);

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="btn-outline md:hidden" onClick={() => setOpen(true)}><SlidersHorizontal className="h-4 w-4" />{t('products.filters')}{chips.length > 0 && <span className="rounded-full bg-brand px-1.5 text-xs text-brand-fg">{f.num(chips.length)}</span>}</button>
        <p className="hidden text-sm text-neutral-500 md:block">{f.num(total)} {t('products.count')}</p>
        <label className="flex items-center gap-2 text-sm"><span className="hidden text-neutral-500 sm:inline">{t('products.sort')}</span>
          <select className="input !w-auto" value={sp.get('sort') ?? 'newest'} onChange={(e) => set({ sort: e.target.value === 'newest' ? undefined : e.target.value })}>
            {['newest', 'best', 'rating', 'price_asc', 'price_desc'].map((s) => (<option key={s} value={s}>{t(`sort.${s}`)}</option>))}
          </select></label>
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label={t('products.activeFilters')}>
          {chips.map((c) => (<button key={c.key.join()} type="button" className="chip chip-active" onClick={() => set(Object.fromEntries(c.key.map((k) => [k, undefined])))} aria-label={`${t('common.remove')}: ${c.label}`}>{c.label}<X className="h-3 w-3" /></button>))}
          <button type="button" className="link-u text-xs text-neutral-500" onClick={() => router.push(pathname, { scroll: false })}>{t('products.clear')}</button>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} side="bottom" label={t('products.filters')}>
        <div className="p-6 pt-14"><Filters brands={brands} categories={categories} facets={facets} />
          <button type="button" className="btn-primary sticky bottom-0 mt-4 w-full py-3" onClick={() => setOpen(false)}>{t('products.showResults', { n: f.num(total) })}</button></div>
      </Modal>
    </div>
  );
}
