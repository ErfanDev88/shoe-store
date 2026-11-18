'use client';
import { useTranslations } from 'next-intl';
import type { OrderStatus } from '@/lib/types';

const COLORS: Record<OrderStatus, string> = {
  pending_payment: 'bg-warning/15 text-warning', paid: 'bg-info/15 text-info', processing: 'bg-violet/15 text-violet',
  shipped: 'bg-accent/15 text-accent', delivered: 'bg-success/15 text-success', cancelled: 'bg-neutral-200 text-neutral-600', returned: 'bg-danger/15 text-danger',
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations();
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status]}`}>{t(`status.${status}`)}</span>;
}
