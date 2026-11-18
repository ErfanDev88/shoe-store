'use client';
import { useTranslations } from 'next-intl';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProduct() {
  const t = useTranslations();
  return (<div className="space-y-4"><h2>{t('admin.newProduct')}</h2><ProductForm /></div>);
}
