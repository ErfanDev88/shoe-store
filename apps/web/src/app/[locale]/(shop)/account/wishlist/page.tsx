'use client';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import ProductGrid from '@/components/ProductGrid';
import { Empty, Spinner } from '@/components/ui';
import { fetcher } from '@/lib/api';
import type { Product } from '@/lib/types';
import { useWishlist } from '@/stores/wishlist';

export default function WishlistPage() {
  const t = useTranslations();
  const ids = useWishlist((s) => s.ids);
  const { data } = useSWR<Product[]>('/wishlist', fetcher);
  if (!data) return <Spinner />;
  const items = data.filter((p) => ids.includes(p._id)); // un-liking removes the card immediately
  return (<div className="space-y-4"><h1>{t('nav.wishlist')}</h1>{items.length ? <ProductGrid items={items} /> : <Empty text={t('wishlist.empty')} />}</div>);
}
