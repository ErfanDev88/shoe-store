'use client';
import { useTranslations } from 'next-intl';
import { useFmt } from '@/lib/use-fmt';
import Modal from './Modal';

// EU (Paris point) -> foot length in cm: L = EU / 1.5 - 1.5 (standard conversion)
const SIZES = Array.from({ length: 15 }, (_, i) => 34 + i * 1);

export default function SizeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations();
  const f = useFmt();
  return (
    <Modal open={open} onClose={onClose} side="sm" label={t('product.sizeGuide')}>
      <div className="space-y-5 p-6 pt-12">
        <h2>{t('product.sizeGuide')}</h2>
        <ol className="list-decimal space-y-1 ps-5 text-sm leading-7 text-neutral-600">
          <li>{t('product.sizeStep1')}</li><li>{t('product.sizeStep2')}</li><li>{t('product.sizeStep3')}</li>
        </ol>
        <div className="max-h-72 overflow-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-neutral-100"><tr><th className="th">EU</th><th className="th">{t('product.footLength')}</th></tr></thead>
            <tbody className="divide-y">{SIZES.map((s) => (<tr key={s}><td className="td font-semibold">{f.num(s)}</td><td className="td">{f.num(Math.round((s / 1.5 - 1.5) * 10) / 10)} cm</td></tr>))}</tbody>
          </table>
        </div>
        <p className="text-xs text-neutral-500">{t('product.sizeNote')}</p>
      </div>
    </Modal>
  );
}
