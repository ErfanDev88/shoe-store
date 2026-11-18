'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Field, Spinner } from '@/components/ui';
import { api, fetcher } from '@/lib/api';
import type { Named } from '@/lib/types';
import { useErrorText, useFmt } from '@/lib/use-fmt';

function Panel({ kind }: { kind: 'brands' | 'categories' }) {
  const t = useTranslations();
  const f = useFmt();
  const err = useErrorText();
  const { data, mutate } = useSWR<Named[]>(`/admin/${kind}`, fetcher);
  const [edit, setEdit] = useState<Named | 'new' | null>(null);
  const [v, setV] = useState({ fa: '', en: '', slug: '', parent: '', isActive: true });

  const open = (n: Named | 'new') => {
    setEdit(n);
    setV(n === 'new' ? { fa: '', en: '', slug: '', parent: '', isActive: true } : { fa: n.name.fa, en: n.name.en ?? '', slug: n.slug, parent: n.parent ?? '', isActive: n.isActive ?? true });
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = { name: { fa: v.fa, en: v.en }, isActive: v.isActive };
    if (kind === 'categories' && v.parent) body.parent = v.parent;
    if (edit === 'new' && v.slug) body.slug = v.slug;
    if (edit !== 'new' && edit && v.slug !== edit.slug) body.slug = v.slug;
    try {
      await api(edit === 'new' ? `/admin/${kind}` : `/admin/${kind}/${(edit as Named)._id}`, { method: edit === 'new' ? 'POST' : 'PATCH', json: body });
      setEdit(null); await mutate();
    } catch (x) { toast.error(err(x)); }
  };
  const remove = async (n: Named) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try { await api(`/admin/${kind}/${n._id}`, { method: 'DELETE' }); await mutate(); } catch (x) { toast.error(err(x)); }
  };

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-base">{t(kind === 'brands' ? 'admin.brands' : 'admin.categories')}</h2><button className="btn-outline" onClick={() => open('new')}>{t('common.add')}</button></div>
      {edit && (
        <form onSubmit={save} className="grid gap-3 rounded-lg bg-neutral-50 p-3 sm:grid-cols-2">
          <Field label={t('admin.titleFa')}><input className="input" required value={v.fa} onChange={(e) => setV({ ...v, fa: e.target.value })} /></Field>
          <Field label={t('admin.titleEn')}><input className="input" dir="ltr" value={v.en} onChange={(e) => setV({ ...v, en: e.target.value })} /></Field>
          <Field label={t('admin.slug')}><input className="input" dir="ltr" placeholder="auto" pattern="[a-z0-9]+(-[a-z0-9]+)*" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} /></Field>
          {kind === 'categories' && (
            <Field label={t('admin.parent')}><select className="input" value={v.parent} onChange={(e) => setV({ ...v, parent: e.target.value })}><option value="">—</option>{data?.filter((c) => !c.parent && c._id !== (edit as Named)._id).map((c) => (<option key={c._id} value={c._id}>{f.text(c.name)}</option>))}</select></Field>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.isActive} onChange={(e) => setV({ ...v, isActive: e.target.checked })} />{t('admin.active')}</label>
          <div className="flex gap-2 sm:col-span-2"><button className="btn-primary">{t('common.save')}</button><button type="button" className="btn-outline" onClick={() => setEdit(null)}>{t('common.cancel')}</button></div>
        </form>
      )}
      {!data ? <Spinner /> : (
        <ul className="divide-y text-sm">
          {data.map((n) => (
            <li key={n._id} className="flex items-center justify-between py-2">
              <span>{n.parent ? '↳ ' : ''}{f.text(n.name)} <span className="text-xs text-neutral-400" dir="ltr">{n.slug}</span>{!n.isActive && <span className="ms-2 rounded bg-neutral-200 px-1.5 text-xs">{t('admin.inactive')}</span>}</span>
              <span className="flex gap-3"><button className="text-brand" onClick={() => open(n)}>{t('common.edit')}</button><button className="text-danger" onClick={() => remove(n)}>{t('common.remove')}</button></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Taxonomy() {
  const t = useTranslations();
  return (<div className="space-y-4"><h2 className="sr-only">{t('admin.nav.taxonomy')}</h2><div className="grid gap-4 lg:grid-cols-2"><Panel kind="brands" /><Panel kind="categories" /></div></div>);
}
