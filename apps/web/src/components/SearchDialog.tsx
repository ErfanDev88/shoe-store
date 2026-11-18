'use client';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { api, qs } from '@/lib/api';
import type { Paged, Product } from '@/lib/types';
import { useFmt } from '@/lib/use-fmt';
import { useUi } from '@/stores/ui';
import Modal from './Modal';
import { ImagePlaceholder } from './ui';

/** Live product search (debounced, stale responses ignored). Enter opens the full results page. */
export default function SearchDialog() {
  const t = useTranslations();
  const f = useFmt();
  const router = useRouter();
  const { searchOpen, setSearch } = useUi();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  const close = () => setSearch(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setItems([]); setLoading(false); return; }
    const id = ++seq.current;
    setLoading(true);
    const timer = setTimeout(() => {
      api<Paged<Product>>(`/products${qs({ q: term, limit: 5 })}`)
        .then((r) => { if (id === seq.current) setItems(r.items); })
        .catch(() => { if (id === seq.current) setItems([]); })
        .finally(() => { if (id === seq.current) setLoading(false); });
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    close();
    router.push(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <Modal open={searchOpen} onClose={close} side="top" label={t('nav.search')} closeButton={false}>
      <form onSubmit={submit} className="flex items-center gap-3 border-b px-5 py-4">
        <Search className="h-5 w-5 text-neutral-500" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} maxLength={100} placeholder={t('header.searchPlaceholder')} aria-label={t('nav.search')} className="w-full bg-transparent text-lg outline-none placeholder:text-neutral-400" />
        <kbd className="hidden rounded border px-1.5 text-xs text-neutral-500 sm:block">Esc</kbd>
      </form>
      <div className="max-h-[60dvh] overflow-auto p-2" aria-live="polite">
        {loading && <p className="p-6 text-center text-sm text-neutral-500">{t('common.loading')}</p>}
        {!loading && q.trim().length >= 2 && items.length === 0 && <p className="p-6 text-center text-sm text-neutral-500">{t('header.noResults')}</p>}
        {items.map((p) => (
          <Link key={p._id} href={`/products/${p.slug}`} onClick={close} className="flex items-center gap-4 rounded-xl p-2 hover:bg-neutral-100">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <ImagePlaceholder className="h-full w-full !p-2" />}
            </div>
            <div className="min-w-0 flex-1"><p className="text-xs text-neutral-500">{f.text(p.brand?.name)}</p><p className="truncate font-medium">{f.text(p.title)}</p></div>
            <b className="text-sm">{f.price(p.finalPrice)}</b>
          </Link>
        ))}
        {items.length > 0 && <button onClick={submit} className="mt-1 w-full rounded-xl p-3 text-center text-sm font-medium text-accent hover:bg-neutral-100">{t('header.searchAll')}</button>}
      </div>
    </Modal>
  );
}
