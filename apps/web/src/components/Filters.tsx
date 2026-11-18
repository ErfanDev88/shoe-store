'use client';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { useFmt } from '@/lib/use-fmt';
import type { Localized, Named } from '@/lib/types';

export interface Facets { sizes: number[]; colors: { hex: string; name: Localized }[]; priceRange: { min: number; max: number } }

export default function Filters({ brands, categories, facets }: { brands: Named[]; categories: Named[]; facets: Facets }) {
  const t = useTranslations();
  const f = useFmt();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [min, setMin] = useState(sp.get('minPrice') ?? '');
  const [max, setMax] = useState(sp.get('maxPrice') ?? '');
  useEffect(() => { setMin(sp.get('minPrice') ?? ''); setMax(sp.get('maxPrice') ?? ''); }, [sp]);

  const apply = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) { if (v) p.set(k, v); else p.delete(k); }
    p.delete('page');
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  };
  const toggle = (k: string, v: string) => apply({ [k]: sp.get(k) === v ? undefined : v });
  const roots = categories.filter((c) => !c.parent);
  const chip = (active: boolean) => `chip ${active ? 'chip-active' : ''}`;
  const group = 'group border-b py-5 first:pt-0 [&_summary::-webkit-details-marker]:hidden';
  const head = 'mb-3 flex cursor-pointer list-none items-center justify-between text-sm font-semibold';

  return (
    <div className="text-sm">
      <details open className={group}><summary className={head}>{t('products.category')}<span className="transition group-open:rotate-45">+</span></summary>
        <div className="flex flex-wrap gap-2">
          {roots.map((c) => (
            <span key={c._id} className="contents">
              <button type="button" aria-pressed={sp.get('category') === c.slug} className={chip(sp.get('category') === c.slug)} onClick={() => toggle('category', c.slug)}>{f.text(c.name)}</button>
              {categories.filter((x) => x.parent === c._id).map((x) => (<button type="button" key={x._id} aria-pressed={sp.get('category') === x.slug} className={chip(sp.get('category') === x.slug)} onClick={() => toggle('category', x.slug)}>↳ {f.text(x.name)}</button>))}
            </span>
          ))}
        </div>
      </details>
      <details open className={group}><summary className={head}>{t('products.brand')}<span className="transition group-open:rotate-45">+</span></summary>
        <div className="flex flex-wrap gap-2">{brands.map((b) => (<button type="button" key={b._id} aria-pressed={sp.get('brand') === b.slug} className={chip(sp.get('brand') === b.slug)} onClick={() => toggle('brand', b.slug)}>{f.text(b.name)}</button>))}</div>
      </details>
      <details open className={group}><summary className={head}>{t('products.gender')}<span className="transition group-open:rotate-45">+</span></summary>
        <div className="flex flex-wrap gap-2">{['men', 'women', 'kids'].map((g) => (<button type="button" key={g} aria-pressed={sp.get('gender') === g} className={chip(sp.get('gender') === g)} onClick={() => toggle('gender', g)}>{t(`gender.${g}`)}</button>))}</div>
      </details>
      {facets.sizes.length > 0 && (
        <details open className={group}><summary className={head}>{t('products.size')}<span className="transition group-open:rotate-45">+</span></summary>
          <div className="grid grid-cols-5 gap-2">{facets.sizes.map((s) => (<button type="button" key={s} aria-pressed={sp.get('size') === String(s)} className={`rounded-lg border py-2 text-xs font-medium transition ${sp.get('size') === String(s) ? 'border-brand bg-brand text-brand-fg' : 'hover:border-fg'}`} onClick={() => toggle('size', String(s))}>{f.num(s)}</button>))}</div>
        </details>
      )}
      {facets.colors.length > 0 && (
        <details open className={group}><summary className={head}>{t('products.color')}<span className="transition group-open:rotate-45">+</span></summary>
          <div className="flex flex-wrap gap-2.5">
            {facets.colors.map((c) => {
              const hex = c.hex.replace('#', '');
              return (<button type="button" key={hex} title={f.text(c.name)} aria-label={f.text(c.name)} aria-pressed={sp.get('color') === hex} onClick={() => toggle('color', hex)}
                className={`h-8 w-8 rounded-full border transition ${sp.get('color') === hex ? 'ring-2 ring-fg ring-offset-2 ring-offset-bg' : 'hover:scale-110'}`} style={{ background: c.hex }} />);
            })}
          </div>
        </details>
      )}
      <details open className={group}><summary className={head}>{t('products.price')} ({t('common.toman')})<span className="transition group-open:rotate-45">+</span></summary>
        <div className="flex gap-2">
          <input className="input" inputMode="numeric" aria-label={t('products.from')} placeholder={f.num(facets.priceRange.min)} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} />
          <input className="input" inputMode="numeric" aria-label={t('products.to')} placeholder={f.num(facets.priceRange.max)} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} />
        </div>
        <button type="button" className="btn-outline mt-3 w-full" onClick={() => apply({ minPrice: min || undefined, maxPrice: max || undefined })}>{t('products.applyPrice')}</button>
      </details>
      <div className="space-y-3 pt-5">
        <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={sp.get('onSale') === 'true'} onChange={(e) => apply({ onSale: e.target.checked ? 'true' : undefined })} />{t('products.onSale')}</label>
        <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={sp.get('inStock') === 'true'} onChange={(e) => apply({ inStock: e.target.checked ? 'true' : undefined })} />{t('products.inStock')}</label>
      </div>
    </div>
  );
}
