'use client';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import ProductForm from '@/components/admin/ProductForm';
import { Spinner } from '@/components/ui';
import { fetcher } from '@/lib/api';
import type { Product } from '@/lib/types';

export default function EditProduct() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
  const { data } = useSWR<Product>(`/admin/products/${id}`, fetcher, { revalidateOnFocus: false });
  if (!data) return <Spinner />;
  return (<div className="space-y-4"><h2>{t('common.edit')}</h2><ProductForm product={data} /></div>);
}
