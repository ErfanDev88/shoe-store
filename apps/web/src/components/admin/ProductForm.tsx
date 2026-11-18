'use client';
import { Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Field } from '@/components/ui';
import { useRouter } from '@/i18n/routing';
import { api, fetcher } from '@/lib/api';
import type { Named, Product } from '@/lib/types';
import { useErrorText, useFmt } from '@/lib/use-fmt';

interface VRow { sku: string; size: string; nameFa: string; nameEn: string; hex: string; stock: string }

export default function ProductForm({ product }: { product?: Product }) {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const router = useRouter();
  const { data: brands } = useSWR<Named[]>('/admin/brands', fetcher);
  const { data: cats } = useSWR<Named[]>('/admin/categories', fetcher);

  const [s, setS] = useState({
    titleFa: product?.title.fa ?? '', titleEn: product?.title.en ?? '', descFa: product?.description?.fa ?? '', descEn: product?.description?.en ?? '',
    slug: '', brand: (product?.brand as unknown as string) ?? '', category: (product?.category as unknown as string) ?? '',
    gender: product?.gender ?? 'unisex', material: product?.material ?? '', sole: product?.sole ?? '', closureType: product?.closureType ?? '', season: product?.season ?? '',
    tags: (product?.tags ?? []).join(', '), basePrice: String(product?.basePrice ?? ''), discountPercent: String(product?.discountPercent ?? 0),
    weightGram: String(product?.weightGram ?? 800), isActive: product?.isActive ?? true,
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [rows, setRows] = useState<VRow[]>((product?.variants ?? []).map((v) => ({ sku: v.sku, size: String(v.size), nameFa: v.color.name.fa, nameEn: v.color.name.en ?? '', hex: v.color.hex, stock: String(v.stock) })));
  const [gen, setGen] = useState({ prefix: '', sizes: '39,40,41,42,43', nameFa: '', nameEn: '', hex: '#111111', stock: '5' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof s, v: string | boolean) => setS((p) => ({ ...p, [k]: v }));
  const setRow = (i: number, k: keyof VRow, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const fd = new FormData();
    [...files].forEach((x) => fd.append('files', x));
    try { const r = await api<{ urls: string[] }>('/admin/uploads/images', { method: 'POST', body: fd }); setImages((p) => [...p, ...r.urls].slice(0, 10)); } catch (e) { toast.error(err(e)); }
  };

  const generate = () => {
    const sizes = gen.sizes.split(',').map((x) => x.trim()).filter(Boolean);
    if (!gen.prefix || !gen.nameFa || !sizes.length) { toast.warning(t('admin.genNeed')); return; }
    const code = gen.hex.replace('#', '').toUpperCase();
    setRows((r) => [...r, ...sizes.map((sz) => ({ sku: `${gen.prefix}-${code}-${sz}`, size: sz, nameFa: gen.nameFa, nameEn: gen.nameEn, hex: gen.hex, stock: gen.stock }))]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const opt = (v: string) => v.trim() || undefined;
    const body: Record<string, unknown> = {
      title: { fa: s.titleFa, en: s.titleEn }, description: { fa: s.descFa, en: s.descEn }, brand: s.brand, category: s.category, gender: s.gender,
      material: opt(s.material), sole: opt(s.sole), closureType: opt(s.closureType), season: opt(s.season),
      tags: s.tags.split(',').map((x) => x.trim()).filter(Boolean), images, basePrice: Number(s.basePrice), discountPercent: Number(s.discountPercent),
      weightGram: Number(s.weightGram), isActive: s.isActive,
      variants: rows.map((r) => ({ sku: r.sku.trim(), size: Number(r.size), color: { name: { fa: r.nameFa, en: r.nameEn }, hex: r.hex }, stock: Number(r.stock) })),
    };
    if (!product && opt(s.slug)) body.slug = s.slug.trim();
    try {
      await api(product ? `/admin/products/${product._id}` : '/admin/products', { method: product ? 'PATCH' : 'POST', json: body });
      toast.success(t('common.saved'));
      router.push('/admin/products');
    } catch (x) { toast.error(err(x)); setBusy(false); }
  };

  const text = (k: keyof typeof s, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field label={label}><input className="input" value={String(s[k])} onChange={(e) => set(k, e.target.value)} {...extra} /></Field>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="card grid gap-3 sm:grid-cols-2">
        {text('titleFa', t('admin.titleFa'), { required: true, maxLength: 200 })}
        {text('titleEn', t('admin.titleEn'), { maxLength: 200, dir: 'ltr' })}
        <Field label={t('admin.descFa')}><textarea className="input" rows={3} maxLength={5000} value={s.descFa} onChange={(e) => set('descFa', e.target.value)} /></Field>
        <Field label={t('admin.descEn')}><textarea className="input" dir="ltr" rows={3} maxLength={5000} value={s.descEn} onChange={(e) => set('descEn', e.target.value)} /></Field>
        <Field label={t('products.brand')}><select className="input" required value={s.brand} onChange={(e) => set('brand', e.target.value)}><option value="" />{brands?.map((b) => (<option key={b._id} value={b._id}>{f.text(b.name)}</option>))}</select></Field>
        <Field label={t('products.category')}><select className="input" required value={s.category} onChange={(e) => set('category', e.target.value)}><option value="" />{cats?.map((c) => (<option key={c._id} value={c._id}>{c.parent ? '↳ ' : ''}{f.text(c.name)}</option>))}</select></Field>
        <Field label={t('products.gender')}><select className="input" value={s.gender} onChange={(e) => set('gender', e.target.value)}>{['men', 'women', 'unisex', 'kids'].map((g) => (<option key={g} value={g}>{t(`gender.${g}`)}</option>))}</select></Field>
        {!product && text('slug', t('admin.slug'), { dir: 'ltr', placeholder: 'auto', pattern: '[a-z0-9]+(-[a-z0-9]+)*' })}
        {text('material', t('product.material'))}{text('sole', t('product.sole'))}{text('closureType', t('product.closure'))}{text('season', t('product.season'))}
        {text('tags', t('admin.tags'))}
      </section>

      <section className="card grid gap-3 sm:grid-cols-4">
        {text('basePrice', `${t('admin.basePrice')} (${t('common.toman')})`, { required: true, type: 'number', min: 0, dir: 'ltr' })}
        {text('discountPercent', t('admin.discountPercent'), { type: 'number', min: 0, max: 90, dir: 'ltr' })}
        {text('weightGram', t('admin.weight'), { type: 'number', min: 50, max: 10000, dir: 'ltr' })}
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={s.isActive} onChange={(e) => set('isActive', e.target.checked)} />{t('admin.active')}</label>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-base">{t('admin.images')}</h2>
          <label className="btn-outline cursor-pointer"><Upload className="h-4 w-4" />{t('admin.upload')}<input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ''; }} /></label></div>
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={src} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-24 w-24 rounded-lg border object-cover" />
              {i === 0 && <span className="absolute start-1 top-1 rounded bg-brand px-1 text-[10px] text-brand-fg">{t('admin.main')}</span>}
              <button type="button" className="absolute -end-2 -top-2 rounded-full bg-danger p-1 text-white" onClick={() => setImages(images.filter((x) => x !== src))}><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-base">{t('admin.variants')}</h2>
        <div className="grid items-end gap-2 rounded-lg bg-neutral-50 p-3 sm:grid-cols-7">
          <Field label={t('admin.skuPrefix')}><input className="input" dir="ltr" value={gen.prefix} onChange={(e) => setGen({ ...gen, prefix: e.target.value.replace(/[^A-Za-z0-9]/g, '') })} /></Field>
          <Field label={t('admin.sizesList')}><input className="input" dir="ltr" value={gen.sizes} onChange={(e) => setGen({ ...gen, sizes: e.target.value })} /></Field>
          <Field label={t('admin.colorFa')}><input className="input" value={gen.nameFa} onChange={(e) => setGen({ ...gen, nameFa: e.target.value })} /></Field>
          <Field label={t('admin.colorEn')}><input className="input" dir="ltr" value={gen.nameEn} onChange={(e) => setGen({ ...gen, nameEn: e.target.value })} /></Field>
          <Field label={t('admin.colorHex')}><input type="color" className="h-9 w-full cursor-pointer rounded border" value={gen.hex} onChange={(e) => setGen({ ...gen, hex: e.target.value })} /></Field>
          <Field label={t('admin.stock')}><input className="input" type="number" min={0} dir="ltr" value={gen.stock} onChange={(e) => setGen({ ...gen, stock: e.target.value })} /></Field>
          <button type="button" className="btn-outline" onClick={generate}>{t('admin.generate')}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="th">SKU</th><th className="th">{t('products.size')}</th><th className="th">{t('admin.colorFa')}</th><th className="th">{t('admin.colorEn')}</th><th className="th">{t('admin.colorHex')}</th><th className="th">{t('admin.stock')}</th><th /></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="td"><input className="input min-w-36" dir="ltr" value={r.sku} onChange={(e) => setRow(i, 'sku', e.target.value)} required /></td>
                  <td className="td"><input className="input w-20" type="number" step="0.5" dir="ltr" value={r.size} onChange={(e) => setRow(i, 'size', e.target.value)} required /></td>
                  <td className="td"><input className="input w-28" value={r.nameFa} onChange={(e) => setRow(i, 'nameFa', e.target.value)} required /></td>
                  <td className="td"><input className="input w-28" dir="ltr" value={r.nameEn} onChange={(e) => setRow(i, 'nameEn', e.target.value)} /></td>
                  <td className="td"><input type="color" className="h-9 w-12 cursor-pointer" value={r.hex} onChange={(e) => setRow(i, 'hex', e.target.value)} /></td>
                  <td className="td"><input className="input w-20" type="number" min={0} dir="ltr" value={r.stock} onChange={(e) => setRow(i, 'stock', e.target.value)} required /></td>
                  <td className="td"><button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-danger" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn-outline" onClick={() => setRows([...rows, { sku: '', size: '', nameFa: '', nameEn: '', hex: '#111111', stock: '0' }])}>{t('admin.addVariant')}</button>
      </section>

      <button className="btn-primary px-8 py-3" disabled={busy || rows.length === 0}>{t('common.save')}</button>
    </form>
  );
}
