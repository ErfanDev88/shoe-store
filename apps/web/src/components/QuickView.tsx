'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useFmt } from '@/lib/use-fmt';
import type { Product } from '@/lib/types';
import BuyBox from './BuyBox';
import Img from './Img';
import Modal from './Modal';
import { ImagePlaceholder } from './ui';

export default function QuickView({ product: p, onClose }: { product: Product; onClose: () => void }) {
  const t = useTranslations();
  const f = useFmt();
  return (
    <Modal open onClose={onClose} label={f.text(p.title)}>
      <div className="grid gap-6 p-5 md:grid-cols-2 md:p-8">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
          {p.images[0] ? <Img src={p.images[0]} alt={f.text(p.title)} sizes="(min-width: 768px) 440px, 90vw" className="object-cover" /> : <ImagePlaceholder className="h-full w-full" />}
        </div>
        <div className="space-y-5 md:pt-6">
          <div><p className="eyebrow">{f.text(p.brand?.name)}</p><h2 className="mt-1 text-2xl">{f.text(p.title)}</h2></div>
          <BuyBox product={p} showHeader={false} onAdded={onClose} />
          <Link href={`/products/${p.slug}`} onClick={onClose} className="inline-block text-sm font-medium underline underline-offset-4">{t('product.viewDetails')}</Link>
        </div>
      </div>
    </Modal>
  );
}
