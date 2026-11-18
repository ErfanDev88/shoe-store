'use client';
import { m } from 'framer-motion';
import { Banknote, CalendarRange, MessageSquare, Package, ShoppingBag, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import useSWR from 'swr';
import StatusBadge from '@/components/StatusBadge';
import { Spinner } from '@/components/ui';
import { Link, useRouter } from '@/i18n/routing';
import { fetcher } from '@/lib/api';
import type { Localized, OrderStatus } from '@/lib/types';
import { useFmt } from '@/lib/use-fmt';
import { useAuth } from '@/stores/auth';

interface Stats {
  revenue: { total: number; orders: number; last30: number; ordersLast30: number };
  ordersByStatus: Record<string, number>; users: { total: number; last30: number }; pendingReviews: number;
  lowStock: { productId: string; title: Localized; sku: string; size: number; stock: number }[];
  salesByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { _id: string; title: Localized; quantity: number; revenue: number }[];
  recentOrders?: { _id: string; orderNumber: string; total: number; status: OrderStatus; createdAt: string; shippingAddress?: { receiver?: string } }[];
}

// full literal class names (Tailwind only generates classes it can see in the source)
const DONUT: Record<string, { stroke: string; dot: string }> = {
  pending_payment: { stroke: 'stroke-warning', dot: 'bg-warning' }, paid: { stroke: 'stroke-info', dot: 'bg-info' },
  processing: { stroke: 'stroke-violet', dot: 'bg-violet' }, shipped: { stroke: 'stroke-accent', dot: 'bg-accent' },
  delivered: { stroke: 'stroke-success', dot: 'bg-success' }, cancelled: { stroke: 'stroke-neutral-400', dot: 'bg-neutral-400' },
  returned: { stroke: 'stroke-danger', dot: 'bg-danger' },
};

export default function Dashboard() {
  const t = useTranslations();
  const f = useFmt();
  const router = useRouter();
  const role = useAuth((s) => s.user?.role);
  useEffect(() => { if (role === 'content') router.replace('/admin/products'); if (role === 'support') router.replace('/admin/orders'); }, [role, router]);
  const { data: s } = useSWR<Stats>(role === 'admin' ? '/admin/stats' : null, fetcher);
  if (!s) return <Spinner />;

  const max = Math.max(1, ...s.salesByDay.map((d) => d.revenue));
  const total = Object.values(s.ordersByStatus).reduce((a, b) => a + b, 0);
  let cum = 0;
  const cards = [
    { icon: Banknote, label: t('admin.revenueTotal'), value: f.price(s.revenue.total) },
    { icon: CalendarRange, label: t('admin.revenue30'), value: f.price(s.revenue.last30) },
    { icon: ShoppingBag, label: t('admin.ordersPaid'), value: f.num(s.revenue.orders), href: '/admin/orders' },
    { icon: Users, label: t('admin.usersTotal'), value: `${f.num(s.users.total)} (+${f.num(s.users.last30)})`, href: '/admin/users' },
    { icon: Package, label: t('status.paid'), value: f.num((s.ordersByStatus.paid ?? 0) + (s.ordersByStatus.processing ?? 0)), href: '/admin/orders?status=paid' },
    { icon: MessageSquare, label: t('admin.pendingReviews'), value: f.num(s.pendingReviews), href: '/admin/reviews' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
        {cards.map((c, i) => {
          const body = (
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.05 }} className="card flex items-start justify-between gap-3 transition hover:border-fg">
              <div><p className="text-xs text-neutral-500">{c.label}</p><p className="mt-2 text-lg font-extrabold md:text-2xl">{c.value}</p></div>
              <span className="rounded-xl bg-accent/15 p-2.5 text-accent"><c.icon className="h-5 w-5" /></span>
            </m.div>
          );
          return c.href ? <Link key={c.label} href={c.href}>{body}</Link> : <div key={c.label}>{body}</div>;
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="card">
          <h2 className="mb-5 text-base">{t('admin.sales30')}</h2>
          {s.salesByDay.length === 0 ? <p className="py-10 text-center text-sm text-neutral-500">{t('common.noData')}</p> : (
            <>
              <div className="flex h-48 items-end gap-1.5">
                {s.salesByDay.map((d, i) => (
                  <m.div key={d.date} title={`${d.date}: ${f.price(d.revenue)} · ${f.num(d.orders)}`} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%`, originY: 1 }} transition={{ duration: 0.6, delay: 0.2 + i * 0.02, ease: [0.2, 0.8, 0.2, 1] }} className="flex-1 rounded-t-md bg-brand/80 transition hover:bg-accent" />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-neutral-500" dir="ltr"><span>{s.salesByDay[0].date}</span><span>{s.salesByDay[s.salesByDay.length - 1].date}</span></div>
            </>
          )}
        </section>

        <section className="card">
          <h2 className="mb-5 text-base">{t('admin.ordersByStatus')}</h2>
          {total === 0 ? <p className="py-10 text-center text-sm text-neutral-500">{t('common.noData')}</p> : (
            <m.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="flex items-center gap-5">
              <svg viewBox="0 0 36 36" className="h-32 w-32 shrink-0 -rotate-90" role="img" aria-label={t('admin.ordersByStatus')}>
                <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="4" className="stroke-neutral-200" />
                {Object.entries(s.ordersByStatus).map(([k, v]) => {
                  const len = (v / total) * 100;
                  const el = <circle key={k} cx="18" cy="18" r="15.9155" fill="none" strokeWidth="4" strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={-cum} className={DONUT[k]?.stroke ?? 'stroke-neutral-400'} />;
                  cum += len;
                  return el;
                })}
              </svg>
              <ul className="flex-1 space-y-1.5 text-xs">{Object.entries(s.ordersByStatus).map(([k, v]) => (<li key={k} className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${DONUT[k]?.dot ?? 'bg-neutral-400'}`} />{t(`status.${k}`)}</span><b>{f.num(v)}</b></li>))}</ul>
            </m.div>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card overflow-x-auto">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-base">{t('admin.recentOrders')}</h2><Link href="/admin/orders" className="link-u text-xs">{t('common.viewAll')}</Link></div>
          {(s.recentOrders ?? []).length === 0 ? <p className="py-6 text-center text-sm text-neutral-500">{t('common.noData')}</p> : (
            <table className="w-full"><tbody className="divide-y">{s.recentOrders!.map((o) => (
              <tr key={o._id}><td className="td"><Link href={`/admin/orders/${o._id}`} className="font-bold" dir="ltr">{o.orderNumber}</Link><br /><span className="text-xs text-neutral-500">{o.shippingAddress?.receiver}</span></td><td className="td"><StatusBadge status={o.status} /></td><td className="td text-end font-semibold">{f.price(o.total)}</td></tr>))}</tbody></table>
          )}
        </section>
        <div className="grid gap-4">
          <section className="card"><h2 className="mb-3 text-base">{t('admin.topProducts')}</h2>
            {s.topProducts.map((p) => (<div key={p._id} className="flex justify-between gap-3 border-b py-2 text-sm last:border-0"><span className="truncate">{f.text(p.title)}</span><span className="shrink-0 text-neutral-500">{f.num(p.quantity)} × · {f.price(p.revenue)}</span></div>))}
            {s.topProducts.length === 0 && <p className="py-4 text-center text-sm text-neutral-500">{t('common.noData')}</p>}</section>
          <section className="card"><h2 className="mb-3 text-base">{t('admin.lowStock')}</h2>
            {s.lowStock.slice(0, 6).map((p) => (<Link key={p.sku} href={`/admin/products/${p.productId}`} className="flex justify-between gap-3 border-b py-2 text-sm last:border-0 hover:bg-neutral-100"><span className="truncate">{f.text(p.title)} · {f.num(p.size)}</span><span className={p.stock === 0 ? 'text-danger' : 'text-warning'}>{f.num(p.stock)}</span></Link>))}
            {s.lowStock.length === 0 && <p className="py-4 text-center text-sm text-neutral-500">{t('common.noData')}</p>}</section>
        </div>
      </div>
    </div>
  );
}
