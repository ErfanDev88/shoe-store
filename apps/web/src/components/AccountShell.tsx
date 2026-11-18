'use client';
import { Heart, Package, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useRequireAuth } from '@/lib/use-require-auth';
import { Spinner } from './ui';

export default function AccountShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const user = useRequireAuth();
  if (!user) return <Spinner />;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.phone || user.email || '';
  const items = [
    { href: '/account', label: t('account.profile'), icon: User },
    { href: '/account/orders', label: t('nav.orders'), icon: Package },
    { href: '/account/wishlist', label: t('nav.wishlist'), icon: Heart },
  ];
  return (
    <div className="container-page grid gap-8 md:grid-cols-[240px_1fr]">
      <aside className="no-print space-y-5">
        <div className="flex items-center gap-3 rounded-2xl border bg-surface p-4">
          <span className="display flex h-11 w-11 items-center justify-center rounded-full bg-brand text-lg text-brand-fg" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
          <div className="min-w-0"><p className="truncate font-semibold">{name}</p><p className="truncate text-xs text-neutral-500" dir="ltr">{user.email ?? user.phone}</p></div>
        </div>
        <nav className="flex gap-2 overflow-x-auto md:flex-col" aria-label={t('nav.account')}>
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/account' && pathname.startsWith(href));
            return (<Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${active ? 'bg-brand text-brand-fg' : 'hover:bg-neutral-100'}`}><Icon className="h-4 w-4" />{label}</Link>);
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
