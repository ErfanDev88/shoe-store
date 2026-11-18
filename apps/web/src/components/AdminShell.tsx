'use client';
import { BarChart3, Boxes, CreditCard, Gift, Layers, ListChecks, LogOut, Mail, Menu, MessageSquare, Package, Store, Tag, Truck, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useAuth } from '@/stores/auth';
import Logo from './Logo';
import Modal from './Modal';
import ThemeToggle from './ThemeToggle';
import { Spinner } from './ui';

const ITEMS = [
  { href: '/admin', key: 'dashboard', roles: ['admin'], icon: BarChart3 },
  { href: '/admin/orders', key: 'orders', roles: ['admin', 'support'], icon: Package },
  { href: '/admin/products', key: 'products', roles: ['admin', 'content'], icon: Boxes },
  { href: '/admin/taxonomy', key: 'taxonomy', roles: ['admin', 'content'], icon: Layers },
  { href: '/admin/reviews', key: 'reviews', roles: ['admin', 'content'], icon: MessageSquare },
  { href: '/admin/coupons', key: 'coupons', roles: ['admin'], icon: Tag },
  { href: '/admin/shipping', key: 'shipping', roles: ['admin'], icon: Truck },
  { href: '/admin/users', key: 'users', roles: ['admin'], icon: Users },
  { href: '/admin/payments', key: 'payments', roles: ['admin'], icon: CreditCard },
  { href: '/admin/newsletter', key: 'newsletter', roles: ['admin'], icon: Mail },
  { href: '/admin/audit', key: 'audit', roles: ['admin'], icon: ListChecks },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const user = useRequireAuth(['admin', 'content', 'support']);
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  if (!user) return <Spinner />;

  const items = ITEMS.filter((i) => i.roles.includes(user.role));
  const active = (href: string) => pathname === href || (href !== '/admin' && pathname.startsWith(href));
  const current = items.find((i) => active(i.href));

  const nav = (
    <nav className="flex flex-col gap-1" aria-label={t('admin.panel')}>
      {items.map(({ href, key, icon: Icon }) => (
        <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${active(href) ? 'bg-brand text-brand-fg' : 'text-neutral-600 hover:bg-neutral-100 hover:text-fg'}`}>
          <Icon className="h-[18px] w-[18px]" />{t(`admin.nav.${key}`)}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-e bg-surface p-5 lg:flex">
        <Link href="/admin" aria-label="SOLE STORE admin"><Logo /></Link>
        <p className="eyebrow !text-neutral-500">{t('admin.panel')} · {t(`role.${user.role}`)}</p>
        {nav}
        <div className="mt-auto space-y-1 border-t pt-4 text-sm">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-neutral-600 hover:bg-neutral-100"><Store className="h-[18px] w-[18px]" />{t('admin.viewStore')}</Link>
          <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-danger hover:bg-neutral-100" onClick={() => logout().then(() => router.push('/'))}><LogOut className="h-[18px] w-[18px]" />{t('nav.logout')}</button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-bg/80 px-4 py-3 backdrop-blur-xl md:px-8">
          <button className="icon-btn lg:hidden" onClick={() => setOpen(true)} aria-label={t('header.menu')}><Menu className="h-5 w-5" /></button>
          <h1 className="!text-lg">{current ? t(`admin.nav.${current.key}`) : t('admin.panel')}</h1>
          <div className="ms-auto flex items-center gap-1">
            <ThemeToggle />
            <Link href={pathname} locale={locale === 'fa' ? 'en' : 'fa'} className="icon-btn text-xs font-bold">{locale === 'fa' ? 'EN' : 'FA'}</Link>
            <span className="ms-2 hidden text-sm text-neutral-500 sm:block" dir="ltr">{user.phone ?? user.email}</span>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-8">{children}</main>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} side="end" label={t('header.menu')}>
        <div className="space-y-5 p-5 pt-14"><Logo />{nav}
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-neutral-600 hover:bg-neutral-100"><Store className="h-[18px] w-[18px]" />{t('admin.viewStore')}</Link></div>
      </Modal>
    </div>
  );
}
